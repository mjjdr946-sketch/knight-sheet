'use client';

/**
 * RuleDrawer — UN drawer réutilisable (slide droite, fermeture par swipe ou
 * tap extérieur, ergonomie type Demiplane). Cibles ≥ 44px, rien de hover-dépendant.
 */
import { AnimatePresence, motion } from 'framer-motion';

export interface RuleDrawerProps {
  open: boolean;
  onClose: () => void;
  titre: string;
  sousTitre?: string;
  /** Référence de page du livre, affichée en en-tête */
  pageRef?: string;
  children: React.ReactNode;
}

export default function RuleDrawer({ open, onClose, titre, sousTitre, pageRef, children }: RuleDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Fond assombri — tap extérieur pour fermer */}
          <motion.button
            type="button"
            aria-label="Fermer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60"
          />
          {/* Panneau — slide droite, swipe pour fermer */}
          <motion.aside
            role="dialog"
            aria-modal="true"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ right: 0.6, left: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 80) onClose();
            }}
            className="fixed inset-y-0 right-0 z-50 flex w-[88%] max-w-sm flex-col rounded-l-2xl border-l border-neon-cyan/30 bg-zinc-900 shadow-2xl"
          >
            <header className="border-b border-zinc-800 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-base text-white">{titre}</h2>
                  {sousTitre && <p className="mt-0.5 text-xs text-zinc-400">{sousTitre}</p>}
                  {pageRef && (
                    <span className="mt-1 inline-block rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-neon-cyan">
                      {pageRef}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Fermer le panneau"
                  onClick={onClose}
                  className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl text-zinc-400 active:bg-zinc-800"
                >
                  ×
                </button>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto px-4 py-3 text-sm text-zinc-200">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
