import React from 'react';
import { Check } from 'lucide-react';

const THEMES = {
  modern: {
    name: 'Modern Purple',
    bg: 'FAF5FF',
    text: '1F0033',
    primary: '6D28D9',
    accent: 'F43F5E',
  },
  professional: {
    name: 'Steel Blue',
    bg: 'F8FAFC',
    text: '0F172A',
    primary: '0F172A',
    accent: '10B981',
  },
  academic: {
    name: 'Classic Academic',
    bg: 'FDFBF7',
    text: '2D241E',
    primary: '7F1D1D',
    accent: '451A03',
  },
  'startup pitch': {
    name: 'Startup Pitch',
    bg: '0B0F17',
    text: 'F3F4F6',
    primary: '10B981',
    accent: 'F59E0B',
  },
  minimalist: {
    name: 'Clean Minimalist',
    bg: 'FFFFFF',
    text: '111827',
    primary: '000000',
    accent: '9CA3AF',
  },
  'dark theme': {
    name: 'Midnight Cyber',
    bg: '0A0A0C',
    text: 'E4E4E7',
    primary: 'EC4899',
    accent: '06B6D4',
  },
  creative: {
    name: 'Creative Peach',
    bg: 'FFF8F6',
    text: '3A1E13',
    primary: 'F97316',
    accent: 'EAB308',
  },
  corporate: {
    name: 'Corporate Executive',
    bg: 'F7F9FC',
    text: '1A2530',
    primary: '1E3A8A',
    accent: '1E40AF',
  },
};

export default function ThemePicker({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Object.entries(THEMES).map(([key, theme]) => {
        const isSelected = selected === key;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`theme-card ${isSelected ? 'selected' : ''}`}
            style={{
              background: `rgba(15, 23, 42, ${isSelected ? 0.8 : 0.4})`,
            }}
          >
            {/* Color Preview Bar */}
            <div className="flex gap-1 mb-2">
              <div
                className="flex-1 h-6 rounded-md"
                style={{ background: `#${theme.bg}` }}
              />
              <div
                className="w-6 h-6 rounded-md"
                style={{ background: `#${theme.primary}` }}
              />
              <div
                className="w-6 h-6 rounded-md"
                style={{ background: `#${theme.accent}` }}
              />
            </div>

            {/* Theme Name */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">
                {theme.name}
              </span>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export { THEMES };
