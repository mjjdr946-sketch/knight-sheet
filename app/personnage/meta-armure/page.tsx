'use client';

/**
 * Page Méta-armure — Paladin.
 * - Panneau capacités : Shrine / Watchtower (activation, maintenance p.455)
 * - Évolutions 150/200/250 PG (détectées via gloire, p.140)
 * - Slots visuels par zone (p.130)
 * - Modules installés (activation via ModuleCard)
 * - Catalogue 57 modules filtrable (catégorie/accessibilité), installation
 *   à Camelot uniquement (p.130) via le store.
 */
import { useMemo, useState } from 'react';
import ModuleCard from '../../../components/cards/ModuleCard';
import { catalogueModules } from '../../../src/data/modules';
import { useCharacterStore } from '@/store/characterStore';
import type { ModuleCategory, SlotZone } from '@/types/character';

const ZONES: { id: SlotZone; nom: string }[] = [
  { id: 'tete', nom: 'Tête' },
  { id: 'torse', nom: 'Torse' },
  { id: 'brasGauche', nom: 'Bras G' },
  { id: 'brasDroit', nom: 'Bras D' },
  { id: 'jambeGauche', nom: 'Jambe G' },
  { id: 'jambeDroite', nom: 'Jambe D' },
];

const CATEGORIES: { id: ModuleCategory; nom: string }[] = [
  { id: 'deplacement', nom: 'Déplacement' },
  { id: 'contact', nom: 'Contact' },
  { id: 'distance', nom: 'Distance' },
  { id: 'visee', nom: 'Visée' },
  { id: 'defense', nom: 'Défense' },
  { id: 'tactique', nom: 'Tactique' },
  { id: 'utilitaire', nom: 'Utilitaire' },
  { id: 'amelioration', nom: 'Amélioration' },
  { id: 'automatise', nom: 'Automatisé' },
];

