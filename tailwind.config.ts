import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Lisibilité mobile (prompt v5 §1) : remap global des tailles
      // text-xs = 16px minimum partout, décale tout l'échelonnement vers le haut.
      fontSize: {
        'xs': ['1rem', { lineHeight: '1.4' }],
        'sm': ['1.125rem', { lineHeight: '1.45' }],
        'base': ['1.25rem', { lineHeight: '1.5' }],
        'lg': ['1.375rem', { lineHeight: '1.4' }],
        'xl': ['1.5rem', { lineHeight: '1.35' }],
        '2xl': ['1.875rem', { lineHeight: '1.25' }],
        '3xl': ['2.25rem', { lineHeight: '1.2' }],
      },
      colors: {
        // Identité visuelle : fond sombre, néon cyan primaire + doré (Paladin)
        neon: {
          cyan: '#22d3ee',
          gold: '#fbbf24',
        },
      },
      boxShadow: {
        // Glow discret sur l'élément actif
        'glow-cyan': '0 0 8px 1px rgba(34, 211, 238, 0.45)',
        'glow-gold': '0 0 8px 1px rgba(251, 191, 36, 0.45)',
      },
    },
  },
  plugins: [],
};

export default config;
