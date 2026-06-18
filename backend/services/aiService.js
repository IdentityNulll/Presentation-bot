'use strict';
/**
 * AI Service — Production Grade
 * Gemini 2.5 Flash + OpenRouter with retry, settings cache, schema validation.
 */

const axios = require('axios');
const { Setting, logSystemEvent } = require('./dbService');
const { generateLocalPresentation } = require('../shared/presentationTemplates');
const logger = require('../utils/logger');

// ── Settings Cache ─────────────────────────────────────────────────────────────
let _cache = null;
let _cacheExpiry = 0;

async function getSettings() {
  if (_cache && Date.now() < _cacheExpiry) return _cache;
  try {
    const rows = await Setting.find();
    _cache = {};
    rows.forEach(s => { _cache[s.key] = s.value; });
    _cacheExpiry = Date.now() + 5 * 60 * 1000; // 5 min TTL
    return _cache;
  } catch (err) {
    logger.error('Settings fetch error: %O', err);
    return _cache || {};
  }
}

// ── Retry Helper ───────────────────────────────────────────────────────────────
async function withRetry(fn, attempts = 2, baseDelay = 1500) {
  for (let i = 0; i <= attempts; i++) {
    try { return await fn(); } catch (err) {
      if (i === attempts) throw err;
      const wait = baseDelay * Math.pow(2, i);
      logger.warn(`[AI] Attempt ${i + 1} failed: ${err.message}. Retrying in ${wait}ms`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

// ── Valid Types ────────────────────────────────────────────────────────────────
const VALID_TYPES = new Set([
  'Cover', 'TwoColumn', 'ImageLeft', 'ImageRight', 'FullImage',
  'Quote', 'Statistics', 'Timeline', 'Comparison', 'Team', 'Conclusion'
]);

// ── JSON Extraction ────────────────────────────────────────────────────────────
function safeParseJson(raw) {
  if (!raw) return null;
  const attempts = [
    () => JSON.parse(raw.trim()),
    () => {
      const cleaned = raw.replace(/^```(?:json)?\s*/im, '').replace(/```\s*$/m, '').trim();
      return JSON.parse(cleaned);
    },
    () => {
      const s = raw.indexOf('{'), e = raw.lastIndexOf('}');
      if (s === -1 || e <= s) throw new Error('No JSON object found');
      return JSON.parse(raw.slice(s, e + 1));
    },
    () => {
      const s = raw.indexOf('{'), e = raw.lastIndexOf('}');
      const fixed = raw.slice(s, e + 1).replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(fixed);
    },
  ];
  for (const attempt of attempts) {
    try { return attempt(); } catch {}
  }
  logger.error('[AI] All JSON parse attempts failed. Raw preview: %s', raw.slice(0, 400));
  return null;
}

// ── Schema Validation ──────────────────────────────────────────────────────────
function normalizeSlides(slides, count, topic) {
  if (!Array.isArray(slides)) return null;
  return slides.slice(0, count + 2).map((s, idx) => {
    const type = VALID_TYPES.has(s.type) ? s.type
      : idx === 0 ? 'Cover'
      : idx === slides.length - 1 ? 'Conclusion'
      : 'TwoColumn';
    return {
      order: typeof s.order === 'number' ? s.order : idx,
      type,
      title: (s.title || `Slide ${idx + 1}`).slice(0, 120),
      description: (s.description || '').slice(0, 300),
      content: (s.content || '').slice(0, 1500),
      speakerNotes: (s.speakerNotes || '').slice(0, 800),
      imagePrompt: (s.imagePrompt || `Professional illustration for ${topic}`).slice(0, 500),
      suggestedVisuals: (s.suggestedVisuals || '').slice(0, 300),
      layoutData: s.layoutData || null,
      imageUrl: null,
    };
  });
}

// ── Prompt Builder ─────────────────────────────────────────────────────────────
function buildPrompt(topic, title, audience, style, slideCount, language) {
  const audienceCtx = {
    Students: 'Clear explanations, relatable examples, learning objectives.',
    Teachers: 'Curriculum alignment, pedagogy, assessment strategies.',
    Business: 'Executive tone, ROI focus, decisions over descriptions.',
    Investors: 'Pitch deck arc: problem→solution→market→traction→ask.',
    General: 'Plain language, storytelling, universal relevance.',
  }[audience] || 'Engaging, professional, broadly accessible.';

  return `You are an expert presentation designer at a top strategy firm.
Create a ${slideCount}-slide professional deck in "${language}" language. ALL text in that language.

Topic: "${topic}"
Title: "${title}"
Audience: ${audience} — ${audienceCtx}
Visual Style: ${style}

DESIGN RULES:
- Titles must be action-oriented or insight-driven (never generic like "Introduction")
- Bullets: max 12 words each, punchy and specific
- Stats must look data-driven (e.g. "78% adoption rate in Fortune 500")
- Every slide serves a unique narrative purpose

REQUIRED SLIDE ORDER:
0 → Cover (hero title, tagline, atmosphere)
1 → Timeline (agenda: 4-5 phases of this presentation)
2 → TwoColumn or ImageLeft (core problem/context with evidence)
3 → TwoColumn or ImageRight (solution/approach with supporting data)
4 → Statistics (exactly 4 key metrics with real-looking numbers)
5 → Comparison (3-tier plan: Basic/Standard/Premium with feature rows)
6 → ImageRight or FullImage (key insight or case study)
7 → Quote (powerful industry quote with attribution)
8 → TwoColumn (Q&A: 3 real audience questions + expert answers)
Last → Conclusion (3 next steps + CTA)

LAYOUT DATA REQUIREMENTS:
For Statistics: "layoutData": {"stats":[{"value":"94%","label":"Customer satisfaction"},{"value":"$2.4M","label":"Average deal size"},{"value":"3x","label":"Faster deployment"},{"value":"60+","label":"Enterprise clients"}]}
For Comparison: "layoutData": {"columns":["Basic","Standard","Premium"],"rows":[{"feature":"Feature","values":["❌","✅","✅"]},{"feature":"Support","values":["Email","Priority","Dedicated"]}]}
For Timeline: "layoutData": {"steps":[{"phase":"Phase 1","label":"Discovery","description":"Define scope"},{"phase":"Phase 2","label":"Build","description":"Development"}]}

Return ONLY raw JSON (no markdown, no prose):
{
  "title": "...",
  "topic": "${topic}",
  "style": "${style}",
  "audience": "${audience}",
  "slides": [
    {
      "order": 0,
      "type": "Cover",
      "title": "...",
      "description": "One sentence purpose",
      "content": "Line1\\nLine2\\nLine3",
      "speakerNotes": "2-3 sentence delivery guide",
      "imagePrompt": "Ultra-specific English image search prompt",
      "suggestedVisuals": "Icon/visual description",
      "layoutData": null
    }
  ]
}`;
}

// ── API Callers ────────────────────────────────────────────────────────────────
async function callGemini(apiKey, prompt) {
  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      system_instruction: {
        parts: [{ text: 'You are an expert presentation designer. Return only valid raw JSON, never markdown.' }]
      },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.65,
        maxOutputTokens: 8192,
      }
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
  );
  const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty body');
  return text;
}

async function callOpenRouter(apiKey, model, prompt) {
  const res = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model,
      messages: [
        { role: 'system', content: 'You are an expert presentation designer. Return only valid raw JSON, never markdown.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.65,
      max_tokens: 8192,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.APP_URL || 'https://slidepaw.app',
        'X-Title': 'SlidePaw',
        'Content-Type': 'application/json'
      },
      timeout: 60000,
    }
  );
  const text = res.data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenRouter returned empty body');
  return text;
}

// ── Main: Generate Full Presentation ──────────────────────────────────────────
async function generatePresentationStructure(topic, title, audience, style, slideCount = 9, language = 'en', userId = null) {
  const settings = await getSettings();
  const provider = settings.AI_PROVIDER || 'local';
  const resolvedTitle = title || `${topic}: A Professional Overview`;

  logger.info(`[AI] "${resolvedTitle}" | provider=${provider} | slides=${slideCount}`);

  if (provider === 'local') {
    await logSystemEvent('AI_GENERATION_LOCAL', `Local: ${topic}`, userId);
    return generateLocalPresentation(topic, resolvedTitle, audience, style, slideCount);
  }

  const prompt = buildPrompt(topic, resolvedTitle, audience, style, slideCount, language);

  try {
    let raw;
    if (provider === 'gemini') {
      const key = settings.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!key) throw new Error('GEMINI_API_KEY not set');
      raw = await withRetry(() => callGemini(key, prompt));
    } else if (provider === 'openrouter') {
      const key = settings.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
      const model = settings.OPENROUTER_MODEL || 'google/gemini-2.5-flash';
      if (!key) throw new Error('OPENROUTER_API_KEY not set');
      raw = await withRetry(() => callOpenRouter(key, model, prompt));
    } else {
      throw new Error(`Unknown provider: ${provider}`);
    }

    const parsed = safeParseJson(raw);
    if (!parsed?.slides) throw new Error('AI response missing slides');

    const slides = normalizeSlides(parsed.slides, slideCount, topic);
    if (!slides?.length) throw new Error('Slide normalization returned empty');

    await logSystemEvent('ai_generation', { provider, topic, slideCount: slides.length }, userId);
    logger.info(`[AI] Success: ${slides.length} slides`);

    return {
      title: parsed.title || resolvedTitle,
      topic,
      style,
      audience,
      slides,
    };
  } catch (err) {
    logger.error(`[AI] Failed (${provider}): ${err.message} → local fallback`);
    await logSystemEvent('error', { message: err.message, provider, topic }, userId);
    return generateLocalPresentation(topic, resolvedTitle, audience, style, slideCount);
  }
}

