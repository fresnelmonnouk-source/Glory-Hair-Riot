import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Palette RIOT */
        forest: '#0E1B14',
        lime: '#D4FF3E',
        orange: '#FF7A1A',
        paper: '#F4ECD8',
        pink: '#FF4D8D',
        'lime-dim': '#B8E035',
        'forest-light': '#1A2E1F',
        'forest-mid': '#243D29',
        ink: '#0A0A0A',
        'ink-soft': '#2A2A2A',
        cream: '#FAF7F0',

        /* Hair tones (conservés) */
        'hair-1': '#1a0f08',
        'hair-2': '#3a1d10',
        'hair-3': '#7a4a26',
        'hair-4': '#c89559',
        'hair-5': '#4a2a3e',
      },
      fontFamily: {
        impact:    ['var(--font-anton)', 'Impact', 'sans-serif'],
        marker:    ['var(--font-permanent-marker)', 'cursive'],
        type:      ['var(--font-special-elite)', '"Courier New"', 'monospace'],
        editorial: ['var(--font-yeseva-one)', 'Georgia', 'serif'],
        terminal:  ['var(--font-vt323)', 'monospace'],
        mono:      ['var(--font-rubik-mono-one)', 'monospace'],
        hand:      ['var(--font-caveat)', 'cursive'],
        bold:      ['var(--font-archivo-black)', 'sans-serif'],
      },
      fontSize: {
        xs: ['11px', { lineHeight: '1.4' }],
        sm: ['12px', { lineHeight: '1.4' }],
        base: ['15px', { lineHeight: '1.5' }],
        lg: ['17px', { lineHeight: '1.6' }],
      },
      borderRadius: {
        sm: '2px',
        md: '4px',
        lg: '6px',
        xl: '8px',
      },
      boxShadow: {
        'riot': '4px 4px 0px #0A0A0A',
        'riot-lime': '4px 4px 0px #D4FF3E',
        'riot-orange': '4px 4px 0px #FF7A1A',
        'riot-lg': '8px 8px 0px #0A0A0A',
      },
      backgroundImage: {
        'gradient-riot': 'linear-gradient(135deg, #0E1B14 0%, #1A2E1F 100%)',
        'gradient-lime': 'linear-gradient(135deg, #D4FF3E 0%, #B8E035 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
