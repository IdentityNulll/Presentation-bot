const { Presentation, Slide, User, Template, Export, Setting, logSystemEvent } = require('../services/dbService');
const { generatePresentationStructure, regenerateSingleSlide } = require('../services/aiService');
const { generatePPTX, generatePDF } = require('../services/exportService');
const { THEMES } = require('../../shared/themes');
const logger = require('../utils/logger');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary if credentials exist
const configureCloudinary = async () => {
  try {
    const settings = await Setting.find();
    const settingsMap = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });

    const cloudName = settingsMap.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = settingsMap.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY;
    const apiSecret = settingsMap.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret
      });
      logger.info('Cloudinary configured successfully.');
      return true;
    }
    logger.warn('Cloudinary environment keys are missing. Uploads will fall back to local data URIs.');
    return false;
  } catch (e) {
    logger.error('Error configuring Cloudinary: %O', e);
    return false;
  }
};

// Auto-run configuration on controller start
configureCloudinary();

/**
 * Returns available styles and themes
 */
async function getTemplates(req, res, next) {
  try {
    const templates = Object.keys(THEMES).map(key => ({
      name: THEMES[key].name,
      style: key.charAt(0).toUpperCase() + key.slice(1),
      theme: THEMES[key]
    }));
    return res.json(templates);
  } catch (error) {
    next(error);
  }
}

/**
 * Generates a presentation based on title, audience, and style
 */
async function generatePresentation(req, res, next) {
  const { title, audience, style, topic } = req.body;
  const userId = req.user._id;

  if (!title || !audience || !style || !topic) {
    return res.status(400).json({ error: 'title, audience, style, and topic are required.' });
  }

  try {
    // Check limits for FREE users
    if (req.user.subscription === 'FREE') {
      const count = await Presentation.countDocuments({ userId });
      if (count >= 5) {
        return res.status(403).json({ error: '⚠️ You have reached the limit of 5 presentations for FREE accounts.' });
      }
    }

    // Call AI service
    const generated = await generatePresentationStructure(topic, title, audience, style, 6, 'en', userId);

    // Save Presentation
    const themeConfig = THEMES[style.toLowerCase()] || THEMES.professional;
    const presentation = await Presentation.create({
      title: generated.title,
      topic: generated.topic,
      style: generated.style,
      audience: generated.audience,
      slideCount: generated.slides.length,
      userId,
      theme: {
        name: style,
        bg: themeConfig.bg,
        text: themeConfig.text,
        accent: themeConfig.accent,
        fontTitle: themeConfig.fontTitle,
        fontBody: themeConfig.fontBody
      }
    });

    // Save Slides
    const slidesData = generated.slides.map(s => ({
      presentationId: presentation._id,
      order: s.order,
      type: s.type,
      title: s.title,
      description: s.description,
      content: s.content,
      speakerNotes: s.speakerNotes,
      imagePrompt: s.imagePrompt,
      suggestedVisuals: s.suggestedVisuals,
      imageUrl: null
    }));

    const slides = await Slide.insertMany(slidesData);

    await logSystemEvent('ai_generation', { topic, title, presentationId: presentation._id }, userId);

    return res.status(201).json({
      presentation,
      slides
    });
  } catch (error) {
    logger.error('Failed to generate presentation: %O', error);
    next(error);
  }
}

/**
 * Gets all presentations of the user
 */
async function getPresentations(req, res, next) {
  try {
    const list = await Presentation.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.json(list);
  } catch (error) {
    next(error);
  }
}

/**
 * Gets full presentation detail with slides
 */
async function getPresentationDetails(req, res, next) {
  const { id } = req.params;
  try {
    const presentation = await Presentation.findById(id);
    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }
    const slides = await Slide.find({ presentationId: id }).sort({ order: 1 });
    return res.json({ presentation, slides });
  } catch (error) {
    next(error);
  }
}

/**
 * Updates presentation title and theme/colors
 */
async function updatePresentation(req, res, next) {
  const { id } = req.params;
  const { title, theme, style } = req.body;
  try {
    const pres = await Presentation.findById(id);
    if (!pres) return res.status(404).json({ error: 'Presentation not found.' });

    if (title) pres.title = title;
    if (style) pres.style = style;
    if (theme) pres.theme = { ...pres.theme, ...theme };

    await pres.save();
    return res.json(pres);
  } catch (error) {
    next(error);
  }
}

/**
 * Adds a new slide to the presentation
 */
async function addSlide(req, res, next) {
  const { id } = req.params;
  try {
    const slideCount = await Slide.countDocuments({ presentationId: id });
    const slide = await Slide.create({
      presentationId: id,
      order: slideCount,
      type: 'TwoColumn',
      title: 'New Slide',
      content: '• Point 1\n• Point 2',
      speakerNotes: 'Enter notes here.',
      imagePrompt: 'illustration of workspace'
    });

    await Presentation.findByIdAndUpdate(id, { $inc: { slideCount: 1 } });
    return res.status(201).json(slide);
  } catch (error) {
    next(error);
  }
}

/**
 * Updates a slide
 */
