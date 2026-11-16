'use client';

/**
 * Layout des pages personnage — héberge GaugeBar (sticky) + TabBar (fixed).
 * Client component : Zustand + persist (localStorage) + Framer Motion.
 * Garde d'hydratation : l'état persisté n'est lu qu'après le montage pour
 * éviter tout mismatch SSR (localStorage indisponible côté serveur).
 */
import { useEffect, useState } from 'react';
import GaugeBar from '../../components/header/GaugeBar';
import TabBar from '../../components/navigation/TabBar';
import { useCharacterStore, themeDeFiche } from '@/store/characterStore';
import { computeDerived } from '@/engine/stats';

export default function PersonnageLayout({ children }: { children: React.ReactNode }) {
  const [hydrate, setHydrate] = useState(false);
  const remplacerPersonnage = useCharacterStore((s) => s.remplacerPersonnage);

  useEffect(() => {
    // Reprise du persist : recalcul des dérivées à partir du personnage restauré
    useCharacterStore.persist.rehydrate();
    const state = useCharacterStore.getState();
    useCharacterStore.setState({ derived: computeDerived(state.character) });
    // DOCUMENT 3 règle 4 : data-theme suit la classe du personnage actif
    document.documentElement.setAttribute('data-theme', themeDeFiche(state.character));
    setHydrate(true);
  }, [remplacerPersonnage]);

  // Rendu neutre tant que le persist n'est pas relit (anti-flash / anti-mismatch)
  if (!hydrate) {
    return (
      <div className="flex h-dvh items-center justify-center bg-zinc-950">
        <span className="font-display text-sm text-neon-cyan animate-pulse">Knight</span>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col">
      <GaugeBar />
      <main className="flex-1 overflow-y-auto px-3 pb-24 pt-3">{children}</main>
      <TabBar />
    </div>
  );
}
