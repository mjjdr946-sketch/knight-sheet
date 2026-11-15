'use client';

/**
 * Page Attributs — matrice 5 aspects × 15 caractéristiques, éditable (+/−),
 * valeurs dérivées affichées avec leur formule (title = formule + page du livre).
 * Les totaux ne changent qu'entre missions (règle p.88/§5) — l'édition ici
 * représente une intermission.
 */
import { useCharacterStore } from '@/store/characterStore';
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
  const derived = useCharacterStore((s) => s.derived);
  const setChoixDerive = useCharacterStore((s) => s.setChoixDerive);

  // Édition de caractéristique : bornée par l'aspect (plafond, p.110) et 1 minimum
  const ajusterTrait = (aspect: AspectId, trait: TraitId, delta: number) => {
    const plafond = character.aspects[aspect]; // l'aspect fixe le plafond (p.110)
    const actuel = character.traits[trait];
    const nouveau = Math.min(plafond, Math.max(0, actuel + delta));
    // L'édition de traits = intermission (totaux figés en partie, p.88/§5)
    useCharacterStore.getState().remplacerPersonnage({
      ...character,
      traits: { ...character.traits, [trait]: nouveau },
    });
  };

  return (
    <div className="space-y-5">
      {/* ─── Matrice aspects/caractéristiques ───────────────────────── */}
      <section className="space-y-2">
        <h2 className="font-display text-xs uppercase tracking-widest text-zinc-500">
          Aspects & caractéristiques
        </h2>
        <p className="text-[10px] text-zinc-600">
          L'aspect fixe le plafond de ses caractéristiques (p.110) · aspect limité à 9 pour les PJ
        </p>
        {ASPECTS.map((aspect) => (
          <div key={aspect.id} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-display text-sm text-neon-gold">{aspect.nom}</span>
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-white">{character.aspects[aspect.id]}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {aspect.traits.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg bg-zinc-950 px-1 py-1">
                  <span className="text-[10px] text-zinc-400">{t.nom}</span>
                  <div className="flex items-center">
                    <button
                      type="button"
                      aria-label={`Retirer un point de ${t.nom}`}
                      onClick={() => ajusterTrait(aspect.id, t.id, -1)}
                      className="h-9 w-8 rounded text-sm text-zinc-400 active:bg-zinc-800"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-base font-bold text-white">{character.traits[t.id]}</span>
                    <button
                      type="button"
                      aria-label={`Ajouter un point à ${t.nom}`}
                      onClick={() => ajusterTrait(aspect.id, t.id, +1)}
                      className="h-9 w-8 rounded text-sm text-zinc-400 active:bg-zinc-800"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ─── Valeurs dérivées : choix de la caractéristique ─────────── */}
      <section>
        <h2 className="font-display mb-2 text-xs uppercase tracking-widest text-zinc-500">Valeurs dérivées</h2>
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
                  <span className="text-[10px] text-zinc-600" title={`${d.formule} (${d.page})`}>
                    {d.formule} · {d.page}
                  </span>
                </div>
                <div className="mt-1 flex gap-1.5 overflow-x-auto pb-0.5">
                  {traitsDisponibles.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setChoixDerive(d.cle, t.id)}
                      className={`min-h-[40px] shrink-0 rounded-lg border px-2 text-[11px] ${
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
            <span className="font-bold text-neon-cyan">{derived.contacts}</span>
            <span className="ml-2 text-[10px] text-zinc-600" title="meilleure carac. Dame, sans OD (p.95, p.172)">meilleure Dame sans OD · p.95</span>
          </div>
        </div>
      </section>
    </div>
  );
}