async function updateSlide(req, res, next) {
  const { slideId } = req.params;
  const { title, type, description, content, speakerNotes, imageUrl, imagePrompt, suggestedVisuals } = req.body;
  try {
    const slide = await Slide.findById(slideId);
    if (!slide) return res.status(404).json({ error: 'Slide not found.' });

    if (title !== undefined) slide.title = title;
    if (type !== undefined) slide.type = type;
    if (description !== undefined) slide.description = description;
    if (content !== undefined) slide.content = content;
    if (speakerNotes !== undefined) slide.speakerNotes = speakerNotes;
    if (imageUrl !== undefined) slide.imageUrl = imageUrl;
    if (imagePrompt !== undefined) slide.imagePrompt = imagePrompt;
    if (suggestedVisuals !== undefined) slide.suggestedVisuals = suggestedVisuals;

    await slide.save();
    return res.json(slide);
  } catch (error) {
    next(error);
  }
}

/**
 * Deletes a slide
 */
async function deleteSlide(req, res, next) {
  const { id, slideId } = req.params;
  try {
    const slideToDelete = await Slide.findById(slideId);
    if (!slideToDelete) return res.status(404).json({ error: 'Slide not found.' });

    const orderDeleted = slideToDelete.order;
    await Slide.deleteOne({ _id: slideId });

    // Reorder subsequent slides
    await Slide.updateMany(
      { presentationId: id, order: { $gt: orderDeleted } },
      { $inc: { order: -1 } }
    );

    await Presentation.findByIdAndUpdate(id, { $inc: { slideCount: -1 } });
    return res.json({ message: 'Slide deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

/**
 * Duplicates a slide
 */
async function duplicateSlide(req, res, next) {
  const { id, slideId } = req.params;
  try {
    const slideToDup = await Slide.findById(slideId);
    if (!slideToDup) return res.status(404).json({ error: 'Slide not found.' });

    const newOrder = slideToDup.order + 1;

    // Shift orders up
    await Slide.updateMany(
      { presentationId: id, order: { $gte: newOrder } },
      { $inc: { order: 1 } }
    );

    // Create copy
    const copy = await Slide.create({
      presentationId: id,
      order: newOrder,
      type: slideToDup.type,
      title: `${slideToDup.title} (Copy)`,
      description: slideToDup.description,
      content: slideToDup.content,
      speakerNotes: slideToDup.speakerNotes,
      imagePrompt: slideToDup.imagePrompt,
      imageUrl: slideToDup.imageUrl,
      suggestedVisuals: slideToDup.suggestedVisuals
    });

    await Presentation.findByIdAndUpdate(id, { $inc: { slideCount: 1 } });
    return res.status(201).json(copy);
  } catch (error) {
    next(error);
  }
}

/**
 * Reorders slides
 */
async function reorderSlides(req, res, next) {
  const { id } = req.params;
  const { slideIds } = req.body; // Array of Slide IDs in desired order

  if (!slideIds || !Array.isArray(slideIds)) {
    return res.status(400).json({ error: 'slideIds must be an array.' });
  }

  try {
    const bulkOps = slideIds.map((slideId, index) => ({
      updateOne: {
        filter: { _id: slideId, presentationId: id },
        update: { $set: { order: index } }
      }
    }));

    await Slide.bulkWrite(bulkOps);
    const updatedSlides = await Slide.find({ presentationId: id }).sort({ order: 1 });
    return res.json(updatedSlides);
  } catch (error) {
    next(error);
  }
}

/**
 * Regenerates a single slide with AI
 */
async function regenerateSlide(req, res, next) {
  const { id, slideId } = req.params;
  try {
    const pres = await Presentation.findById(id);
    if (!pres) return res.status(404).json({ error: 'Presentation not found.' });

    const slide = await Slide.findById(slideId);
    if (!slide) return res.status(404).json({ error: 'Slide not found.' });

    const regenerated = await regenerateSingleSlide(
      pres.topic,
      pres.audience,
      pres.style,
      slide.title,
      slide.content,
      req.user._id
    );

    slide.title = regenerated.title;
    slide.type = regenerated.type;
    slide.description = regenerated.description;
    slide.content = regenerated.content;
    slide.speakerNotes = regenerated.speakerNotes;
    slide.imagePrompt = regenerated.imagePrompt;
    slide.suggestedVisuals = regenerated.suggestedVisuals;

    await slide.save();
    return res.json(slide);
  } catch (error) {
    next(error);
  }
}

/**
 * Suggests stock images based on keywords from Unsplash and Pexels
 */
async function suggestImages(req, res, next) {
  const query = req.query.query || 'office workspace';
  const settings = await Setting.find();
  const settingsMap = {};
  settings.forEach(s => { settingsMap[s.key] = s.value; });

  const unsplashKey = settingsMap.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_ACCESS_KEY;
  const pexelsKey = settingsMap.PEXELS_API_KEY || process.env.PEXELS_API_KEY;

  const results = [];

  try {
    // 1. Try Unsplash API
    if (unsplashKey) {
      try {
        const response = await axios.get(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10`,
          { headers: { 'Authorization': `Client-ID ${unsplashKey}` } }
        );
        if (response.data?.results) {
          response.data.results.forEach(img => {
            results.push({
              source: 'Unsplash',
              id: img.id,
              url: img.urls.regular,
              thumb: img.urls.small,
              author: img.user.name,
              link: img.links.html
            });
          });
        }
      } catch (err) {
        logger.error('Unsplash query failed: %s', err.message);
      }
    }

    // 2. Try Pexels API
    if (pexelsKey && results.length < 5) {
      try {
        const response = await axios.get(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10`,
          { headers: { 'Authorization': pexelsKey } }
        );
        if (response.data?.photos) {
          response.data.photos.forEach(img => {
            results.push({
              source: 'Pexels',
              id: img.id,
              url: img.src.large2x,
              thumb: img.src.medium,
              author: img.photographer,
              link: img.url
            });
          });
        }
      } catch (err) {
        logger.error('Pexels query failed: %s', err.message);
      }
    }

    // 3. Fallback: Curated dynamic Unsplash URLs if keys are missing
    if (results.length === 0) {
      // Return a set of premium Unsplash placeholder IDs mapping to keywords
      const placeholders = [
        { id: 'photo-1557804506-669a67965ba0', desc: 'Team meeting work' },
        { id: 'photo-1454165804606-c3d57bc86b40', desc: 'Business analysis charts' },
        { id: 'photo-1517245386807-bb43f82c33c4', desc: 'Creative brainstorm' },
        { id: 'photo-1531403009284-440f080d1e12', desc: 'Infographic visual' },
        { id: 'photo-1507537297725-24a1c029d3ca', desc: 'Corporate presentation' },
        { id: 'photo-1522202176988-66273c2fd55f', desc: 'Students learning' },
        { id: 'photo-1516321318423-f06f85e504b3', desc: 'Digital platform' },
        { id: 'photo-1551836022-d5d88e9218df', desc: 'Teacher coaching' }
      ];

      placeholders.forEach((pl, idx) => {
        results.push({
          source: 'System Curated',
          id: pl.id,
          url: `https://images.unsplash.com/${pl.id}?auto=format&fit=crop&w=1200&q=80`,
          thumb: `https://images.unsplash.com/${pl.id}?auto=format&fit=crop&w=400&q=80`,
          author: `Curated Photographer`,
          link: `https://unsplash.com/photos/${pl.id}`
        });
      });
    }

    return res.json(results);
  } catch (error) {
    next(error);
  }
}

/**
 * Handles custom slide image uploads directly to Cloudinary or base64 fallback
 */
async function uploadImage(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }

  try {
    // Check if Cloudinary is configured
    const isConfigured = await configureCloudinary();
    if (isConfigured) {
      // Upload buffer directly to Cloudinary
      const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'presentation_bot_assets' },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      const uploadResult = await uploadPromise;
      return res.json({ imageUrl: uploadResult.secure_url });
    } else {
      // Fallback: Convert to base64 Data URI
      const base64Data = req.file.buffer.toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${base64Data}`;
      return res.json({ imageUrl: dataUri });
    }
  } catch (error) {
    logger.error('Failed to upload image: %O', error);
    return res.status(500).json({ error: 'Failed to upload image to storage.' });
  }
}

/**
 * Handles PPTX and PDF exports
 */
async function exportPresentation(req, res, next) {
  const { id, format } = req.params;
  const upperFormat = format.toUpperCase();

  if (upperFormat !== 'PPTX' && upperFormat !== 'PDF') {
    return res.status(400).json({ error: 'Invalid format. Supported: PPTX, PDF' });
  }

  try {
    const pres = await Presentation.findById(id);
    if (!pres) return res.status(404).json({ error: 'Presentation not found.' });

    const slides = await Slide.find({ presentationId: id }).sort({ order: 1 });
    if (slides.length === 0) {
      return res.status(400).json({ error: 'Presentation has no slides to export.' });
    }

    let buffer;
    let contentType;
    let filenameExtension;

    if (upperFormat === 'PPTX') {
      buffer = await generatePPTX(pres, slides, { includeTOC: true });
      contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      filenameExtension = 'pptx';
    } else {
      buffer = await generatePDF(pres, slides, { includeTOC: true });
      contentType = 'application/pdf';
      filenameExtension = 'pdf';
    }

    // Log export
    await Export.create({
      userId: req.user._id,
      presentationId: pres._id,
      format: upperFormat
    });
    
    await logSystemEvent('export', { format: upperFormat, presentationId: pres._id }, req.user._id);

    const safeTitle = pres.title.replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.${filenameExtension}"`);
    res.setHeader('Content-Type', contentType);
    return res.send(buffer);
  } catch (error) {
    logger.error(`Export failed: ${error.message}`);
    next(error);
  }
}

module.exports = {
  getTemplates,
  generatePresentation,
  getPresentations,
  getPresentationDetails,
  updatePresentation,
  addSlide,
  updateSlide,
  deleteSlide,
  duplicateSlide,
  reorderSlides,
  regenerateSlide,
  suggestImages,
  uploadImage,
  exportPresentation
};
