'use client';

/**
 * PanneauAdversaire — création rapide d'un adversaire (prompt v7 §1) :
 * type (hostile/salopard/patron/colosse/bande), défense/réaction, PA/PS/CdF,
 * points faibles, mode MJ (valeurs masquées — le MJ ne révèle pas
 * défense/réaction, p.86). Réutilisable entre les modes attaque/encaisse.
 * Zéro calcul local : le seuil effectif (points faibles ÷2) vient du moteur.
 */
import { useState } from 'react';
import Accordion from '../../components/ui/Accordion';
import { useCharacterStore } from '@/store/characterStore';
import { debordementCumule, type Adversaire, type TypePNJ } from '../../src/engine/pnj';
import type { TraitId } from '@/types/character';

const TYPES: { id: TypePNJ; nom: string }[] = [
  { id: 'hostile', nom: 'Hostile' },
  { id: 'salopard', nom: 'Salopard' },
  { id: 'patron', nom: 'Patron' },
  { id: 'colosse', nom: 'Colosse' },
  { id: 'bande', nom: 'Bande' },
];

const TRAITS: { id: TraitId; nom: string }[] = [
  { id: 'combat', nom: 'Combat' }, { id: 'tir', nom: 'Tir' }, { id: 'force', nom: 'Force' },
  { id: 'deplacement', nom: 'Dépl.' }, { id: 'endurance', nom: 'End.' },
  { id: 'hargne', nom: 'Hargne' }, { id: 'instinct', nom: 'Inst.' },
  { id: 'savoir', nom: 'Savoir' }, { id: 'technique', nom: 'Tech.' },
  { id: 'aura', nom: 'Aura' }, { id: 'parole', nom: 'Parole' }, { id: 'sangfroid', nom: 'S-F' },
  { id: 'discretion', nom: 'Discr.' }, { id: 'dexterite', nom: 'Dext.' }, { id: 'perception', nom: 'Perc.' },
];

