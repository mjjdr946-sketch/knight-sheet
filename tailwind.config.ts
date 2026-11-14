import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
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
