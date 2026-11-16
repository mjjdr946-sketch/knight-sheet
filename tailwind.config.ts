import type { Config } from 'tailwindcss';

/**
 * Config — DOCUMENT 3 (prompt v8) :
 * - border DEFAULT = hsl(var(--border-color) / <alpha-value>) — l'alpha est
 *   appliqué dans les composants (ex. border/40).
 * - Tokens sémantiques de jauges (identiques pour toutes les classes) +
 *   danger/success/warning (ne jamais dériver de --primary).
 * - Les anciennes classes neon-cyan/neon-gold deviennent des ACCENTS THÉMATIQUES :
 *   cyan → --primary, gold → --secondary. Tout l'existant suit le thème actif.
 * - Glow = teinte primaire (règle 2 : jamais sur le texte courant, via
 *   .glow-accent ou shadow-glow-* sur les éléments interactifs actifs).
 */
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
        // Accents thématiques (suitent data-theme sur <html>)
        neon: {
          cyan: 'hsl(var(--primary) / <alpha-value>)',
          gold: 'hsl(var(--secondary) / <alpha-value>)',
        },
        // Jauges SÉMANTIQUES — fixes sur toutes les classes (règle 1)
        gauge: {
          ps: 'hsl(var(--gauge-ps) / <alpha-value>)',
          pa: 'hsl(var(--gauge-pa) / <alpha-value>)',
          pe: 'hsl(var(--gauge-pe) / <alpha-value>)',
          espoir: 'hsl(var(--gauge-espoir) / <alpha-value>)',
          heroisme: 'hsl(var(--gauge-heroisme) / <alpha-value>)',
        },
        danger: 'hsl(var(--danger) / <alpha-value>)',
        success: 'hsl(var(--success) / <alpha-value>)',
        warning: 'hsl(var(--warning) / <alpha-value>)',
      },
      borderColor: {
        DEFAULT: 'hsl(var(--border-color) / <alpha-value>)',
      },
      boxShadow: {
        // Glow suit le thème actif (teinte primaire +8-15 % de lumière)
        'glow-cyan': '0 0 10px hsl(var(--primary-glow) / 0.5), 0 0 20px hsl(var(--primary-glow) / 0.2)',
        'glow-gold': '0 0 10px hsl(var(--primary-glow) / 0.35), 0 0 20px hsl(var(--primary-glow) / 0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
