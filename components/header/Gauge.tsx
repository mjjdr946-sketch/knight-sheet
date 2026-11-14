'use client';

/**
 * Jauge individuelle — score 1-tap (+/−) avec flash néon et compteur à ressort.
 * Ne calcule RIEN : le max vient des stats dérivées du store (moteur).
 */
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export interface GaugeProps {
  nom: string;
  /** Valeur affichée (score actuel) */
  current: number;
  /** Maximum calculé par le moteur */
  max: number;
  /** Couleur néon : cyan (primaire) ou doré (secondaire, Paladin) */
  accent: 'cyan' | 'gold';
  /** Callback +/− — le store applique et recalcule */
  onDelta: (delta: number) => void;
}

const accentClasses = {
  cyan: {
    text: 'text-neon-cyan',
    border: 'border-neon-cyan/40',
    bar: 'bg-neon-cyan',
    glow: 'shadow-glow-cyan',
    flash: 'bg-neon-cyan/25',
  },
  gold: {
    text: 'text-neon-gold',
    border: 'border-neon-gold/40',
    bar: 'bg-neon-gold',
    glow: 'shadow-glow-gold',
    flash: 'bg-neon-gold/25',
  },
} as const;

export default function Gauge({ nom, current, max, accent, onDelta }: GaugeProps) {
  const a = accentClasses[accent];
  const [flash, setFlash] = useState(0);

  // Compteur à ressort (Framer Motion, sobre)
  const spring = useSpring(current, { stiffness: 300, damping: 24 });
  useEffect(() => {
    spring.set(current);
  }, [current, spring]);
  const affiche = useTransform(spring, (v) => Math.round(v).toString());

  const press = (delta: number) => {
    setFlash((n) => n + 1); // déclenche le flash néon
    onDelta(delta);
  };

  const ratio = max > 0 ? Math.min(1, current / max) : 0;

  return (
    <div className={`relative flex min-w-[72px] flex-col rounded-xl border ${a.border} bg-zinc-900/80 px-2 py-1.5`}>
      {/* Flash néon au tap */}
      <AnimatePresence>
        {flash > 0 && (
          <motion.span
            key={flash}
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className={`pointer-events-none absolute inset-0 rounded-xl ${a.flash}`}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <span className={`text-[10px] font-medium uppercase tracking-wider ${a.text}`}>{nom}</span>

      <div className="flex items-center justify-center gap-1">
        {/* Cibles ≥ 44px (UX mobile) */}
        <button
          type="button"
          aria-label={`Retirer 1 point de ${nom}`}
          onClick={() => press(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-xl text-zinc-300 active:bg-zinc-800"
        >
          −
        </button>

        <motion.span className={`min-w-[2.5ch] text-center text-lg font-bold tabular-nums text-white ${a.text}`}>
          <motion.span key="valeur" className="inline-block">
            {affiche}
          </motion.span>
        </motion.span>

        <button
          type="button"
          aria-label={`Ajouter 1 point de ${nom}`}
          onClick={() => press(1)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-xl text-zinc-300 active:bg-zinc-800"
        >
          +
        </button>
      </div>

      {/* Barre de remplissage */}
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-zinc-800">
        <motion.div
          className={`h-full rounded-full ${a.bar}`}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        />
      </div>

      <span className="mt-0.5 text-center text-[9px] text-zinc-500">max {max}</span>
    </div>
  );
}