export default function PanneauAdversaire() {
  const adversaire = useCharacterStore((s) => s.adversaire);
  const majAdversaire = useCharacterStore((s) => s.majAdversaire);
  const frapperAdversaire = useCharacterStore((s) => s.frapperAdversaire);
  const [tour, setTour] = useState(1);

  const maj = (patch: Partial<Adversaire>) => {
    majAdversaire({
      id: adversaire?.id ?? `adv-${Date.now()}`,
      nom: adversaire?.nom ?? 'Adversaire',
      type: adversaire?.type ?? 'salopard',
      defense: adversaire?.defense ?? 0,
      reaction: adversaire?.reaction ?? 0,
      pa: adversaire?.pa ?? 0,
      ps: adversaire?.ps,
      cdf: adversaire?.cdf,
      pointsFaibles: adversaire?.pointsFaibles ?? [],
      cohesion: adversaire?.cohesion,
      debordement: adversaire?.debordement,
      modeMj: adversaire?.modeMj,
      ...patch,
    });
  };

  const estBande = adversaire?.type === 'bande';

  return (
    <Accordion titre="Adversaire" compteur={adversaire ? adversaire.nom : 'aucun'} accent="gold">
      {!adversaire ? (
        <button
          type="button"
          onClick={() => maj({})}
          className="min-h-[48px] w-full rounded-lg border border-zinc-700 text-xs text-zinc-300 active:bg-zinc-800"
        >
          Créer un adversaire
        </button>
      ) : (
        <div className="space-y-2">
          {/* Type + nom + mode MJ */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => maj({ type: t.id })}
                className={`min-h-[48px] shrink-0 rounded-lg border px-2.5 text-xs ${
                  adversaire.type === t.id ? 'border-neon-gold text-neon-gold' : 'border-zinc-700 text-zinc-400'
                }`}
              >
                {t.nom}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={adversaire.nom}
              onChange={(e) => maj({ nom: e.target.value })}
              className="min-h-[48px] flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-xs text-white outline-none"
            />
            <button
              type="button"
              onClick={() => maj({ modeMj: !adversaire.modeMj })}
              className={`min-h-[48px] rounded-lg border px-2.5 text-xs ${
                adversaire.modeMj ? 'border-neon-gold text-neon-gold' : 'border-zinc-700 text-zinc-400'
              }`}
            >
              {adversaire.modeMj ? 'MJ (valeurs cachées)' : 'Valeurs visibles'}
            </button>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex min-h-[48px] items-center justify-between gap-1 rounded-lg bg-zinc-950 px-2">
              Défense
              <input type="number" min={0} value={adversaire.defense || ''} onChange={(e) => maj({ defense: parseInt(e.target.value, 10) || 0 })} className="w-14 rounded border border-zinc-700 bg-zinc-950 px-1 text-center text-white" />
            </label>
            <label className="flex min-h-[48px] items-center justify-between gap-1 rounded-lg bg-zinc-950 px-2">
              Réaction
              <input type="number" min={0} value={adversaire.reaction || ''} onChange={(e) => maj({ reaction: parseInt(e.target.value, 10) || 0 })} className="w-14 rounded border border-zinc-700 bg-zinc-950 px-1 text-center text-white" />
            </label>
            <label className="flex min-h-[48px] items-center justify-between gap-1 rounded-lg bg-zinc-950 px-2">
              PA
              <input type="number" min={0} value={adversaire.pa || ''} onChange={(e) => maj({ pa: parseInt(e.target.value, 10) || 0 })} className="w-14 rounded border border-zinc-700 bg-zinc-950 px-1 text-center text-white" />
            </label>
            {!estBande && (
              <label className="flex min-h-[48px] items-center justify-between gap-1 rounded-lg bg-zinc-950 px-2">
                PS
                <input type="number" min={0} value={adversaire.ps ?? ''} onChange={(e) => maj({ ps: parseInt(e.target.value, 10) || undefined })} className="w-14 rounded border border-zinc-700 bg-zinc-950 px-1 text-center text-white" />
              </label>
            )}
            {!estBande && (
              <label className="flex min-h-[48px] items-center justify-between gap-1 rounded-lg bg-zinc-950 px-2">
                CdF/Bouclier
                <input type="number" min={0} value={adversaire.cdf ?? ''} onChange={(e) => maj({ cdf: parseInt(e.target.value, 10) || undefined })} className="w-14 rounded border border-zinc-700 bg-zinc-950 px-1 text-center text-white" />
              </label>
            )}
            {estBande && (
              <>
                <label className="flex min-h-[48px] items-center justify-between gap-1 rounded-lg bg-zinc-950 px-2">
                  Cohésion
                  <input type="number" min={0} value={adversaire.cohesion ?? ''} onChange={(e) => maj({ cohesion: parseInt(e.target.value, 10) || 0 })} className="w-14 rounded border border-zinc-700 bg-zinc-950 px-1 text-center text-white" />
                </label>
                <label className="flex min-h-[48px] items-center justify-between gap-1 rounded-lg bg-zinc-950 px-2">
                  Débordement
                  <input type="number" min={0} value={adversaire.debordement ?? ''} onChange={(e) => maj({ debordement: parseInt(e.target.value, 10) || 0 })} className="w-14 rounded border border-zinc-700 bg-zinc-950 px-1 text-center text-white" />
                </label>
              </>
            )}
          </div>

          {/* Points faibles */}
          <div>
            <p className="mb-1 text-[11px] text-zinc-500">Points faibles (défense/réaction ÷2 — p.103)</p>
            <div className="flex flex-wrap gap-1">
              {TRAITS.map((t) => {
                const actif = adversaire.pointsFaibles.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => maj({
                      pointsFaibles: actif
                        ? adversaire.pointsFaibles.filter((x) => x !== t.id)
                        : [...adversaire.pointsFaibles, t.id],
                    })}
                    className={`min-h-[40px] rounded border px-2 text-[11px] ${
                      actif ? 'border-neon-cyan text-neon-cyan' : 'border-zinc-700 text-zinc-500'
                    }`}
                  >
                    {t.nom}
                  </button>
                );
              })}
            </div>
          </div>

          {/* État courant */}
          <div className="rounded-lg bg-zinc-950 px-2.5 py-2 text-xs">
            {estBande ? (
              <p className="text-zinc-300">
                Cohésion : <span className="text-white">{adversaire.cohesion ?? 0}</span>
                {adversaire.modeMj && ' (MJ : valeur cachée au joueur)'}
                {' · '}Débordement tour {tour} : <span className="text-neon-cyan">{debordementCumule(adversaire, tour)}</span>
              </p>
            ) : (
              <p className="text-zinc-300">
                PA <span className="text-white">{adversaire.pa}</span>
                {adversaire.ps !== undefined && <> · PS <span className="text-white">{adversaire.ps}</span></>}
                {adversaire.type === 'colosse' && ' · colosse : tranches de 10 (p.103)'}
              </p>
            )}
          </div>

          {/* Débordement de bande → encaissement du Paladin */}
          {estBande && (
            <button
              type="button"
              onClick={() => {
                const deg = debordementCumule(adversaire, tour);
                alert(`Débordement de la bande (tour ${tour}) : ${deg} dégâts automatiques à encaisser via le mode « Le Paladin encaisse ».`);
                setTour((t) => t + 1);
              }}
              className="min-h-[48px] w-full rounded-lg bg-red-900/40 text-xs font-semibold text-red-300 active:bg-red-900/60"
            >
              Débordement (tour {tour} : {debordementCumule(adversaire, tour)} dégâts cumulés)
            </button>
          )}

          <button
            type="button"
            onClick={() => { majAdversaire(null); setTour(1); }}
            className="min-h-[48px] w-full rounded-lg border border-zinc-700 text-xs text-zinc-500 active:bg-zinc-800"
          >
            Retirer l'adversaire
          </button>
        </div>
      )}
    </Accordion>
  );
}
