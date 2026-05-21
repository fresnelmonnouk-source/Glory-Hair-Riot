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
        /* Palette Sable (default) */
        bg: '#efe6d4',
        'bg-deep': '#e5d8c0',
        'bg-warm': '#faf6ee',
        surface: '#fffdf8',
        ink: '#1f1611',
        'ink-soft': '#5a4a3e',
        'ink-mute': '#8a7868',
        gold: '#b88746',
        'gold-light': '#d9b16f',
        'gold-deep': '#7d5a2c',
        blush: '#e9c7b3',
        terracotta: '#c87158',
        aubergine: '#3a1f2e',
        plum: '#5a2e44',

        /* Hair tones */
        'hair-1': '#1a0f08', /* noir */
        'hair-2': '#3a1d10', /* châtain */
        'hair-3': '#7a4a26', /* miel */
        'hair-4': '#c89559', /* blond doré */
        'hair-5': '#4a2a3e', /* prune */
      },
      fontFamily: {
        display: ['"Instrument Serif"', '"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['"DM Sans"', '-apple-system', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['11px', { lineHeight: '1.4' }],
        sm: ['12px', { lineHeight: '1.4' }],
        base: ['15px', { lineHeight: '1.5' }],
        lg: ['17px', { lineHeight: '1.6' }],
      },
      borderRadius: {
        sm: '10px',
        md: '18px',
        lg: '28px',
        xl: '40px',
      },
      boxShadow: {
        '1': '0 1px 2px rgba(31,22,17,.04), 0 2px 6px rgba(31,22,17,.04)',
        '2': '0 2px 4px rgba(31,22,17,.05), 0 8px 24px rgba(31,22,17,.08)',
        '3': '0 4px 8px rgba(31,22,17,.06), 0 20px 50px rgba(31,22,17,.14)',
        'glow-gold': '0 20px 60px -10px rgba(184,135,70,.45), 0 0 80px -20px rgba(217,177,111,.5)',
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, var(--gold-deep) 0%, var(--gold) 50%, var(--gold-light) 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
