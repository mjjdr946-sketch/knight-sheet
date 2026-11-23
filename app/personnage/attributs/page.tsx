'use client';

/**
 * Page Attributs — matrice 5 aspects × 15 caractéristiques, éditable (+/−),
 * valeurs dérivées affichées avec leur formule (title = formule + page du livre).
 * Les totaux ne changent qu'entre missions (règle p.88/§5) — l'édition ici
 * représente une intermission.
 */
import { useState } from 'react';
import { useCharacterStore } from '@/store/characterStore';
import Accordion from '../../../components/ui/Accordion';
import type { AspectId, TraitId } from '@/types/character';

const ASPECTS: { id: AspectId; nom: string; traits: { id: TraitId; nom: string }[] }[] = [
  { id: 'chair', nom: 'Chair', traits: [{ id: 'deplacement', nom: 'Déplacement' }, { id: 'force', nom: 'Force' }, { id: 'endurance', nom: 'Endurance' }] },
  { id: 'bete', nom: 'Bête', traits: [{ id: 'hargne', nom: 'Hargne' }, { id: 'combat', nom: 'Combat' }, { id: 'instinct', nom: 'Instinct' }] },
  { id: 'machine', nom: 'Machine', traits: [{ id: 'tir', nom: 'Tir' }, { id: 'savoir', nom: 'Savoir' }, { id: 'technique', nom: 'Technique' }] },
  { id: 'dame', nom: 'Dame', traits: [{ id: 'aura', nom: 'Aura' }, { id: 'parole', nom: 'Parole' }, { id: 'sangfroid', nom: 'Sang-Froid' }] },
  { id: 'masque', nom: 'Masque', traits: [{ id: 'discretion', nom: 'Discrétion' }, { id: 'dexterite', nom: 'Dextérité' }, { id: 'perception', nom: 'Perception' }] },
];

/** Choix possibles de caractéristique pour chaque valeur dérivée (p.88 : "au choix") */
const CHOIX_DERIVEES: { cle: 'defense' | 'reaction' | 'initiative' | 'sante'; nom: string; aspect: AspectId; formule: string; page: string }[] = [
  { cle: 'defense', nom: 'Défense', aspect: 'bete', formule: 'carac. Bête au choix + 1 par OD', page: 'p.88, p.172' },
  { cle: 'reaction', nom: 'Réaction', aspect: 'machine', formule: 'carac. Machine au choix + 1 par OD', page: 'p.88, p.172' },
  { cle: 'initiative', nom: 'Initiative', aspect: 'masque', formule: 'carac. Masque au choix + 1 par OD', page: 'p.86, p.172' },
  { cle: 'sante', nom: 'Points de santé', aspect: 'chair', formule: '10 + 6 × carac. Chair (sans OD)', page: 'p.90, p.172' },
];

