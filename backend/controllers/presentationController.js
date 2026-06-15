const { Presentation, Slide, Export } = require('../services/dbService');
const logger = require('../utils/logger');

/**
 * Get paginated list of all generated presentations.
 */
async function getPresentations(req, res, next) {
  const search = req.query.search || '';
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  try {
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { audience: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Presentation.countDocuments(query);
    const presentations = await Presentation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username telegramId')
      .lean();

    const formatted = await Promise.all(presentations.map(async (p) => {
      const slideCount = await Slide.countDocuments({ presentationId: p._id });
      const exportCount = await Export.countDocuments({ presentationId: p._id });
      return {
        ...p,
        id: p._id,
        user: p.userId ? {
          username: p.userId.username,
          telegramId: p.userId.telegramId
        } : null,
        _count: {
          slides: slideCount,
          exports: exportCount
        }
      };
    }));

    return res.json({
      presentations: formatted,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single presentation details (including slides).
 */
async function getPresentationDetails(req, res, next) {
  const { id } = req.params;

  try {
    const presentation = await Presentation.findById(id)
      .populate('userId', 'username telegramId')
      .lean();

    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found.' });
    }

    const slides = await Slide.find({ presentationId: id }).sort({ order: 1 });

    return res.json({
      ...presentation,
      id: presentation._id,
      user: presentation.userId ? {
        username: presentation.userId.username,
        telegramId: presentation.userId.telegramId
      } : null,
      slides
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Force delete a presentation.
 */
async function deletePresentation(req, res, next) {
  const { id } = req.params;

  try {
    const presentation = await Presentation.findByIdAndDelete(id);
    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found.' });
    }

    // Cascade delete slides and exports
    await Slide.deleteMany({ presentationId: id });
    await Export.deleteMany({ presentationId: id });

    logger.info(`Presentation '${presentation.title}' (${presentation._id}) deleted by admin.`);
    return res.json({ message: 'Presentation deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPresentations,
  getPresentationDetails,
  deletePresentation
};
