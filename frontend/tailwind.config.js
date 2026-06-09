/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#080810",
        slateBg: "#0f0f1c",
        glassBg: "rgba(255, 255, 255, 0.02)",
        glassBorder: "rgba(255, 255, 255, 0.06)",
        glassHover: "rgba(255, 255, 255, 0.05)",
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
        'glow-purple': '0 0 25px rgba(139, 92, 246, 0.25)',
        'glow-cyan': '0 0 25px rgba(6, 182, 212, 0.25)',
        'glow-green': '0 0 25px rgba(16, 185, 129, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
