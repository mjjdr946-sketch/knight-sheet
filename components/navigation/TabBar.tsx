'use client';

/**
 * TabBar — navigation basse (thumb zone), 4 onglets, indicateur lumineux.
 * Cibles ≥ 44px, rien de hover-dépendant.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

// Prompt v11 §2 : 5 onglets — Chevaliers (accueil) · Feuille · Combat · Dés · Équipement
const ONGLETS = [
  { href: '/', label: 'Chevaliers', icon: '🏠' },
  { href: '/personnage/feuille', label: 'Feuille', icon: '📜' },
  { href: '/personnage/combat', label: 'Combat', icon: '⚔' },
  { href: '/personnage/des', label: 'Dés', icon: '🎲' },
  { href: '/personnage/materiel', label: 'Équipement', icon: '⚒' },
] as const;

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md">
        {ONGLETS.map((onglet) => {
          const actif = pathname === onglet.href;
          return (
            <li key={onglet.href} className="flex-1">
              <Link
                href={onglet.href}
                aria-current={actif ? 'page' : undefined}
                className={`relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-1.5 text-xs transition-colors ${
                  actif ? 'text-neon-cyan' : 'text-zinc-500'
                }`}
              >
                {/* Indicateur lumineux (glow discret sur l'élément actif) */}
                {actif && (
                  <motion.span
                    layoutId="tab-indicator"
                    className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-neon-cyan shadow-glow-cyan"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`text-lg ${actif ? 'drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]' : ''}`}>
                  {onglet.icon}
                </span>
                {onglet.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