export default function AttributsPage() {
  const character = useCharacterStore((s) => s.character);
  const monterTrait = useCharacterStore((s) => s.monterTrait);
  const monterAspect = useCharacterStore((s) => s.monterAspect);
  const [erreurProgression, setErreurProgression] = useState('');
  const derived = useCharacterStore((s) => s.derived);
  const setChoixDerive = useCharacterStore((s) => s.setChoixDerive);
  const depenserContacts = useCharacterStore((s) => s.depenserContacts);
  const contactsDepenses = useCharacterStore((s) => s.combatSession.contactsDepenses);

  return (
    <div className="space-y-5">
      {/* ─── Matrice aspects/caractéristiques ───────────────────────── */}
      <section className="space-y-2">
        <h2 className="font-display text-xs uppercase tracking-widest text-zinc-500">
          Aspects & caractéristiques
        </h2>
        <p className="text-xs text-zinc-600">
          L'aspect fixe le plafond de ses caractéristiques (p.110) · aspect limité à 9 pour les PJ
        </p>
        {ASPECTS.map((aspect) => (
          <div key={aspect.id} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-display text-sm text-neon-gold">{aspect.nom}</span>
              {/* IT. 21 §4 : liste à DEUX valeurs (actuel / actuel+1) — monte un
                  cran, coût = nouvelle valeur, plafond 9 PJ (p.110) */}
              <select
                value={character.aspects[aspect.id]}
                onChange={(e) => {
                  const cible = Number(e.target.value);
                  if (cible === character.aspects[aspect.id]) return;
                  const r = monterAspect(aspect.id, cible);
                  if (!r.ok) setErreurProgression(r.message);
                }}
                className="min-h-[48px] rounded border border-zinc-700 bg-zinc-950 px-2 text-xs text-white"
              >
                {[character.aspects[aspect.id], character.aspects[aspect.id] + 1].map((v) => (
                  <option key={v} value={v}>
                    {v} PG{v === character.aspects[aspect.id] ? '' : ` (coût ${v})`}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {aspect.traits.map((t) => {
                // IT. 21 §5 : liste déroulante — valeurs 1..plafond (l'aspect
                // fixe le plafond des caractéristiques liées, p.110), coût =
                // nouvelle valeur, débitée de la gloire dans le store.
                const actuel = character.traits[t.id] ?? 1;
                const plafond = character.aspects[aspect.id] ?? 9;
                const options = Array.from({ length: plafond }, (_, i) => i + 1);
                return (
                  <div key={t.id} className="rounded-lg bg-zinc-950 px-1 py-1">
                    <span className="block text-[10px] text-zinc-500">{t.nom}</span>
                    <select
                      value={actuel}
                      onChange={(e) => {
                        const r = monterTrait(t.id, Number(e.target.value));
                        if (!r.ok) setErreurProgression(r.message);
                      }}
                      className="min-h-[48px] w-full rounded border border-zinc-700 bg-zinc-950 text-sm text-white"
                    >
                      {options.map((v) => (
                        <option key={v} value={v}>
                          {v}{v > actuel ? ` (${v} PG)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {erreurProgression && (
          <p className="mt-2 rounded-lg border border-red-900 bg-red-900/40 px-2 py-1 text-xs text-red-300" role="alert">
            {erreurProgression}
          </p>
        )}
      </section>

      {/* ─── Valeurs dérivées : choix de la caractéristique (replié) ── */}
      <Accordion titre="Valeurs dérivées" compteur={4} accent="cyan">
        <div className="space-y-2">
          {CHOIX_DERIVEES.map((d) => {
            const valeur = d.cle === 'defense' ? derived.defense : d.cle === 'reaction' ? derived.reaction : d.cle === 'initiative' ? derived.initiative : derived.ps.max;
            const choix = character.choixDerivees[d.cle];
            const traitsDisponibles = ASPECTS.find((a) => a.id === d.aspect)!.traits;
            return (
              <div key={d.cle} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">
                    {d.nom} = <span className="font-bold text-neon-cyan">{valeur}</span>
                  </span>
                  <span className="text-xs text-zinc-600" title={`${d.formule} (${d.page})`}>
                    {d.formule} · {d.page}
                  </span>
                </div>
                <div className="mt-1 flex gap-1.5 overflow-x-auto pb-0.5">
                  {traitsDisponibles.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setChoixDerive(d.cle, t.id)}
                      className={`min-h-[40px] shrink-0 rounded-lg border px-2 text-xs ${
                        choix === t.id ? 'border-neon-cyan text-neon-cyan shadow-glow-cyan' : 'border-zinc-700 text-zinc-400'
                      }`}
                    >
                      {t.nom} {character.traits[t.id]}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-2 text-sm text-white">
            Points de contact ={' '}
            <span className="font-bold text-neon-cyan">{derived.contacts - (contactsDepenses ?? 0)}</span>
            <span className="ml-2 text-xs text-zinc-600" title="meilleure carac. Dame, sans OD (p.95, p.172)">meilleure Dame sans OD · p.95</span>
          </div>
          {/* Dépense de contacts (p.95) : 1 pt = connaissance · 2 = informateur · 3 = ami · 4 = ami de confiance · 6 = personnalité */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-2">
            <p className="text-xs text-zinc-400">Dépense de contacts (p.95) — dépensés : {contactsDepenses ?? 0}</p>
            <div className="mt-1 flex gap-1.5">
              {[1, 2, 3, 4, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => depenserContacts(n)}
                  disabled={(contactsDepenses ?? 0) + n > derived.contacts}
                  className="min-h-[48px] flex-1 rounded-lg border border-zinc-700 text-xs text-zinc-300 disabled:opacity-40 active:bg-zinc-800"
                >
                  −{n}
                </button>
              ))}
            </div>
            <p className="mt-0.5 text-[10px] text-zinc-600">1 = connaissance · 2 = informateur · 3 = ami · 4 = ami de confiance · 6 = personnalité (MJ)</p>
          </div>
        </div>
      </Accordion>
    </div>
  );
}
