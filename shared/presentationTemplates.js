'use strict';
/**
 * Local Presentation Generator — Professional Fallback
 * Produces Gamma-quality 9-slide decks without an AI API.
 * Topic-aware, audience-tuned, layout-varied.
 */

// ── Audience Archetypes ────────────────────────────────────────────────────────
const AUDIENCE_CONFIGS = {
  Students: {
    tone: 'educational',
    cta: 'Start Learning Today',
    planNames: ['Beginner', 'Intermediate', 'Advanced'],
    qaQuestions: [
      'What prior knowledge do I need?',
      'How long does it take to learn?',
      'Where can I practice these skills?',
    ],
  },
  Teachers: {
    tone: 'instructional',
    cta: 'Implement in Your Classroom',
    planNames: ['Core Curriculum', 'Extended Program', 'Institution License'],
    qaQuestions: [
      'How does this align with learning standards?',
      'What differentiation strategies are recommended?',
      'How is student progress tracked?',
    ],
  },
  Business: {
    tone: 'strategic',
    cta: 'Schedule an Executive Briefing',
    planNames: ['Starter', 'Professional', 'Enterprise'],
    qaQuestions: [
      'What is the expected ROI?',
      'How long is the typical implementation?',
      'What change management is required?',
    ],
  },
  Investors: {
    tone: 'pitch',
    cta: 'Join Our Seed Round Today',
    planNames: ['Seed Tier', 'Series A Tier', 'Strategic Partner'],
    qaQuestions: [
      'What is the total addressable market?',
      'What is the path to profitability?',
      'Who are the key risks and mitigations?',
    ],
  },
  General: {
    tone: 'informative',
    cta: 'Get Started Now',
    planNames: ['Basic', 'Standard', 'Premium'],
    qaQuestions: [
      'What makes this different from alternatives?',
      'How quickly can I see results?',
      'What support is available?',
    ],
  },
};

// ── Stat Templates per Audience ────────────────────────────────────────────────
const STAT_SETS = {
  Students: [
    { value: '92%', label: 'completion rate' },
    { value: '4.8★', label: 'average learner rating' },
    { value: '3×', label: 'faster skill acquisition' },
    { value: '50K+', label: 'active learners' },
  ],
  Teachers: [
    { value: '87%', label: 'improvement in engagement' },
    { value: '40%', label: 'reduction in prep time' },
    { value: '12K+', label: 'classrooms using this' },
    { value: '4.9★', label: 'educator satisfaction' },
  ],
  Business: [
    { value: '340%', label: 'average ROI in Year 1' },
    { value: '60%', label: 'reduction in operational cost' },
    { value: '2.5×', label: 'increase in team productivity' },
    { value: '$4.2M', label: 'average annual savings' },
  ],
  Investors: [
    { value: '$48B', label: 'total addressable market' },
    { value: '180%', label: 'year-over-year growth' },
    { value: '94%', label: 'customer retention rate' },
    { value: '3.2×', label: 'revenue per customer (LTV/CAC)' },
  ],
  General: [
    { value: '78%', label: 'of users see results in 30 days' },
    { value: '4.7★', label: 'average user satisfaction' },
    { value: '10K+', label: 'happy customers worldwide' },
    { value: '2×', label: 'efficiency improvement reported' },
  ],
};

// ── Comparison Feature Sets per Audience ──────────────────────────────────────
const COMPARISON_FEATURES = {
  Students:  ['Access to Content', 'Practice Exercises', 'Instructor Support', 'Certificates', 'Offline Access', 'Priority Feedback'],
  Teachers:  ['Lesson Templates', 'Student Tracking', 'Standards Alignment', 'Integrations', 'Admin Dashboard', 'Professional Dev'],
  Business:  ['Users Included', 'Analytics Suite', 'API Access', 'SLA Guarantee', 'Dedicated CSM', 'Custom Workflows'],
  Investors: ['Equity Stake', 'Board Seat', 'Pro-rata Rights', 'Information Rights', 'Advisory Role', 'Early Exit Rights'],
  General:   ['Core Features', 'Storage', 'Support Level', 'Updates', 'Integrations', 'Custom Branding'],
};

