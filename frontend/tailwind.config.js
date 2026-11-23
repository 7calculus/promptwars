import colors from 'tailwindcss/colors';

/**
 * LabLink — black & orange "dark-tech" theme.
 *
 * Rather than rewriting hundreds of class names, the default light palette is
 * re-mapped for a dark UI:
 *   • slate  → inverted neutral scale (bg-slate-50 is now near-black,
 *               text-slate-900 is now near-white)
 *   • indigo / orange → LabLink orange
 *   • violet / purple / pink / cyan / teal / sky → amber-gold accent
 *   • every other colour keeps its strong shades (400–600) but its pale
 *     backgrounds (50–300) become deep tints and its dark text (700–900)
 *     becomes light, so status badges stay readable on black.
 */
const darken = (c) => ({
  50: c[950], 100: c[900], 200: c[800], 300: c[700],
  400: c[400], 500: c[500], 600: c[600],
  700: c[300], 800: c[200], 900: c[100], 950: c[50],
});

const orange = {
  50: '#1a0d03', 100: '#2a1305', 200: '#4a2108', 300: '#7a3a0c',
  400: '#ff8a1f', 500: '#ff6a00', 600: '#e85400', 700: '#ffa24d',
  800: '#ffbb80', 900: '#ffd2a8', 950: '#fff0e0',
};

const gold = {
  50: '#1a1203', 100: '#2b1d04', 200: '#4d3407', 300: '#7d5509',
  400: '#ffc233', 500: '#ffb000', 600: '#e69500', 700: '#ffd166',
  800: '#ffdf99', 900: '#ffecc2', 950: '#fff8e6',
};

const slate = {
  50: '#0a0a0c', 100: '#131316', 200: '#26262b', 300: '#3a3a42',
  400: '#80808b', 500: '#9a9aa6', 600: '#b8b8c3', 700: '#d4d4dc',
  800: '#ececf0', 900: '#fafafa', 950: '#ffffff',
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Orbitron', '"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        slate,
        gray: slate,
        indigo: orange,
        orange,
        violet: gold, purple: gold, fuchsia: gold, pink: gold,
        cyan: gold, teal: gold, sky: gold,
        amber: darken(colors.amber),
        yellow: darken(colors.yellow),
        emerald: darken(colors.emerald),
        green: darken(colors.green),
        red: darken(colors.red),
        rose: darken(colors.rose),
        blue: darken(colors.blue),
      },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(10px)' }, '100%': { opacity: 1, transform: 'none' } },
        'glow-pulse': { '0%,100%': { boxShadow: '0 0 12px rgba(255,106,0,.35)' }, '50%': { boxShadow: '0 0 26px rgba(255,106,0,.75)' } },
        scan: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-up': 'fade-up .45s ease-out both',
        'glow-pulse': 'glow-pulse 2.4s ease-in-out infinite',
        scan: 'scan 3.2s linear infinite',
      },
    },
  },
  plugins: [],
};
