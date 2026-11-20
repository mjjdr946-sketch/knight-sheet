'use client';

/**
 * Animation Mecha/manga au jet (prompt v11 §3) : ~700 ms — flash blanc,
 * shake/zoom du bloc, chiffre qui « tombe » en spring, bordure selon verdict.
 * Vibreur avec motif distinct (feature-detect : silencieux si non supporté,
 * ex. iOS/Safari). Toggle « Cinématique » (réglages de la Feuille, ON par
 * défaut) : OFF = bloc statique sans flash ni vibration.
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/** Vibreur : motif différent réussite/échec/critique (feature-detect). */
export function vibrer(verdict: 'succes' | 'echec' | 'critique'): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return; // iOS/Safari : silencieux
  const motifs: Record<string, number | number[]> = {
    succes: [40, 40, 40],
    echec: 120,
    critique: [80, 50, 80, 50, 160],
  };
  try {
    navigator.vibrate(motifs[verdict] ?? 40);
  } catch {
    // jamais d'erreur côté UI
  }
}

/** Toggle « Cinématique » — persisté dans localStorage, ON par défaut (prompt v11 §3). */
export function useCinematique(): [boolean, (v: boolean) => void] {
  const [actif, setActif] = useState(true);
  useEffect(() => {
    const brut = localStorage.getItem('knight-cinematique');
    if (brut !== null) setActif(brut === '1');
  }, []);
  const maj = (v: boolean) => {
    setActif(v);
    localStorage.setItem('knight-cinematique', v ? '1' : '0');
  };
  return [actif, maj];
}

export interface ResultatAnimeProps {
  /** Valeur affichée (total des réussites) */
  total: number | string;
  /** Verdict : couleur de bordure + motif vibreur */
  verdict: 'succes' | 'echec' | 'critique';
  /** Animation activée (toggle Cinématique — ON par défaut) */
  cinematique: boolean;
  children?: React.ReactNode;
}

const BORDURES: Record<string, string> = {
  succes: 'border-neon-cyan',
  echec: 'border-red-800',
  critique: 'border-neon-gold',
};

const COULEURS: Record<string, string> = {
  succes: 'text-neon-cyan',
  echec: 'text-red-400',
  critique: 'text-neon-gold',
};

export default function ResultatAnime({ total, verdict, cinematique, children }: ResultatAnimeProps) {
  // OFF = bloc statique, sans flash ni vibration
  if (!cinematique) {
    return (
      <div className={`rounded-xl border ${BORDURES[verdict]} bg-zinc-900/80 p-3 text-center`}>
        {children ?? <ResultatNombre total={total} verdict={verdict} />}
      </div>
    );
  }
  return <BlocAnime total={total} verdict={verdict}>{children}</BlocAnime>;
}

function BlocAnime({ total, verdict, children }: { total: number | string; verdict: string; children?: React.ReactNode }) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    vibrer(verdict as 'succes' | 'echec' | 'critique');
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 180); // flash blanc bref
    return () => clearTimeout(timer);
  }, [verdict]);

  return (
    <div className="relative">
      {/* Flash blanc bref (overlay) */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 z-10 rounded-xl bg-white"
          />
        )}
      </AnimatePresence>
      {/* Bloc : shake/zoom (scale 1→1.15→1, x ±6px) */}
      <motion.div
        initial={{ scale: 1.15, x: -6 }}
        animate={{ scale: 1, x: [0, -6, 6, -4, 4, 0] }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className={`rounded-xl border-2 ${BORDURES[verdict]} bg-zinc-900/80 p-3 text-center`}
      >
        {children ?? <ResultatNombre total={total} verdict={verdict} />}
      </motion.div>
    </div>
  );
}

/** Chiffre qui « tombe » avec un spring. */
function ResultatNombre({ total, verdict }: { total: number | string; verdict: string }) {
  return (
    <motion.p
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 18 }}
      className={`text-3xl font-bold ${COULEURS[verdict]}`}
    >
      {total}
    </motion.p>
  );
}
