/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
      },
      colors: {
        brand: {
          50: '#F0F7FF',
          100: '#E0EFFE',
          200: '#BAE0FD',
          500: '#0284C7',
          600: '#0369A1',
          700: '#075985',
          800: '#0C4A6E',
          900: '#0F172A',
        },
        status: {
          healthy: {
            bg: '#F0FDF4',
            text: '#166534',
            border: '#DCFCE7',
            dot: '#22C55E'
          },
          lowstock: {
            bg: '#FFFBEB',
            text: '#92400E',
            border: '#FEF3C7',
            dot: '#F59E0B'
          },
          outofstock: {
            bg: '#FEF2F2',
            text: '#991B1B',
            border: '#FEE2E2',
            dot: '#EF4444'
          },
          expiring: {
            bg: '#FAF5FF',
            text: '#6B21A8',
            border: '#F3E8FF',
            dot: '#A855F7'
          },
          expired: {
            bg: '#7F1D1D',
            text: '#FFFFFF',
            border: '#991B1B',
            dot: '#F87171'
          }
        }
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'modal': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