export default function MetaArmurePage() {
  const character = useCharacterStore((s) => s.character);
  const activerModule = useCharacterStore((s) => s.activerModule);
  const installerModule = useCharacterStore((s) => s.installerModule);
  const desinstallerModule = useCharacterStore((s) => s.desinstallerModule);
  const activerCapacite = useCharacterStore((s) => s.activerCapacite);
  const payerMaintenanceShrine = useCharacterStore((s) => s.payerMaintenanceShrine);

  // Filtres du catalogue
  const [filtreCat, setFiltreCat] = useState<ModuleCategory | 'toutes'>('toutes');
  const [filtreAcc, setFiltreAcc] = useState<'tous' | 'standard' | 'avance' | 'rare'>('tous');

  const catalogueFiltre = useMemo(() =>
    catalogueModules.filter((m) =>
      (filtreCat === 'toutes' || m.categorie === filtreCat) &&
      (filtreAcc === 'tous' || m.accessibilite === filtreAcc),
    ), [filtreCat, filtreAcc]);

  const idsInstalles = new Set(character.modules.map((m) => m.id));

  // Slots occupés par zone (modules actifs)
  const slotsPris: Record<SlotZone, number> = { tete: 0, torse: 0, brasGauche: 0, brasDroit: 0, jambeGauche: 0, jambeDroite: 0 };
  for (const mod of character.modules) {
    if (mod.etat !== 'actif') continue;
    for (const [zone, n] of Object.entries(mod.slots)) {
      slotsPris[zone as SlotZone] += n ?? 0;
    }
  }

  return (
    <div className="space-y-5">
      {/* ─── Capacités d'armure ─────────────────────────────────────── */}
      <section>
        <h2 className="font-display mb-2 text-xs uppercase tracking-widest text-zinc-500">Capacités</h2>
        <div className="space-y-2">
          {character.metaArmor.capacites.map((cap) => (
            <div key={cap.id} className={`rounded-xl border p-3 ${cap.active ? 'border-neon-cyan/50 shadow-glow-cyan' : 'border-zinc-800'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{cap.nom}</span>
                <button
                  type="button"
                  onClick={() => activerCapacite(cap.id, !cap.active)}
                  className={`min-h-[44px] rounded-lg px-3 text-xs ${
                    cap.active ? 'bg-neon-cyan/15 text-neon-cyan' : 'border border-zinc-700 text-zinc-400'
                  }`}
                >
                  {cap.active ? 'Désactiver' : 'Activer'}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">{cap.coutPE} PE · {cap.duree}</p>
              {cap.id === 'shrine' && cap.active && (
                <button
                  type="button"
                  onClick={() => payerMaintenanceShrine()}
                  className="mt-2 min-h-[44px] w-full rounded-lg border border-neon-gold/40 text-xs text-neon-gold active:bg-neon-gold/10"
                >
                  Payer maintenance (1 PE / tour — FAQ p.455)
                </button>
              )}
            </div>
          ))}
        </div>
        {/* Évolutions */}
        <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-900/70 p-2">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Évolutions (gloire {character.gloire} PG)</p>
          <ul className="mt-1 space-y-0.5 text-[11px]">
            {character.metaArmor.evolutions.map((evo) => (
              <li key={evo.seuilPG} className={character.gloire >= evo.seuilPG ? 'text-neon-cyan' : 'text-zinc-500'}>
                {character.gloire >= evo.seuilPG ? '✓' : '○'} {evo.seuilPG} PG — {evo.description.slice(0, 60)}…
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── Slots visuels ──────────────────────────────────────────── */}
      <section>
        <h2 className="font-display mb-2 text-xs uppercase tracking-widest text-zinc-500">Slots</h2>
        <div className="grid grid-cols-3 gap-1.5">
          {ZONES.map((z) => {
            const dispo = character.metaArmor.slots[z.id];
            const pris = slotsPris[z.id];
            return (
              <div key={z.id} className={`rounded-lg border p-2 text-center ${pris >= dispo ? 'border-red-800/60' : 'border-zinc-800'}`}>
                <p className="text-[9px] uppercase text-zinc-500">{z.nom}</p>
                <p className="text-sm font-bold text-white">{pris}<span className="text-zinc-500">/{dispo}</span></p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Modules installés ──────────────────────────────────────── */}
      <section>
        <h2 className="font-display mb-2 text-xs uppercase tracking-widest text-zinc-500">
          Modules installés ({character.modules.length})
        </h2>
        <div className="space-y-2">
          {character.modules.map((mod) => (
            <div key={mod.id} className="flex items-start gap-1.5">
              <div className="flex-1"><ModuleCard module={mod} onActiver={(a) => activerModule(mod.id, a)} /></div>
              <button
                type="button"
                aria-label={`Désinstaller ${mod.nom}`}
                onClick={() => desinstallerModule(mod.id)}
                className="mt-1 h-11 w-11 rounded-lg border border-red-900/50 text-red-400 active:bg-red-900/20"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Catalogue filtrable ────────────────────────────────────── */}
      <section>
        <h2 className="font-display mb-2 text-xs uppercase tracking-widest text-zinc-500">
          Catalogue — installation à Camelot uniquement (p.130)
        </h2>
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFiltreCat('toutes')}
            className={`shrink-0 rounded-lg border px-2.5 py-2 text-[11px] ${filtreCat === 'toutes' ? 'border-neon-cyan text-neon-cyan' : 'border-zinc-700 text-zinc-400'}`}
          >
            Toutes
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFiltreCat(c.id)}
              className={`shrink-0 rounded-lg border px-2.5 py-2 text-[11px] ${filtreCat === c.id ? 'border-neon-cyan text-neon-cyan' : 'border-zinc-700 text-zinc-400'}`}
            >
              {c.nom}
            </button>
          ))}
        </div>
        <div className="mb-2 flex gap-1.5">
          {(['tous', 'standard', 'avance', 'rare'] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setFiltreAcc(a)}
              className={`rounded-lg border px-2.5 py-2 text-[11px] ${filtreAcc === a ? 'border-neon-gold text-neon-gold' : 'border-zinc-700 text-zinc-400'}`}
            >
              {a === 'tous' ? 'Tous niveaux' : a}
            </button>
          ))}
        </div>
        <ul className="space-y-1.5">
          {catalogueFiltre.map((m) => (
            <li key={m.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-2.5 py-2">
              <div>
                <p className="text-xs text-white">{m.nom}</p>
                <p className="text-[10px] text-zinc-500">{m.categorie} · {m.accessibilite} · {m.coutPG} PG{m.coutPE ? ` · ${m.coutPE} PE` : ''}</p>
              </div>
              {idsInstalles.has(m.id) ? (
                <span className="rounded-full bg-neon-cyan/15 px-2 py-1 text-[10px] text-neon-cyan">Installé</span>
              ) : (
                <button
                  type="button"
                  onClick={() => installerModule(m)}
                  className="min-h-[40px] rounded-lg border border-zinc-700 px-2.5 text-[11px] text-zinc-300 active:bg-zinc-800"
                >
                  Installer
                </button>
              )}
            </li>
          ))}
        </ul>
        {catalogueFiltre.length === 0 && <p className="text-xs text-zinc-600">Aucun module pour ces filtres.</p>}
      </section>
    </div>
  );
}