const FEATURE_VALUES = {
  Basic:   ['✅', '5 GB', 'Email', 'Quarterly', '3', '❌'],
  Standard:['✅', '50 GB', 'Priority', 'Monthly', '10', '❌'],
  Premium: ['✅', 'Unlimited', 'Dedicated 24/7', 'Continuous', 'Unlimited', '✅'],

  Beginner:     ['Core only', '10 lessons', 'Community', '❌', 'Limited', '❌'],
  Intermediate: ['Core + Labs', '50 lessons', 'Instructor Q&A', '✅', 'Full', '❌'],
  Advanced:     ['Full library', 'Unlimited', 'Mentoring', '✅', 'Full', '✅'],

  'Core Curriculum':      ['Lesson Plans', '2 GB', 'Email', 'Semester', '3', '❌'],
  'Extended Program':     ['+ Assessments', '20 GB', 'Priority', 'Monthly', '10', '❌'],
  'Institution License':  ['Full Suite', 'Unlimited', 'Dedicated', 'Continuous', 'All', '✅'],

  'Starter':       ['5 seats', 'Basic', '✅', '99.5%', '❌', '❌'],
  'Professional':  ['25 seats', 'Advanced', '✅', '99.9%', '❌', '✅'],
  'Enterprise':    ['Unlimited', 'Custom', '✅', '99.99%', '✅', '✅'],

  'Seed Tier':         ['2-5%', '❌', '❌', 'Quarterly', 'Optional', '❌'],
  'Series A Tier':     ['5-10%', '✅', 'Pro-rata', 'Monthly', '✅', 'Negotiable'],
  'Strategic Partner': ['10%+', '✅', 'Full', 'Real-time', '✅', '✅'],
};

// ── Image Prompts by Slide Purpose ────────────────────────────────────────────
const IMAGE_PROMPTS = [
  'Aerial view of a modern city skyline at golden hour, vibrant colors, cinematic, 4K editorial photography',
  'Diverse team of professionals in a bright modern office, collaborative atmosphere, natural light, editorial style',
  'Abstract data visualization with glowing nodes and connections on dark background, technology concept',
  'Close-up of hands typing on laptop with financial charts reflected in glasses, sharp focus, professional',
  'Modern glass office building exterior, reflective facade, business district, wide angle, architectural photography',
  'Whiteboard covered in strategic diagrams and sticky notes, creative workspace, warm lighting',
  'Futuristic dashboard with analytics charts on multiple screens, dark UI, neon accents, tech aesthetic',
  'Portrait of confident business leader in boardroom, natural light, shallow depth of field, editorial',
  'Aerial drone shot of green campus or innovation park, lush surroundings, professional environment',
];

// ── Quote Bank ─────────────────────────────────────────────────────────────────
const QUOTES = [
  { text: 'The best way to predict the future is to create it.', author: 'Peter Drucker', role: 'Management Consultant' },
  { text: 'Innovation is seeing what everybody has seen and thinking what nobody has thought.', author: 'Albert Szent-Györgyi', role: 'Nobel Laureate' },
  { text: 'Strategy without execution is hallucination.', author: 'Thomas Edison', role: 'Inventor & Entrepreneur' },
  { text: 'Data beats opinions. Always.', author: 'Jeff Bezos', role: 'Amazon Founder' },
  { text: 'The goal is not to be perfect by the end, but to be better than yesterday.', author: 'Simon Sinek', role: 'Author & Leadership Expert' },
];