// ── Single Slide Regeneration ──────────────────────────────────────────────────
async function regenerateSingleSlide(topic, audience, style, slideTitle, currentContent, userId = null) {
  const settings = await getSettings();
  const provider = settings.AI_PROVIDER || 'local';

  if (provider === 'local') {
    return {
      type: 'TwoColumn',
      title: slideTitle,
      description: `Refreshed insight on ${slideTitle}`,
      content: currentContent || `• Key insight about ${slideTitle}\n• Supporting evidence and data\n• Strategic implication for ${audience}`,
      speakerNotes: `Discuss implications of ${slideTitle} for ${audience}. Invite questions.`,
      imagePrompt: `Clean flat illustration of ${slideTitle}, modern design, ${style} style`,
      suggestedVisuals: `Icon representing ${slideTitle}`,
      layoutData: null,
    };
  }

  const prompt = `Regenerate this presentation slide with significantly improved content.
Topic: "${topic}" | Audience: ${audience} | Style: ${style}
Current Title: "${slideTitle}"
Current Content: "${currentContent}"

Make it more visual-first, concise, and impactful. Choose best type from: ${[...VALID_TYPES].join(', ')}.

Return ONLY JSON (no markdown):
{"type":"TwoColumn","title":"...","description":"...","content":"Line1\\nLine2\\nLine3","speakerNotes":"...","imagePrompt":"...","suggestedVisuals":"...","layoutData":null}`;

  try {
    let raw;
    if (provider === 'gemini') {
      const key = settings.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      raw = await withRetry(() => callGemini(key, prompt));
    } else {
      const key = settings.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
      const model = settings.OPENROUTER_MODEL || 'google/gemini-2.5-flash';
      raw = await withRetry(() => callOpenRouter(key, model, prompt));
    }

    const parsed = safeParseJson(raw);
    if (!parsed) throw new Error('Empty AI response');

    return {
      type: VALID_TYPES.has(parsed.type) ? parsed.type : 'TwoColumn',
      title: parsed.title || slideTitle,
      description: parsed.description || '',
      content: parsed.content || currentContent,
      speakerNotes: parsed.speakerNotes || '',
      imagePrompt: parsed.imagePrompt || `Professional illustration for ${slideTitle}`,
      suggestedVisuals: parsed.suggestedVisuals || '',
      layoutData: parsed.layoutData || null,
    };
  } catch (err) {
    logger.error(`[AI] Single slide regen failed: ${err.message}`);
    return {
      type: 'TwoColumn', title: slideTitle, description: '',
      content: currentContent, speakerNotes: '', layoutData: null,
      imagePrompt: `Modern illustration of ${slideTitle}`, suggestedVisuals: '',
    };
  }
}

module.exports = { generatePresentationStructure, regenerateSingleSlide };
