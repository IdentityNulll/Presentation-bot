/**
 * Predefined presentation templates and topic expansion logic for local fallback generation.
 */

const STYLES = {
  MODERN: 'Modern',
  PROFESSIONAL: 'Professional',
  ACADEMIC: 'Academic',
  STARTUP: 'Startup Pitch',
  MINIMALIST: 'Minimalist',
  DARK: 'Dark Theme',
  CREATIVE: 'Creative',
  CORPORATE: 'Corporate'
};

const AUDIENCES = {
  STUDENTS: 'Students',
  TEACHERS: 'Teachers',
  BUSINESS: 'Business',
  INVESTORS: 'Investors',
  GENERAL: 'General'
};

// Default generic templates for different audiences
const AUDIENCE_TEMPLATES = {
  [AUDIENCES.STUDENTS]: {
    slideTitles: [
      "Introduction to {topic}",
      "Key Facts & History",
      "Core Concepts Explained",
      "Interactive Discussion / Q&A",
      "Summary & Key Takeaways"
    ],
    slideContents: [
      ["What is {topic}?", "Why is it important for us today?", "Overview of what we will cover"],
      ["Historical context", "Key milestones and discoveries", "Important figures in this field"],
      ["The main principles", "How it works in practice", "Real-world examples"],
      ["Discussion prompt: What is your perspective?", "Group activity/reflection", "Review questions"],
      ["Quick summary", "Resources for further reading", "Final thoughts and homework"]
    ],
    notes: [
      "Start with a high-energy hook to grab the students' attention. Introduce the core topic in relatable terms.",
      "Highlight the key dates and historical evolution. Make it visual.",
      "Break down complex definitions into simple analogies. Use the whiteboard if possible.",
      "Engage the classroom. Encourage questions and group answers.",
      "Summarize the main points and explain the next steps or reading assignments."
    ]
  },
  [AUDIENCES.BUSINESS]: {
    slideTitles: [
      "Executive Summary: {topic}",
      "The Current Challenge",
      "Proposed Solution & Action Plan",
      "Financials & Projected Impact",
      "Next Steps & Conclusion"
    ],
    slideContents: [
      ["Objective of this brief on {topic}", "Current state of affairs", "Key opportunities identified"],
      ["The business problem we are facing", "Impact on productivity and cost", "Market pressures"],
      ["Strategic roadmap for {topic}", "Implementation steps and timeline", "Responsible departments"],
      ["Required budget and investment", "Expected ROI and efficiency gains", "Risk mitigation strategies"],
      ["Immediate action items", "Timeline for review", "Open floor for executive feedback"]
    ],
    notes: [
      "Set a professional tone. Keep the introduction concise and state the business objectives directly.",
      "Present concrete numbers or pain points. Explain why inaction is not an option.",
      "Focus on the feasibility and logical progression of the plan. Highlight key milestones.",
      "Emphasize the financial return on investment. Be prepared for questions on budget allocation.",
      "End with clear call-to-actions (CTAs) for key decision makers."
    ]
  },
  [AUDIENCES.INVESTORS]: {
    slideTitles: [
      "The Opportunity: {topic}",
      "The Market Pain Point",
      "Our Solution & Competitive Edge",
      "Business Model & Growth Strategy",
      "The Ask & Exit Strategy"
    ],
    slideContents: [
      ["Why {topic} is the future", "Disruptive technology/service potential", "Our vision"],
      ["The massive problem we are solving", "Target customer segment frustration", "Current alternatives and their failures"],
      ["Our unique product/service offering", "Why we are 10x better", "Proprietary IP or secret sauce"],
      ["How we make money (Pricing & margins)", "Go-to-market strategy", "Customer acquisition cost vs lifetime value"],
      ["Funding round details (The Ask)", "Allocation of funds", "Target exit timeline and potential acquirers"]
    ],
    notes: [
      "Establish the massive market potential right away. Capture investor interest with vision and metrics.",
      "Explain the pain point clearly. Make the investors feel the customer's frustration.",
      "Focus on defensibility and the unique moat. Why is it hard for others to replicate?",
      "Demonstrate path to profitability and scale. Investors want to see growth levers.",
      "Clearly articulate how much capital you are raising and what major milestones it will unlock."
    ]
  },
  [AUDIENCES.TEACHERS]: {
    slideTitles: [
      "Curriculum Plan: {topic}",
      "Learning Objectives",
      "Instructional Methodology",
      "Assessment & Rubric",
      "Teacher Resources & Materials"
    ],
    slideContents: [
      ["Overview of unit on {topic}", "Alignment with standards", "Target grade level"],
      ["What students will know", "What students will be able to do", "Essential questions"],
      ["Lesson delivery plan", "Active learning strategies", "Differentiation for diverse learners"],
      ["Formative assessments", "Summative project details", "Grading criteria and feedback loop"],
      ["Required reading and texts", "Tech tools and software", "Teacher prep list"]
    ],
    notes: [
      "Establish context and alignment with state or national education standards.",
      "Clearly state what measurable outcomes students are expected to achieve.",
      "Discuss how you will engage different learning styles (visual, auditory, kinesthetic).",
      "Explain how you will verify understanding and track student progress.",
      "List resources and recommend prep tasks to ensure smooth execution."
    ]
  },
  [AUDIENCES.GENERAL]: {
    slideTitles: [
      "Understanding {topic}",
      "Why it Matters to You",
      "Key Features & Concepts",
      "Interesting Case Study",
      "Looking Forward & Conclusion"
    ],
    slideContents: [
      ["What exactly is {topic}?", "Brief history and background", "How it affects our daily lives"],
      ["The direct relevance to the general public", "Common misconceptions debunked", "Key benefits"],
      ["Core elements of {topic}", "How it works in simple terms", "Visual representation summary"],
      ["A real-world story or scenario", "What we can learn from this example", "Results and impact"],
      ["Upcoming trends in {topic}", "How to get involved or learn more", "Final takeaway message"]
    ],
    notes: [
      "Keep language simple and free of jargon. Build interest and curiosity.",
      "Connect the topic to everyday experiences. Address any general skepticism.",
      "Use analogies to explain the inner workings. Keep it accessible.",
      "Tell a human-centric story. Stories are remembered much better than pure facts.",
      "End on an inspiring note. Provide a clear and simple next step."
    ]
  }
};

