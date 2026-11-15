'use client';

/**
 * Accordion — drill-down généralisé (prompt v5 §1) : les longues listes sont
 * repliées par défaut, un tap déroule, un second replie. Cible ≥ 48px,
 * chevron animé (Framer Motion, sobre).
 */
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

export interface AccordionProps {
  titre: string;
  /** Compteur affiché à droite (ex. nombre d'éléments) */
  compteur?: number | string;
  /** Replié par défaut (prompt v5 : drill-down généralisé) */
  ouvertParDefaut?: boolean;
  /** Ligne secondaire optionnelle sous le titre */
  sousTitre?: string;
  accent?: 'cyan' | 'gold' | 'neutre';
  children: React.ReactNode;
}

export default function Accordion({
  titre,
  compteur,
  ouvertParDefaut = false,
  sousTitre,
  accent = 'neutre',
  children,
}: AccordionProps) {
  const [ouvert, setOuvert] = useState(ouvertParDefaut);
  const accentClass =
    accent === 'cyan' ? 'text-neon-cyan' : accent === 'gold' ? 'text-neon-gold' : 'text-zinc-400';

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/70">
      <button
        type="button"
        aria-expanded={ouvert}
        onClick={() => setOuvert((o) => !o)}
        className="flex min-h-[48px] w-full items-center justify-between px-3 py-2 text-left active:bg-zinc-800/60"
      >
        <div className="flex items-baseline gap-2">
          <span className={`font-display text-xs uppercase tracking-widest ${accentClass}`}>{titre}</span>
          {sousTitre && <span className="text-xs text-zinc-600">{sousTitre}</span>}
        </div>
        <div className="flex items-center gap-2">
          {compteur !== undefined && (
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{compteur}</span>
          )}
          <motion.span
            animate={{ rotate: ouvert ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className={`text-lg ${accentClass}`}
            aria-hidden
          >
            ▾
          </motion.span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {ouvert && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
