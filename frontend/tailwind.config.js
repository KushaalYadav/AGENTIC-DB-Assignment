/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agent: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#3b82f6',
          600: '#2563eb',
          900: '#1e3a8a',
        },
        chart: {
          1: '#1d4ed8',
          2: '#3b82f6',
          3: '#60a5fa',
          4: '#93c5fd',
        }
      }
    },
  },
  plugins: [],
}