// ── Main Generator ─────────────────────────────────────────────────────────────
function generateLocalPresentation(topic, title, audience, style, slideCount = 9) {
  // Resolve audience config
  const cfg = AUDIENCE_CONFIGS[audience] || AUDIENCE_CONFIGS.General;
  const stats = STAT_SETS[audience] || STAT_SETS.General;
  const features = COMPARISON_FEATURES[audience] || COMPARISON_FEATURES.General;
  const planNames = cfg.planNames;
  const presentationTitle = title || `${topic}: A Complete Overview`;
  const quote = QUOTES[Math.abs(topic.charCodeAt(0) + topic.length) % QUOTES.length];

  // Build comparison rows
  const comparisonRows = features.map((feat, i) => ({
    feature: feat,
    values: planNames.map(p => {
      const vals = FEATURE_VALUES[p];
      return vals ? (vals[i] || '—') : '—';
    }),
  }));

  const slides = [];

  // ── Slide 0: Cover ───────────────────────────────────────────────────────────
  slides.push({
    order: 0,
    type: 'Cover',
    title: presentationTitle,
    description: `A comprehensive ${cfg.tone} presentation tailored for ${audience}`,
    content: `Prepared for: ${audience}\nStyle: ${style || 'Professional'}\nPresented by: [Your Name]`,
    speakerNotes: `Welcome the audience. Introduce yourself and state the goal: to give ${audience} a clear, actionable understanding of "${topic}". Set the agenda expectation.`,
    imagePrompt: IMAGE_PROMPTS[0],
    suggestedVisuals: 'Cinematic hero image related to the topic',
    layoutData: null,
    imageUrl: null,
  });

  // ── Slide 1: Timeline / Agenda ───────────────────────────────────────────────
  slides.push({
    order: 1,
    type: 'Timeline',
    title: `Today's Agenda`,
    description: 'Roadmap for this presentation session',
    content: `Phase 1: Context & Background\nPhase 2: Core Concepts\nPhase 3: Strategy & Plans\nPhase 4: Evidence & Data\nPhase 5: Next Steps & Q&A`,
    speakerNotes: `Walk through this agenda to set expectations. Tell the audience you will reserve 5 minutes for Q&A at the end.`,
    imagePrompt: IMAGE_PROMPTS[5],
    suggestedVisuals: 'Timeline or roadmap icon',
    layoutData: {
      steps: [
        { phase: 'Phase 1', label: 'Context', description: 'Background and why this matters' },
        { phase: 'Phase 2', label: 'Core Concepts', description: 'Key principles and definitions' },
        { phase: 'Phase 3', label: 'Strategy', description: 'Three actionable plans compared' },
        { phase: 'Phase 4', label: 'Evidence', description: 'Data, metrics, and case studies' },
        { phase: 'Phase 5', label: 'Next Steps', description: 'Action items and Q&A' },
      ],
    },
    imageUrl: null,
  });

  // ── Slide 2: Core Context (TwoColumn) ────────────────────────────────────────
  slides.push({
    order: 2,
    type: 'TwoColumn',
    title: `Why ${topic} Matters Now`,
    description: 'Establishing urgency and relevance of the topic',
    content: `The challenge is growing rapidly\nTraditional approaches are no longer sufficient\nEarly movers gain significant competitive advantage\nThe cost of inaction is increasing every quarter\nThis is a defining moment for ${audience}`,
    speakerNotes: `Establish the "why now" urgency. Use local statistics or news if available. Make the audience feel the weight of the opportunity or risk they face.`,
    imagePrompt: IMAGE_PROMPTS[2],
    suggestedVisuals: 'Split diagram showing old vs new approach',
    layoutData: null,
    imageUrl: null,
  });

  // ── Slide 3: Solution / Approach (ImageLeft) ──────────────────────────────────
  slides.push({
    order: 3,
    type: 'ImageLeft',
    title: `Our Approach to ${topic}`,
    description: 'The strategic framework we recommend',
    content: `Proven methodology with measurable outcomes\nBuilt for the specific needs of ${audience}\nScalable from day one to enterprise scale\nBacked by research and real-world validation\nContinuous improvement built into the process`,
    speakerNotes: `Introduce the methodology. Emphasize that this approach was specifically designed for ${audience} — it's not a one-size-fits-all solution.`,
    imagePrompt: IMAGE_PROMPTS[1],
    suggestedVisuals: 'Framework or process diagram illustration',
    layoutData: null,
    imageUrl: null,
  });

  // ── Slide 4: Statistics ───────────────────────────────────────────────────────
  slides.push({
    order: 4,
    type: 'Statistics',
    title: 'The Numbers Speak for Themselves',
    description: 'Key performance indicators and impact metrics',
    content: stats.map(s => `${s.value} — ${s.label}`).join('\n'),
    speakerNotes: `Let these statistics land. Pause after each figure. These numbers represent real impact from organizations that have already implemented this approach.`,
    imagePrompt: IMAGE_PROMPTS[6],
    suggestedVisuals: 'Data chart or infographic visualization',
    layoutData: { stats },
    imageUrl: null,
  });

  // ── Slide 5: Comparison (3 Plans) ────────────────────────────────────────────
  slides.push({
    order: 5,
    type: 'Comparison',
    title: 'Choose the Right Plan for You',
    description: `Three-tier comparison of ${planNames.join(', ')} options`,
    content: comparisonRows.map(r => `${r.feature}: ${r.values.join(' | ')}`).join('\n'),
    speakerNotes: `Walk through each plan. For most ${audience}, the ${planNames[1]} option hits the sweet spot of value and capability. Invite them to think about which column fits their situation.`,
    imagePrompt: IMAGE_PROMPTS[4],
    suggestedVisuals: 'Three-column comparison table graphic',
    layoutData: { columns: planNames, rows: comparisonRows },
    imageUrl: null,
  });

  // ── Slide 6: Case Study / Key Insight (ImageRight) ───────────────────────────
  slides.push({
    order: 6,
    type: 'ImageRight',
    title: `Real-World Impact: ${topic} in Action`,
    description: 'A case study demonstrating proven results',
    content: `Challenge: Organization struggling with outdated approach\nSolution: Deployed our ${planNames[1]} framework in 6 weeks\nResult: ${stats[0].value} improvement in ${stats[0].label}\nTimeline: Full ROI achieved in under 90 days\nKey lesson: Start small, iterate fast, scale what works`,
    speakerNotes: `Tell this as a story. Make the audience picture themselves in the shoes of this organization. Emphasize the speed of results and simplicity of the approach.`,
    imagePrompt: IMAGE_PROMPTS[7],
    suggestedVisuals: 'Success story visualization or before/after graphic',
    layoutData: null,
    imageUrl: null,
  });

  // ── Slide 7: Quote ────────────────────────────────────────────────────────────
  slides.push({
    order: 7,
    type: 'Quote',
    title: 'Industry Perspective',
    description: 'A guiding insight from an industry leader',
    content: `"${quote.text}" — ${quote.author}, ${quote.role}`,
    speakerNotes: `Let the quote breathe. Pause. Then connect it directly to the topic: "This is exactly why ${topic} has become critical for ${audience} today."`,
    imagePrompt: IMAGE_PROMPTS[8],
    suggestedVisuals: 'Elegant typography with subtle background texture',
    layoutData: null,
    imageUrl: null,
  });

  // ── Slide 8: Q&A ─────────────────────────────────────────────────────────────
  const qaContent = cfg.qaQuestions.map((q, i) => {
    const answers = [
      `Addressed through our structured methodology and proven framework.`,
      `Typically 4-8 weeks depending on the scope and selected plan.`,
      `Supported by our dedicated team and comprehensive documentation.`,
    ];
    return `Q: ${q}\nA: ${answers[i] || 'See your dedicated success manager for details.'}`;
  }).join('\n');

  slides.push({
    order: 8,
    type: 'TwoColumn',
    title: 'Frequently Asked Questions',
    description: 'Addressing the most common concerns from our audience',
    content: qaContent,
    speakerNotes: `These are the questions we hear most from ${audience}. Address each one directly. If there are additional questions from the room, invite them now.`,
    imagePrompt: IMAGE_PROMPTS[3],
    suggestedVisuals: 'Q&A dialogue bubbles icon or FAQ graphic',
    layoutData: null,
    imageUrl: null,
  });

  // ── Last Slide: Conclusion ────────────────────────────────────────────────────
  slides.push({
    order: slides.length,
    type: 'Conclusion',
    title: 'Your Next Steps',
    description: 'Clear action items and closing call to action',
    content: `Step 1: Select the plan that fits your needs\nStep 2: Schedule your kickoff consultation\nStep 3: Begin your ${topic} transformation\n${cfg.cta}`,
    speakerNotes: `End with energy and clarity. Tell them exactly what to do next. Remove all friction — make the next step feel easy, not daunting. Thank the audience sincerely.`,
    imagePrompt: IMAGE_PROMPTS[0],
    suggestedVisuals: 'Upward arrow or rocket launch illustration',
    layoutData: null,
    imageUrl: null,
  });

  // Trim or pad to slideCount if needed
  const finalSlides = slides.slice(0, slideCount);

  return {
    title: presentationTitle,
    topic,
    style: style || 'Professional',
    audience: audience || 'General',
    slides: finalSlides,
  };
}

module.exports = {
  generateLocalPresentation,
  AUDIENCE_CONFIGS,
  STAT_SETS,
};
