'use client';

/**
 * Onglet 🎲 Dés (prompt v8 livrable 3) — jets de combo génériques.
 * 2 traits + OD inclus ; difficulté libre ; exploit/échec critique détectés.
 * Toucher = réussites strictement > difficulté (mécanique p.76-78).
 */
import { useState, useCallback } from 'react';
import { useShake, activerGyroscope } from '../use-shake';
import { lancerDes, compterReussites, estExploit, estEchecCritique } from '@/engine/dice';
import { useCharacterStore } from '@/store/characterStore';
import type { TraitId } from '@/types/character';

const TRAITS: TraitId[] = ['deplacement', 'force', 'endurance', 'hargne', 'combat', 'instinct', 'tir', 'savoir', 'technique', 'aura', 'parole', 'sangfroid', 'discretion', 'dexterite', 'perception'];

interface JetResultat {
  des: number[];
  reussites: number;
  auto: number;
  total: number;
  exploit: boolean;
  echecCritique: boolean;
}

export default function DesPage() {
  const character = useCharacterStore((s) => s.character);
  const basculerFavori = useCharacterStore((s) => s.basculerFavori);
  const favoris: Record<string, unknown> = (character.favoris ?? {}) as Record<string, unknown>;

  const [base, setBase] = useState<TraitId>('combat');
  const [combo, setCombo] = useState<TraitId>('force');
  const [difficulte, setDifficulte] = useState(2);
  const [resultat, setResultat] = useState<JetResultat | null>(null);
  const [historique, setHistorique] = useState<string[]>([]);
  // Prompt v10 §2 : OD à ACTIVER pour ce jet (défaut = toutes les OD des 2 traits)
  const [odsDesactives, setOdsDesactives] = useState<Set<string>>(new Set());

  const comboId = `combo:${base}+${combo}`;
  const estFavori = favoris[comboId] === true;

  const lancer = () => {
    const nBase = character.traits[base];
    const nCombo = character.traits[combo];
    const odNiveau = character.overdrives
      .filter((o) => (o.trait === base || o.trait === combo) && !odsDesactives.has(o.trait))
      .reduce((a, o) => a + o.niveau, 0);
    const totalDes = nBase + nCombo; // p.76 : dés = base + combo
    const des = lancerDes(totalDes);
    const reussites = compterReussites(des);
    const auto = odNiveau; // OD : réussites automatiques (p.130)
    const total = reussites + auto;
    const r: JetResultat = {
      des,
      reussites,
      auto,
      total,
      exploit: estExploit(des),
      echecCritique: estEchecCritique(des),
    };
    setResultat(r);
    setHistorique((h) => [`base ${base} ${nBase} + combo ${combo} ${nCombo} + OD ${auto} → ${total} vs ${difficulteFixe()} ${total > difficulte ? '✓ SUCCÈS' : '✗ ÉCHEC'}`, ...h].slice(0, 10));
  };

  const difficulteFixe = () => difficulte;

  // Secouer le téléphone = lancer les dés (prompt v8 livrable 7)
  const [secousseOk, setSecousseOk] = useState(false);
  const lancerStable = useCallback(lancer, [base, combo, character.traits, character.overdrives, difficulte]);
  useShake(lancerStable, secousseOk);

  return (
    <main className="mx-auto max-w-md space-y-4 px-3 pb-24 pt-4">
      <h1 className="font-display text-xl text-neon-cyan">Jets de dés</h1>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-zinc-500">Base</label>
          <select value={base} onChange={(e) => setBase(e.target.value as TraitId)} className="min-h-[48px] w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm text-white">
            {TRAITS.map((t) => <option key={t} value={t}>{t} ({character.traits[t]})</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-zinc-500">Combo</label>
          <select value={combo} onChange={(e) => setCombo(e.target.value as TraitId)} className="min-h-[48px] w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm text-white">
            {TRAITS.map((t) => <option key={t} value={t}>{t} ({character.traits[t]})</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs uppercase tracking-widest text-zinc-500">Difficulté (réussites à dépasser)</label>
        <input type="number" min={0} max={12} value={difficulte} onChange={(e) => setDifficulte(Number(e.target.value) || 0)} className="min-h-[48px] w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm text-white" />
      </div>

      {(character.overdrives.filter((o) => o.trait === base || o.trait === combo).length > 0) && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2">
          <p className="mb-1 text-[11px] uppercase tracking-widest text-zinc-600">Overdrives actives sur ce jet (p.130)</p>
          <div className="flex flex-wrap gap-2">
            {['OD ' + base, 'OD ' + combo].filter((v, i, arr) => arr.indexOf(v) === i).map((label) => {
              const trait = label.slice(3) as typeof base;
              return (
                <label key={label} className="flex items-center gap-1.5 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={!odsDesactives.has(trait)}
                    onChange={(e) => setOdsDesactives((s) => {
                      const next = new Set(s);
                      if (e.target.checked) next.delete(trait); else next.add(trait);
                      return next;
                    })}
                  />
                  {label} ({character.overdrives.filter((o) => o.trait === trait).reduce((a, o) => a + o.niveau, 0)} réussites)
                </label>
              );
            })}
          </div>
        </div>
      )}

      <button type="button" onClick={lancer} className="min-h-[48px] w-full rounded-lg bg-neon-cyan/20 text-base font-bold text-neon-cyan shadow-glow-cyan active:bg-neon-cyan/30">
        LANCER {character.traits[base] + character.traits[combo]} dés
      </button>
      <div className="flex gap-2">
        <button type="button" onClick={() => basculerFavori(comboId)} className="min-h-[48px] flex-1 rounded-lg border border-zinc-700 text-xs text-zinc-400 active:bg-zinc-800">
          {estFavori ? '★ Favori' : '☆ Ajouter aux favoris'}
        </button>
        <button
          type="button"
          onClick={async () => { const ok = await activerGyroscope(); setSecousseOk(ok); alert(ok ? 'Secousse activée — secouez pour lancer 🎲' : 'Gyroscope indisponible sur cet appareil'); }}
          className="min-h-[48px] flex-1 rounded-lg border border-zinc-700 text-xs text-zinc-400 active:bg-zinc-800"
        >
          {secousseOk ? '📳 Secousse activée' : '📳 Secouer pour lancer'}
        </button>
      </div>

      {resultat && (
        <div className="rounded-xl border border-neon-cyan/40 bg-zinc-900/80 p-3 text-center">
          <p className="text-2xl font-bold text-white">
            {resultat.total} {resultat.total > difficulte ? '✓' : '✗'}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {resultat.reussites} paires + {resultat.auto} OD · dés : {resultat.des.join(', ')}
          </p>
          {resultat.exploit && <p className="mt-1 text-sm font-bold text-neon-gold">EXPLOIT — relance (p.77)</p>}
          {resultat.echecCritique && <p className="mt-1 text-sm font-bold text-red-400">ÉCHEC CRITIQUE (p.77)</p>}
        </div>
      )}

      {historique.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2">
          <p className="mb-1 text-[11px] uppercase tracking-widest text-zinc-600">Historique</p>
          {historique.map((h, i) => <p key={i} className="text-[11px] text-zinc-500">{h}</p>)}
        </div>
      )}
    </main>
  );
}
