const axios = require('axios');
const { Setting, logSystemEvent } = require('./dbService');
const { generateLocalPresentation } = require('../shared/presentationTemplates');
const logger = require('../utils/logger');

/**
 * Get active system settings.
 */
async function getSettings() {
  try {
    const settings = await Setting.find();
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    return settingsMap;
  } catch (error) {
    logger.error('Error fetching settings from DB: %O', error);
    return {};
  }
}

/**
 * Generates a complete presentation structure using AI or local fallback.
 * @param {string} topic - Topic of presentation
 * @param {string} title - Optional specific title
 * @param {string} audience - Target audience (Students, Teachers, Business, Investors, General)
 * @param {string} style - Presentation style (Modern, Professional, Academic, Startup Pitch, Minimalist, Dark Theme, Creative, Corporate)
 * @param {number} slideCount - Number of slides
 * @param {string} language - Target language
 * @param {string} userId - User Mongoose ObjectId running the generation
 */
async function generatePresentationStructure(topic, title, audience, style, slideCount = 6, language = 'en', userId = null) {
  const settings = await getSettings();
  const provider = settings.AI_PROVIDER || 'local';

  logger.info(`Generating presentation structure. Topic: "${topic}", Provider: ${provider}, Count: ${slideCount}`);

  if (provider === 'local') {
    logger.info('Using local fallback generation.');
    await logSystemEvent('AI_GENERATION_LOCAL', `Local presentation generated for topic: ${topic}`, userId);
    return generateLocalPresentation(topic, title, audience, style, slideCount);
  }

  const prompt = `
Generate a professional presentation structure in the "${language}" language. All titles, content bullets, speaker notes, descriptions, and suggested visuals MUST be generated in the "${language}" language (ru for Russian, en for English, uz for Uzbek).

Topic: "${topic}"
Target Presentation Title: "${title || `Overview of ${topic}`}"
Audience: ${audience}
Style/Theme: ${style}
Number of Slides: ${slideCount}

You MUST follow these specific slide structure rules:
1. First slide (order 0) MUST be layout type 'Cover'.
2. The deck MUST contain at least one Comparison/Table slide (layout type 'Comparison' or 'TwoColumn') that professionally divides the presentation/topic into 3 distinct plans (e.g. Starter/Standard/Premium or Plan A/Plan B/Plan C), outlining features and options.
3. The deck MUST contain at least one Q&A slide (layout type 'TwoColumn') featuring key questions about the topic and their corresponding answers.
4. The rest of the slides should be general content slides explaining the topic with professional depth.

For each slide, choose the most appropriate layout type from this list:
- 'Cover' (Used ONLY for the first slide)
- 'TwoColumn' (Two columns of bullet points)
- 'ImageLeft' (Image on left side, text/bullets on right)
- 'ImageRight' (Image on right side, text/bullets on left)
- 'FullImage' (Slide covered by a background image with overlay text)
- 'Quote' (Large centered text citing a statement or phrase)
- 'Statistics' (Showcases large numbers, data points, or charts)
- 'Timeline' (A progressive sequence of items)
- 'Comparison' (Table-like or grid comparison of features)
- 'Team' (Profiles or roles of people)
- 'Conclusion' (A summary wrap-up, thank you, or call-to-action)

Each slide in the response must contain:
1. "type": One of the exact slide type string names listed above.
2. "title": A concise slide title specific to the content in the "${language}" language.
3. "description": A 1-sentence description of the slide in the "${language}" language.
4. "content": The slide body text (3-4 bullet points separated by newlines \\n) in the "${language}" language.
5. "speakerNotes": 2-3 sentences guiding the speaker in the "${language}" language.
6. "imagePrompt": A detailed descriptive prompt for DALL-E/Unsplash/Pexels to search or generate a relevant background or contextual image. Can be in English for search compatibility.
7. "suggestedVisuals": Specific keyword or type description for icons/charts/illustrations in the "${language}" language.

Your output MUST be valid JSON, conforming to this exact structure:
{
  "title": "Overall Presentation Title",
  "slides": [
    {
      "order": 0,
      "type": "Cover",
      "title": "Title of Cover Slide",
      "description": "Short description of slide.",
      "content": "Bullet point 1\\nBullet point 2",
      "speakerNotes": "Introductory notes...",
      "imagePrompt": "Image description for cover background...",
      "suggestedVisuals": "Suggested visual description..."
    },
    ...
  ]
}

Ensure the output is raw JSON, do not include any markdown formatting, wrappers, or text outside the JSON block. Do not write "json" inside the code block. Let the output start directly with { and end with }.
`;

  try {
    let resultJson = null;

    if (provider === 'gemini') {
      const apiKey = settings.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('Gemini API key is not configured.');

      logger.info('Calling Gemini API...');
      const response = await axios.post(
        `https://generativetoolkit.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      resultJson = parseAndCleanJson(responseText);
    } else if (provider === 'openrouter') {
      const apiKey = settings.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
      const model = settings.OPENROUTER_MODEL || 'google/gemini-2.5-flash';
      if (!apiKey) throw new Error('OpenRouter API key is not configured.');

      logger.info(`Calling OpenRouter API (${model})...`);
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: model,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://github.com/slidepaw',
            'Content-Type': 'application/json'
          }
        }
      );

      const responseText = response.data?.choices?.[0]?.message?.content;
      resultJson = parseAndCleanJson(responseText);
    }

    if (!resultJson || !resultJson.slides || !Array.isArray(resultJson.slides)) {
      throw new Error('AI returned invalid JSON structure.');
    }

    logger.info('AI generation successful.');
    await logSystemEvent('ai_generation', { message: `AI presentation generated using ${provider} for topic: ${topic}` }, userId);

    return {
      title: resultJson.title || title || topic,
      topic: topic,
      style: style,
      audience: audience,
      slides: resultJson.slides.map((s, idx) => ({
        order: s.order !== undefined ? s.order : idx,
        type: s.type || (idx === 0 ? 'Cover' : idx === resultJson.slides.length - 1 ? 'Conclusion' : 'TwoColumn'),
        title: s.title || `Slide ${idx + 1}`,
        description: s.description || '',
        content: s.content || '',
        speakerNotes: s.speakerNotes || '',
        imagePrompt: s.imagePrompt || '',
        suggestedVisuals: s.suggestedVisuals || '',
        imageUrl: null
      }))
    };
  } catch (error) {
    logger.error(`AI generation failed (Provider: ${provider}). Error: ${error.message}. Falling back to local generation.`);
    await logSystemEvent('error', { message: `AI Generation failed: ${error.message}. Fallback to local.` }, userId);
    
    // Fallback
    return generateLocalPresentation(topic, title, audience, style, slideCount);
  }
}

/**
 * Regenerate a single slide using AI or local templates.
 */
async function regenerateSingleSlide(topic, audience, style, slideTitle, currentContent, userId = null) {
  const settings = await getSettings();
  const provider = settings.AI_PROVIDER || 'local';

  logger.info(`Regenerating single slide: "${slideTitle}" using ${provider}`);

  if (provider === 'local') {
    const defaultImagePrompt = `Professional slide illustration, style ${style}, showcasing ${slideTitle} for ${topic}.`;
    return {
      title: slideTitle,
      content: currentContent || `Key information regarding ${slideTitle} within ${topic}.`,
      speakerNotes: `Additional commentary regarding ${slideTitle}.`,
      imagePrompt: defaultImagePrompt,
      type: 'TwoColumn',
      description: `Refined detail of ${slideTitle}`,
      suggestedVisuals: `icon of ${slideTitle}`
    };
  }

  const prompt = `
We are regenerating a single slide for the presentation on topic: "${topic}".
Audience: ${audience}
Style: ${style}

Current Slide Title: "${slideTitle}"
Current Content (if any): "${currentContent}"

Generate a fresh version of this slide. Choose an appropriate layout type from:
'Cover', 'TwoColumn', 'ImageLeft', 'ImageRight', 'FullImage', 'Quote', 'Statistics', 'Timeline', 'Comparison', 'Team', 'Conclusion'.

Output ONLY a JSON block like:
{
  "type": "TwoColumn",
  "title": "Refined Slide Title",
  "description": "Refined slide description.",
  "content": "Point 1\\nPoint 2\\nPoint 3",
  "speakerNotes": "Speaker notes details...",
  "imagePrompt": "Image prompt description...",
  "suggestedVisuals": "Visual ideas..."
}
`;

  try {
    let resultJson = null;

    if (provider === 'gemini') {
      const apiKey = settings.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('Gemini API key is not configured.');

      const response = await axios.post(
        `https://generativetoolkit.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      resultJson = parseAndCleanJson(responseText);
    } else if (provider === 'openrouter') {
      const apiKey = settings.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
      const model = settings.OPENROUTER_MODEL || 'google/gemini-2.5-flash';
      if (!apiKey) throw new Error('OpenRouter API key is not configured.');

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: model,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://github.com/slidepaw',
            'Content-Type': 'application/json'
          }
        }
      );

      const responseText = response.data?.choices?.[0]?.message?.content;
      resultJson = parseAndCleanJson(responseText);
    }

    if (!resultJson) throw new Error('AI returned empty response.');

    return {
      type: resultJson.type || 'TwoColumn',
      title: resultJson.title || slideTitle,
      description: resultJson.description || '',
      content: resultJson.content || currentContent,
      speakerNotes: resultJson.speakerNotes || '',
      imagePrompt: resultJson.imagePrompt || '',
      suggestedVisuals: resultJson.suggestedVisuals || ''
    };
  } catch (error) {
    logger.error(`Failed to regenerate single slide. Error: ${error.message}`);
    return {
      type: 'TwoColumn',
      title: slideTitle,
      description: '',
      content: currentContent,
      speakerNotes: 'Slide notes fallback.',
      imagePrompt: `Flat slide design icon representing ${slideTitle}.`,
      suggestedVisuals: ''
    };
  }
}

/**
 * Utility to clean AI markdown wrapping and parse JSON safely
 */
function parseAndCleanJson(text) {
  if (!text) return null;
  
  let cleanText = text.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```json\s*/i, '');
    cleanText = cleanText.replace(/```$/, '');
    cleanText = cleanText.trim();
  }

  try {
    return JSON.parse(cleanText);
  } catch (e) {
    logger.error('Failed to parse clean text as JSON: %s. Error: %s', cleanText, e.message);
    return null;
  }
}

module.exports = {
  generatePresentationStructure,
  regenerateSingleSlide
};
