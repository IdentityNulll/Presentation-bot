/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme premium colors
        brand: {
          dark: '#0f172a',    // slate-900
          card: '#1e293b',    // slate-800
          border: '#334155',  // slate-700
          primary: '#3b82f6', // blue-500
          accent: '#10b981',  // emerald-500
          muted: '#64748b',   // slate-500
          text: '#f8fafc',    // slate-50
          error: '#ef4444'    // red-500
        }
      }
    },
  },
  plugins: [],
}
