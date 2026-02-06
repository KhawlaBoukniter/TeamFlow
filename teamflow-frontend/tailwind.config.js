/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Base (Neutral ClickUp/Jira-inspired)
        'app-bg': '#f9fafb',        // gray-50
        'surface': '#ffffff',        // white
        'border': '#e5e7eb',         // gray-200
        'border-light': '#f3f4f6',   // gray-100

        // Text
        'text-primary': '#111827',   // gray-900
        'text-secondary': '#6b7280', // gray-500
        'text-tertiary': '#9ca3af',  // gray-400

        // Brand
        brand: {
          DEFAULT: '#4f46e5',        // indigo-600
          hover: '#4338ca',          // indigo-700
          light: '#eef2ff',          // indigo-50
        },
        accent: {
          DEFAULT: '#06b6d4',        // cyan-500
          hover: '#0891b2',          // cyan-600
          light: '#ecfeff',          // cyan-50
        },

        // Priority (LOW | MEDIUM | HIGH only)
        priority: {
          low: '#10b981',            // green-500
          medium: '#f59e0b',         // amber-500
          high: '#f97316',           // orange-500
        },
        'priority-low-bg': '#ecfdf5',
        'priority-medium-bg': '#fffbeb',
        'priority-high-bg': '#fff7ed',

        // Legacy (for backwards compatibility)
        primary: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#b3c5ff',
          400: '#8099ff',
          500: '#667eea',
          600: '#4d5fd1',
          700: '#3d4db8',
          800: '#2f3d9e',
          900: '#1f2b7a',
        },
        secondary: {
          500: '#764ba2',
        },
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 12px 0 rgba(0, 0, 0, 0.1)',
        'dropdown': '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'card': '8px',
        'button': '6px',
      },
    },
  },
  plugins: [],
}
