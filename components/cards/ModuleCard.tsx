'use client';

/**
 * ModuleCard — carte générique de module de méta-armure (tap = RuleDrawer).
 * Aucun calcul : activation refusée/acceptée par le store (slots, interdits, PE).
 */
import { useState } from 'react';
import RuleDrawer from '../drawers/RuleDrawer';
import type { ArmorModule } from '@/types/character';

export interface ModuleCardProps {
  module: ArmorModule;
  /** Slots libres affichés par zone (fournis par la page, calculés au store) */
  onActiver: (activer: boolean) => void;
}

const etatStyles = {
  actif: 'border-neon-cyan/50 shadow-glow-cyan',
  inactif: 'border-zinc-800',
  endommage: 'border-red-800/60',
} as const;

export default function ModuleCard({ module, onActiver }: ModuleCardProps) {
  const [drawer, setDrawer] = useState(false);
  const slots = Object.entries(module.slots)
    .map(([zone, n]) => `${zone} ×${n}`)
    .join(', ');

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawer(true)}
        className={`w-full rounded-xl border p-3 text-left active:bg-zinc-900 ${etatStyles[module.etat]}`}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-white">{module.nom}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs uppercase ${
              module.etat === 'actif'
                ? 'bg-neon-cyan/15 text-neon-cyan'
                : module.etat === 'endommage'
                  ? 'bg-red-900/40 text-red-300'
                  : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            {module.etat}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">
          {module.categorie} · {slots || 'aucun slot'}{module.coutPE ? ` · ${module.coutPE} PE` : ''}
        </p>
      </button>

      <RuleDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        titre={module.nom}
        sousTitre={`${module.accessibilite} — ${module.coutPG} PG${module.niveau ? ` · niveau ${module.niveau}` : ''}`}
        pageRef="Annexe 2, modules"
      >
        <div className="space-y-3">
          <p className="text-sm text-zinc-300">{module.description}</p>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div><dt className="text-zinc-500">Activation</dt><dd>{module.activation}</dd></div>
            <div><dt className="text-zinc-500">Durée</dt><dd>{module.duree}</dd></div>
            {module.coutPE && <div><dt className="text-zinc-500">Énergie</dt><dd>{module.coutPE}</dd></div>}
            <div><dt className="text-zinc-500">Slots</dt><dd>{slots || '—'}</dd></div>
          </dl>
          {module.effets.length > 0 && (
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Effets actifs</p>
              <ul className="space-y-1">
                {module.effets.map((e) => (
                  <li key={`${e.source}-${e.target}`} className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
                    {e.source} → {e.target} : {e.valeur > 0 ? '+' : ''}{e.valeur} ({e.type})
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              onActiver(module.etat !== 'actif');
              setDrawer(false);
            }}
            className="min-h-[48px] w-full rounded-lg bg-neon-cyan/15 text-sm font-medium text-neon-cyan active:bg-neon-cyan/25"
          >
            {module.etat === 'actif' ? 'Désactiver' : 'Activer'}
          </button>
        </div>
      </RuleDrawer>
    </>
  );
}
