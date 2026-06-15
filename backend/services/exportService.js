const PptxGenJS = require('pptxgenjs');
const PDFDocument = require('pdfkit');
const { getTheme } = require('../../shared/themes');
const logger = require('../utils/logger');
const { prisma } = require('./dbService');

/**
 * Generates a PPTX presentation buffer.
 */
async function generatePPTX(presentation, slides, options = {}) {
  logger.info(`Generating PPTX for presentation: ${presentation.id}`);
  const theme = getTheme(presentation.theme);
  const pptx = new PptxGenJS();

  pptx.layout = 'LAYOUT_16x9';

  // 1. Cover Slide
  const coverSlide = pptx.addSlide();
  
  // Slide background
  coverSlide.background = { fill: theme.bg };

  // Add decorative accent lines or shapes
  coverSlide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 0.3,
    h: '100%',
    fill: { color: theme.primary }
  });

  // Main Title
  coverSlide.addText(presentation.title, {
    x: 1.0,
    y: 1.8,
    w: '80%',
    h: 1.5,
    fontSize: 40,
    bold: true,
    fontFace: theme.fontTitle,
    color: theme.primary,
    valign: 'middle'
  });

  // Subtitle / Topic & Audience details
  coverSlide.addText(`Topic: ${presentation.topic}\nAudience: ${presentation.audience} | Style: ${presentation.style}`, {
    x: 1.0,
    y: 3.5,
    w: '80%',
    h: 1.0,
    fontSize: 18,
    fontFace: theme.fontBody,
    color: theme.secondary
  });

  // 2. Table of Contents Slide (Optional)
  if (options.includeTOC) {
    const tocSlide = pptx.addSlide();
    tocSlide.background = { fill: theme.bg };
    
    // Slide Title
    tocSlide.addText('Table of Contents', {
      x: 0.8,
      y: 0.5,
      w: '80%',
      h: 0.8,
      fontSize: 28,
      bold: true,
      fontFace: theme.fontTitle,
      color: theme.primary
    });

    const tocItems = slides.map((s, idx) => `${idx + 1}. ${s.title}`);
    tocSlide.addText(tocItems.join('\n'), {
      x: 0.8,
      y: 1.5,
      w: '80%',
      h: 3.5,
      fontSize: 16,
      fontFace: theme.fontBody,
      color: theme.text,
      lineSpacing: 28
    });

    // Slide Number
    tocSlide.addText('Slide 2', {
      x: '90%',
      y: '90%',
      fontSize: 10,
      fontFace: theme.fontBody,
      color: theme.secondary
    });
  }

  // 3. Body Slides
  slides.forEach((slide, idx) => {
    const bodySlide = pptx.addSlide();
    bodySlide.background = { fill: theme.bg };

    // Slide Title
    bodySlide.addText(slide.title, {
      x: 0.8,
      y: 0.5,
      w: '80%',
      h: 0.8,
      fontSize: 28,
      bold: true,
      fontFace: theme.fontTitle,
      color: theme.primary
    });

    // Content bullet points
    const bullets = slide.content.split('\n').filter(line => line.trim().length > 0);
    const textObjects = bullets.map(b => ({
      text: b.startsWith('•') ? b.substring(1).trim() : b,
      options: { bullet: true, color: theme.text, fontFace: theme.fontBody }
    }));

    bodySlide.addText(textObjects, {
      x: 0.8,
      y: 1.5,
      w: '80%',
      h: 3.5,
      fontSize: 18,
      fontFace: theme.fontBody,
      color: theme.text,
      lineSpacing: 30
    });

    // Speaker notes (pptxgenjs native speaker notes)
    if (slide.speakerNotes) {
      bodySlide.note = slide.speakerNotes;
    }

    // Slide Numbering (taking cover and TOC into account)
    const slideNumber = (options.includeTOC ? idx + 3 : idx + 2);
    bodySlide.addText(`Slide ${slideNumber}`, {
      x: '90%',
      y: '90%',
      fontSize: 10,
      fontFace: theme.fontBody,
      color: theme.secondary
    });
  });

  // 4. Conclusion / Thank You Slide
  const endSlide = pptx.addSlide();
  endSlide.background = { fill: theme.bg };

  endSlide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 0.3,
    h: '100%',
    fill: { color: theme.accent }
  });

  endSlide.addText('Thank You!', {
    x: 1.0,
    y: 2.0,
    w: '80%',
    h: 1.2,
    fontSize: 44,
    bold: true,
    fontFace: theme.fontTitle,
    color: theme.primary,
    valign: 'middle'
  });

  endSlide.addText('Questions & Answers Session', {
    x: 1.0,
    y: 3.2,
    w: '80%',
    h: 0.8,
    fontSize: 20,
    fontFace: theme.fontBody,
    color: theme.secondary
  });

  // Export to buffer
  const buffer = await pptx.write('nodebuffer');
  return buffer;
}

/**
 * Generates a PDF presentation buffer (landscape slide format).
 */
