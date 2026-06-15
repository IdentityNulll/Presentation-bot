import React from 'react';

/**
 * Visual slide preview that renders content styled with the presentation theme.
 * Supports slide types: Cover, TwoColumn, ImageLeft, ImageRight, Quote, Statistics, Timeline, Conclusion.
 */
export default function SlidePreview({ slide, theme, className = '', mini = false }) {
  const bg = theme?.bg ? `#${theme.bg}` : '#f8fafc';
  const text = theme?.text ? `#${theme.text}` : '#0f172a';
  const primary = theme?.primary ? `#${theme.primary}` : '#6366f1';
  const accent = theme?.accent ? `#${theme.accent}` : '#10b981';
  const secondary = theme?.secondary ? `#${theme.secondary}` : '#3b82f6';
  const fontTitle = theme?.fontTitle || 'Outfit';
  const fontBody = theme?.fontBody || 'Inter';

  const bullets = (slide.content || '').split('\n').filter(Boolean);
  const baseFontSize = mini ? 0.35 : 0.65;

  const renderCover = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-[8%]">
      <div
        className="w-[30%] h-[3px] rounded-full mb-[4%]"
        style={{ background: primary }}
      />
      <h2
        style={{
          fontFamily: fontTitle,
          color: text,
          fontSize: `${baseFontSize * 2.8}rem`,
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      >
        {slide.title}
      </h2>
      {slide.description && (
        <p
          style={{
            fontFamily: fontBody,
            color: `${text}99`,
            fontSize: `${baseFontSize * 1.2}rem`,
            marginTop: '3%',
          }}
        >
          {slide.description}
        </p>
      )}
      <div
        className="w-[20%] h-[2px] rounded-full mt-[4%]"
        style={{ background: accent }}
      />
    </div>
  );

  const renderBullets = () => (
    <div className="flex flex-col h-full p-[6%]">
      <h3
        style={{
          fontFamily: fontTitle,
          color: primary,
          fontSize: `${baseFontSize * 2}rem`,
          fontWeight: 700,
          marginBottom: '4%',
          borderBottom: `2px solid ${primary}22`,
          paddingBottom: '3%',
        }}
      >
        {slide.title}
      </h3>
      <div className="flex-1 flex flex-col justify-center gap-[3%]">
        {bullets.map((item, i) => (
          <div key={i} className="flex items-start gap-[2%]">
            <div
              className="w-[1.2em] h-[1.2em] rounded-full mt-[0.3em] shrink-0"
              style={{
                background: `${accent}`,
                fontSize: `${baseFontSize * 1.1}rem`,
              }}
            />
            <span
              style={{
                fontFamily: fontBody,
                color: text,
                fontSize: `${baseFontSize * 1.1}rem`,
                lineHeight: 1.5,
              }}
            >
              {item.replace(/^[•\-]\s*/, '')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderQuote = () => (
    <div className="flex flex-col items-center justify-center h-full p-[8%] text-center">
      <div
        style={{
          fontSize: `${baseFontSize * 5}rem`,
          color: primary,
          lineHeight: 0.8,
          fontFamily: 'Georgia, serif',
          opacity: 0.5,
        }}
      >
        "
      </div>
      <p
        style={{
          fontFamily: fontTitle,
          color: text,
          fontSize: `${baseFontSize * 1.4}rem`,
          fontStyle: 'italic',
          lineHeight: 1.5,
          maxWidth: '80%',
        }}
      >
        {bullets[0] || slide.title}
      </p>
      <div
        className="w-[15%] h-[2px] rounded-full mt-[4%]"
        style={{ background: accent }}
      />
    </div>
  );

  const renderStats = () => (
    <div className="flex flex-col h-full p-[6%]">
      <h3
        style={{
          fontFamily: fontTitle,
          color: primary,
          fontSize: `${baseFontSize * 1.8}rem`,
          fontWeight: 700,
          marginBottom: '5%',
        }}
      >
        {slide.title}
      </h3>
      <div className="flex-1 grid grid-cols-2 gap-[3%]">
        {bullets.slice(0, 4).map((stat, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center rounded-lg p-[4%]"
            style={{ background: `${primary}10`, border: `1px solid ${primary}20` }}
          >
            <span
              style={{
                fontFamily: fontTitle,
                color: accent,
                fontSize: `${baseFontSize * 2}rem`,
                fontWeight: 800,
              }}
            >
              {stat.match(/[\d.%+]+/)?.[0] || '—'}
            </span>
            <span
              style={{
                fontFamily: fontBody,
                color: `${text}88`,
                fontSize: `${baseFontSize * 0.9}rem`,
                textAlign: 'center',
              }}
            >
              {stat.replace(/[\d.%+]+\s*/, '')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderConclusion = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-[8%]">
      <div
        className="w-[40%] h-[3px] rounded-full mb-[5%]"
        style={{ background: `linear-gradient(to right, ${primary}, ${accent})` }}
      />
      <h2
        style={{
          fontFamily: fontTitle,
          color: text,
          fontSize: `${baseFontSize * 2.4}rem`,
          fontWeight: 700,
        }}
      >
        {slide.title}
      </h2>
      <div className="mt-[4%] space-y-[2%]">
        {bullets.map((item, i) => (
          <p
            key={i}
            style={{
              fontFamily: fontBody,
              color: `${text}99`,
              fontSize: `${baseFontSize * 1.1}rem`,
            }}
          >
            {item.replace(/^[•\-]\s*/, '')}
          </p>
        ))}
      </div>
    </div>
  );

  const renderSlideContent = () => {
    switch (slide.type) {
      case 'Cover':
        return renderCover();
      case 'Quote':
        return renderQuote();
      case 'Statistics':
        return renderStats();
      case 'Conclusion':
        return renderConclusion();
      default:
        return renderBullets();
    }
  };

  return (
    <div
      className={`${mini ? 'slide-preview-mini' : 'slide-preview'} ${className}`}
      style={{ background: bg }}
    >
      {renderSlideContent()}
    </div>
  );
}
