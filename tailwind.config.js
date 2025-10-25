/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors (Indigo)
        'brand-primary': '#3730a3',
        'brand-secondary': '#6366f1',
        'brand-light': '#e0e7ff',

        // Status Colors
        'status-paid': '#10b981',      // emerald-500
        'status-active': '#f59e0b',    // amber-500
        'status-renewed': '#0ea5e9',   // sky-500
        'status-overdue': '#f43f5e',   // rose-500

        // Stat Card Colors
        'stat-indigo': '#6366f1',
        'stat-emerald': '#10b981',
        'stat-amber': '#f59e0b',
        'stat-sky': '#0ea5e9',
        'stat-violet': '#8b5cf6',
        
        // Alert Colors
        'alert-warning-text': '#d97706', // amber-600
        'alert-danger-bg': '#ffe4e6',    // rose-100
        'alert-danger-text': '#9f1239',   // rose-800
      }
    }
  },
  plugins: [],
}