async function generatePDF(presentation, slides, options = {}) {
  logger.info(`Generating PDF for presentation: ${presentation.id}`);
  const theme = getTheme(presentation.theme);

  // A4 Landscape is 842 x 595 points
  const doc = new PDFDocument({
    size: [842, 595],
    margins: { top: 40, bottom: 40, left: 50, right: 50 }
  });

  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on('error', (err) => reject(err));

    // Colors helper
    const primaryColor = '#' + theme.primary;
    const secondaryColor = '#' + theme.secondary;
    const bgColor = '#' + theme.bg;
    const textColor = '#' + theme.text;
    const accentColor = '#' + theme.accent;

    // 1. Cover Slide
    doc.rect(0, 0, 842, 595).fill(bgColor);
    
    // Decorative left margin
    doc.rect(0, 0, 20, 595).fill(primaryColor);

    doc.fillColor(primaryColor)
       .fontSize(38)
       .text(presentation.title, 60, 180, { width: 720, align: 'left' });

    doc.fillColor(secondaryColor)
       .fontSize(16)
       .text(`Topic: ${presentation.topic}\nAudience: ${presentation.audience} | Style: ${presentation.style}`, 60, 320, { width: 720, align: 'left', lineGap: 6 });

    // 2. Table of Contents (Optional)
    if (options.includeTOC) {
      doc.addPage();
      doc.rect(0, 0, 842, 595).fill(bgColor);
      doc.rect(0, 0, 20, 595).fill(primaryColor);

      doc.fillColor(primaryColor)
         .fontSize(28)
         .text('Table of Contents', 60, 50);

      let tocY = 130;
      slides.forEach((s, idx) => {
        doc.fillColor(textColor)
           .fontSize(16)
           .text(`${idx + 1}. ${s.title}`, 80, tocY);
        tocY += 30;
      });

      // Page Number
      doc.fillColor(secondaryColor)
         .fontSize(10)
         .text('Slide 2', 760, 550);
    }

    // 3. Body Slides
    slides.forEach((slide, idx) => {
      doc.addPage();
      doc.rect(0, 0, 842, 595).fill(bgColor);
      doc.rect(0, 0, 20, 595).fill(primaryColor);

      // Slide Title
      doc.fillColor(primaryColor)
         .fontSize(26)
         .text(slide.title, 60, 50, { width: 720 });

      // Bullets
      const bullets = slide.content.split('\n').filter(line => line.trim().length > 0);
      let contentY = 130;
      bullets.forEach(b => {
        const bulletText = b.startsWith('•') ? b : `• ${b}`;
        doc.fillColor(textColor)
           .fontSize(18)
           .text(bulletText, 80, contentY, { width: 680, lineGap: 8 });
        contentY += doc.heightOfString(bulletText, { width: 680, fontSize: 18 }) + 15;
      });

      // Slide Numbering
      const slideNum = (options.includeTOC ? idx + 3 : idx + 2);
      doc.fillColor(secondaryColor)
         .fontSize(10)
         .text(`Slide ${slideNum}`, 760, 550);
    });

    // 4. Conclusion Slide
    doc.addPage();
    doc.rect(0, 0, 842, 595).fill(bgColor);
    doc.rect(0, 0, 20, 595).fill(accentColor);

    doc.fillColor(primaryColor)
       .fontSize(42)
       .text('Thank You!', 60, 200, { width: 720 });

    doc.fillColor(secondaryColor)
       .fontSize(18)
       .text('Questions & Answers Session', 60, 280, { width: 720 });

    doc.end();
  });
}

/**
 * Generates a Markdown document representation of the presentation.
 */
function generateMarkdown(presentation, slides) {
  logger.info(`Generating Markdown for presentation: ${presentation.id}`);
  let md = `# ${presentation.title}\n\n`;
  md += `**Topic:** ${presentation.topic}\n`;
  md += `**Audience:** ${presentation.audience}\n`;
  md += `**Style:** ${presentation.style}\n`;
  md += `**Theme:** ${presentation.theme}\n\n`;
  md += `---\n\n`;

  slides.forEach((slide, idx) => {
    md += `## Slide ${idx + 1}: ${slide.title}\n\n`;
    const bullets = slide.content.split('\n').filter(line => line.trim().length > 0);
    bullets.forEach(b => {
      const line = b.startsWith('•') || b.startsWith('-') ? b : `* ${b}`;
      md += `${line}\n`;
    });
    md += `\n`;

    if (slide.speakerNotes) {
      md += `*Speaker Notes:*\n> ${slide.speakerNotes.replace(/\n/g, '\n> ')}\n\n`;
    }

    if (slide.imagePrompt) {
      md += `*Image Prompt:*\n> ${slide.imagePrompt}\n\n`;
    }

    md += `---\n\n`;
  });

  md += `## Conclusion & Q&A\n\n`;
  md += `Thank you! Open floor for questions and discussion.\n`;

  return Buffer.from(md, 'utf-8');
}

/**
 * Log export count.
 */
async function logExport(userId, presentationId, format) {
  try {
    await prisma.exportLog.create({
      data: {
        userId,
        presentationId,
        format
      }
    });
  } catch (error) {
    logger.error('Failed to log export to DB: %O', error);
  }
}

module.exports = {
  generatePPTX,
  generatePDF,
  generateMarkdown,
  logExport
};