/**
 * Expands a topic locally based on inputs.
 * Returns { title, topic, style, audience, slides: [{ title, content, speakerNotes, imagePrompt }] }
 */
function generateLocalPresentation(topic, title, audience, style, slideCount = 6) {
  // Normalize parameters
  let resolvedAudience = AUDIENCES.GENERAL;
  if (audience) {
    const matched = Object.values(AUDIENCES).find(v => v.toLowerCase() === audience.toLowerCase());
    if (matched) resolvedAudience = matched;
  }
  
  const template = AUDIENCE_TEMPLATES[resolvedAudience] || AUDIENCE_TEMPLATES[AUDIENCES.GENERAL];
  const presentationTitle = title || `A Deep Dive into ${topic}`;
  
  const generatedSlides = [];
  const slideTypes = [
    'Cover',
    'TwoColumn',
    'ImageLeft',
    'ImageRight',
    'FullImage',
    'Quote',
    'Statistics',
    'Timeline',
    'Comparison',
    'Team',
    'Conclusion'
  ];

  for (let i = 0; i < slideCount; i++) {
    let slideTitle = "";
    let contentList = [];
    let note = "";
    let slideType = 'TwoColumn';
    let description = "";
    
    // Choose slide types
    if (i === 0) {
      slideType = 'Cover';
      slideTitle = presentationTitle;
      contentList = [
        `Prepared for: ${resolvedAudience}`,
        `Theme Style: ${style || STYLES.PROFESSIONAL}`,
        `Topic: ${topic}`
      ];
      description = `An in-depth presentation deck exploring ${topic}`;
      note = `Welcome the audience, introduce yourself, and state the core purpose of today's presentation on "${topic}".`;
    } else if (i === 1) {
      slideType = 'Timeline';
      slideTitle = "Agenda & Overview";
      contentList = [
        "Phase 1: Project Background & Context",
        "Phase 2: Key Challenges & Analysis",
        "Phase 3: Solutions & Roadmap",
        "Phase 4: Key Performance Statistics",
        "Phase 5: Next Steps & Q&A"
      ];
      description = "Agenda timeline showing the flow of this deck";
      note = "Walk through the agenda slide to set expectations for the presentation.";
    } else if (i === slideCount - 1) {
      slideType = 'Conclusion';
      slideTitle = "Summary & Thank You";
      contentList = [
        "Key takeaways summarized",
        "Final reflections and next steps",
        "Thank you - Open Q&A session"
      ];
      description = "Closing remarks and session wrap-up";
      note = "Summarize the key points discussed today. Express gratitude and invite open questions from the audience.";
    } else {
      // Body slides
      const templateIdx = (i - 1) % (template.slideTitles.length - 2) + 1;
      
      const rawTitle = template.slideTitles[templateIdx] || "Topic Detail";
      slideTitle = rawTitle.replace('{topic}', topic);
      
      const rawContents = template.slideContents[templateIdx] || ["Key detail about " + topic];
      contentList = rawContents.map(c => c.replace('{topic}', topic));
      
      note = template.notes[templateIdx] || `Explain this slide's core message. Support the slide points with descriptive explanations.`;
      
      // Rotate types for body slides
      const bodyTypes = ['ImageLeft', 'ImageRight', 'Statistics', 'Comparison', 'Quote'];
      slideType = bodyTypes[(i - 2) % bodyTypes.length];
      
      if (slideType === 'Statistics') {
        slideTitle = "Key Metrics & Statistics";
        contentList = [
          "85% Efficiency Growth",
          "40% reduction in total operational cost",
          "Over 10,000 active daily engagements"
        ];
        description = "Breakdown of performance statistics";
      } else if (slideType === 'Quote') {
        slideTitle = "Industry Perspective";
        contentList = ["\"Innovation is taking two things that already exist and putting them together in a new way.\" - Tom Freston"];
        description = "Key citation emphasizing strategic vision";
      } else {
        description = `Core analytical analysis of ${topic}`;
      }
    }

    const imagePrompt = `Professional slide graphic, flat illustration, modern style, depicting '${slideTitle}' related to '${topic}'. Clean vectors, suitable for ${style || 'Professional'} style presentation, neutral background.`;

    generatedSlides.push({
      order: i,
      type: slideType,
      title: slideTitle,
      description: description || `Brief overview of ${slideTitle}`,
      content: contentList.join('\n'),
      speakerNotes: note,
      imagePrompt: imagePrompt,
      suggestedVisuals: `illustration representing ${slideTitle}`,
      imageUrl: null
    });
  }

  return {
    title: presentationTitle,
    topic: topic,
    style: style || STYLES.PROFESSIONAL,
    audience: resolvedAudience,
    slides: generatedSlides
  };
}

module.exports = {
  generateLocalPresentation,
  STYLES,
  AUDIENCES
};
