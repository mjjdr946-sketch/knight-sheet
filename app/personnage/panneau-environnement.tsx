'use client';

/**
 * PanneauEnvironnement — dégâts environnementaux (prompt v7 §2, règle p.92).
 * Sélecteur de source + paramètres → moteur (dés injectés) → application
 * via subirDegats (ordre CdF → PA → PS, tranches de 5 sur les PA).
 */
import { useState } from 'react';
import Accordion from '../../components/ui/Accordion';
import { useCharacterStore } from '@/store/characterStore';
import {
  apneeSecondes,
  degatsAccident,
  degatsChute,
  degatsFeu,
  degatsNoyade,
  degatsToxique,
  type PaquetDegats,
} from '../../src/engine/environnement';

type Source = 'chute' | 'feu' | 'noyade' | 'toxique' | 'accident';

export default function PanneauEnvironnement() {
  const character = useCharacterStore((s) => s.character);
  const derived = useCharacterStore((s) => s.derived);
  const subirDegats = useCharacterStore((s) => s.subirDegats);

  const [source, setSource] = useState<Source>('chute');
  const [hauteur, setHauteur] = useState(15);
  const [dureeNoyade, setDureeNoyade] = useState(120);
  const [virulence, setVirulence] = useState<'faible' | 'moyenne' | 'forte'>('moyenne');
  const [vitesse, setVitesse] = useState(2);
  const [enMouvement, setEnMouvement] = useState(true);
  const [paquet, setPaquet] = useState<PaquetDegats | null>(null);

  const calculer = () => {
    const rand = () => Math.random();
    let p: PaquetDegats;
    switch (source) {
      case 'chute':
        p = degatsChute(hauteur, character.armureDeployee, rand);
        break;
      case 'feu':
        p = degatsFeu(character.armureDeployee, rand);
        break;
      case 'noyade':
        p = degatsNoyade(dureeNoyade, character.traits.endurance, rand);
        break;
      case 'toxique':
        p = degatsToxique(virulence, rand);
        break;
      case 'accident':
        p = degatsAccident(vitesse, enMouvement, rand);
        break;
    }
    setPaquet(p);
  };

  const encaisser = () => {
    if (!paquet || paquet.total <= 0) return;
    subirDegats({ degats: paquet.total });
  };

  return (
    <Accordion titre="Environnement" sousTitre="chute · feu · noyade · toxique · accident (p.92)" accent="gold">
      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(
            [
              { id: 'chute', nom: 'Chute' },
              { id: 'feu', nom: 'Feu' },
              { id: 'noyade', nom: 'Noyade' },
              { id: 'toxique', nom: 'Toxique' },
              { id: 'accident', nom: 'Accident' },
            ] as const
          ).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => { setSource(s.id); setPaquet(null); }}
              className={`min-h-[48px] shrink-0 rounded-lg border px-2.5 text-xs ${
                source === s.id ? 'border-neon-gold text-neon-gold' : 'border-zinc-700 text-zinc-400'
              }`}
            >
              {s.nom}
            </button>
          ))}
        </div>

        {/* Paramètres par source */}
        {source === 'chute' && (
          <label className="flex min-h-[48px] items-center justify-between gap-2 rounded-lg bg-zinc-950 px-2 text-xs text-zinc-400">
            Hauteur (m)
            <input type="number" min={0} value={hauteur || ''} onChange={(e) => setHauteur(parseInt(e.target.value, 10) || 0)} className="w-16 rounded border border-zinc-700 bg-zinc-950 px-1 text-center text-white" />
          </label>
        )}
        {source === 'noyade' && (
          <label className="flex min-h-[48px] items-center justify-between gap-2 rounded-lg bg-zinc-950 px-2 text-xs text-zinc-400">
            Durée d'immersion (s) · apnée {apneeSecondes(character.traits.endurance)} s
            <input type="number" min={0} value={dureeNoyade || ''} onChange={(e) => setDureeNoyade(parseInt(e.target.value, 10) || 0)} className="w-16 rounded border border-zinc-700 bg-zinc-950 px-1 text-center text-white" />
          </label>
        )}
        {source === 'toxique' && (
          <div className="flex gap-1.5">
            {(['faible', 'moyenne', 'forte'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVirulence(v)}
                className={`min-h-[48px] flex-1 rounded-lg border text-xs ${virulence === v ? 'border-neon-gold text-neon-gold' : 'border-zinc-700 text-zinc-400'}`}
              >
                {v}
              </button>
            ))}
          </div>
        )}
        {source === 'accident' && (
          <>
            <label className="flex min-h-[48px] items-center justify-between gap-2 rounded-lg bg-zinc-950 px-2 text-xs text-zinc-400">
              Vitesse du véhicule (0-5)
              <input type="number" min={0} max={5} value={vitesse || ''} onChange={(e) => setVitesse(parseInt(e.target.value, 10) || 0)} className="w-16 rounded border border-zinc-700 bg-zinc-950 px-1 text-center text-white" />
            </label>
            <label className="flex min-h-[48px] items-center gap-2 rounded-lg bg-zinc-950 px-2 text-xs text-zinc-400">
              <input type="checkbox" checked={enMouvement} onChange={(e) => setEnMouvement(e.target.checked)} className="h-5 w-5 accent-cyan-400" />
              Véhicule en mouvement (dégâts × vitesse)
            </label>
          </>
        )}
        {source === 'feu' && !character.armureDeployee && (
          <p className="text-[11px] text-amber-300">⚠ Agonie par le feu → blessure « brûlé vif » : −1 à TOUTES les caractéristiques (p.92)</p>
        )}

        <button
          type="button"
          onClick={calculer}
          className="min-h-[48px] w-full rounded-lg border border-neon-cyan/40 text-xs text-neon-cyan active:bg-neon-cyan/10"
        >
          Calculer
        </button>

        {paquet && (
          <div className="space-y-1 rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-xs">
            <p className="text-center">
              Total : <span className="text-xl font-bold text-white">{paquet.total}</span>
              <span className="ml-2 text-zinc-500">[{paquet.des.join(', ') || 'aucun dé'}]</span>
            </p>
            {paquet.notes.map((n, i) => (
              <p key={i} className="text-[11px] text-zinc-500">· {n}</p>
            ))}
            {paquet.total > 0 && (
              <button
                type="button"
                onClick={encaisser}
                className="min-h-[48px] w-full rounded-lg bg-red-900/40 text-xs font-semibold text-red-300 active:bg-red-900/60"
              >
                Encaisser {paquet.total} dégâts (CdF {derived.cdf} → PA → PS)
              </button>
            )}
          </div>
        )}
      </div>
    </Accordion>
  );
}
