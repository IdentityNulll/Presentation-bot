import React from 'react';
import { Presentation, ChevronRight, Calendar, Layers } from 'lucide-react';

export default function PresentationCard({ presentation, onClick }) {
  const date = new Date(presentation.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  // Get theme background for the preview swatch
  const themeBg = presentation.theme?.bg
    ? `#${presentation.theme.bg}`
    : '#1e293b';
  const themeAccent = presentation.theme?.accent
    ? `#${presentation.theme.accent}`
    : '#6366f1';

  return (
    <button
      onClick={onClick}
      className="glass-card p-4 w-full text-left flex items-center gap-4 group"
    >
      {/* Theme Preview Swatch */}
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border border-white/10"
        style={{
          background: `linear-gradient(135deg, ${themeBg}, ${themeAccent}40)`,
        }}
      >
        <Presentation
          className="w-6 h-6"
          style={{ color: themeAccent }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-slate-100 truncate group-hover:text-indigo-300 transition-colors">
          {presentation.title}
        </h3>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <Layers className="w-3 h-3" />
            {presentation.slideCount} slides
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <Calendar className="w-3 h-3" />
            {date}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0" />
    </button>
  );
}
