/**
 * Presentation design system themes.
 * Colors are in hex format (six digits, without #, e.g., '1E3A8A' for compatibility)
 */

const THEMES = {
  modern: {
    name: 'Modern Purple',
    bg: 'FAF5FF', // Purple 50
    text: '1F0033', // Deep Purple text
    primary: '6D28D9', // Purple 700
    secondary: 'A78BFA', // Purple 400
    accent: 'F43F5E', // Rose 500
    fontTitle: 'Outfit',
    fontBody: 'Inter'
  },
  professional: {
    name: 'Steel Blue',
    bg: 'F8FAFC', // Slate 50
    text: '0F172A', // Slate 900
    primary: '0F172A', // Slate 900
    secondary: '3B82F6', // Blue 500
    accent: '10B981', // Emerald 500
    fontTitle: 'Montserrat',
    fontBody: 'Inter'
  },
  academic: {
    name: 'Classic Academic',
    bg: 'FDFBF7', // Warm paper
    text: '2D241E', // Dark sepia
    primary: '7F1D1D', // Crimson 900
    secondary: 'B45309', // Amber 700
    accent: '451A03', // Warm brown
    fontTitle: 'Lora',
    fontBody: 'Merriweather'
  },
  'startup pitch': {
    name: 'Startup Pitch',
    bg: '0B0F17', // Dark Charcoal
    text: 'F3F4F6', // Off-white
    primary: '10B981', // Vibrant emerald
    secondary: '3B82F6', // Tech blue
    accent: 'F59E0B', // Bright amber
    fontTitle: 'Outfit',
    fontBody: 'Inter'
  },
  minimalist: {
    name: 'Clean Minimalist',
    bg: 'FFFFFF',
    text: '111827', // Gray 900
    primary: '000000', // Pitch black
    secondary: '4B5563', // Slate gray
    accent: '9CA3AF', // Cool gray
    fontTitle: 'Playfair Display',
    fontBody: 'Inter'
  },
  'dark theme': {
    name: 'Midnight Cyber',
    bg: '0A0A0C', // Jet black
    text: 'E4E4E7', // Zinc 200
    primary: 'EC4899', // Cyan / Pink gradient starts
    secondary: '8B5CF6', // Purple
    accent: '06B6D4', // Cyan
    fontTitle: 'Outfit',
    fontBody: 'Inter'
  },
  creative: {
    name: 'Creative Peach',
    bg: 'FFF8F6', // Creamy peach
    text: '3A1E13', // Soft brown
    primary: 'F97316', // Orange 500
    secondary: 'EC4899', // Pink accent
    accent: 'EAB308', // Amber yellow
    fontTitle: 'Outfit',
    fontBody: 'Work Sans'
  },
  corporate: {
    name: 'Corporate Executive',
    bg: 'F7F9FC', // Ice white
    text: '1A2530', // Deep carbon
    primary: '1E3A8A', // Corporate navy
    secondary: 'D97706', // Gold/brass
    accent: '1E40AF', // Strong blue
    fontTitle: 'Montserrat',
    fontBody: 'Lora'
  }
};

/**
 * Returns a theme configuration or the default if the theme key does not exist.
 */
function getTheme(themeName) {
  const normalized = themeName ? themeName.toLowerCase() : 'professional';
  return THEMES[normalized] || THEMES.professional;
}

module.exports = {
  THEMES,
  getTheme
};
