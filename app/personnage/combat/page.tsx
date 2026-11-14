'use client';

/**
 * Page Combat — complète (livrable 5).
 * Sections : valeurs défensives, styles de combat, armes, dégâts subis
 * (résolution moteur), armure déployée/foldée, reset combat.
 * AUCUN calcul local : tout passe par le store → moteur.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import WeaponCard from '../../../components/cards/WeaponCard';
import ModuleCard from '../../../components/cards/ModuleCard';
import { useCharacterStore } from '@/store/characterStore';
import { STYLES_COMBAT } from '@/engine/combat';
import type { DamageResult } from '@/engine/damage';
import type { Weapon } from '@/types/character';

export default function CombatPage() {
  const character = useCharacterStore((s) => s.character);
  const derived = useCharacterStore((s) => s.derived);
  const declarerStyle = useCharacterStore((s) => s.declarerStyle);
  const equiperArme = useCharacterStore((s) => s.equiperArme);
  const activerModule = useCharacterStore((s) => s.activerModule);
  const subirDegats = useCharacterStore((s) => s.subirDegats);
  const basculerArmure = useCharacterStore((s) => s.basculerArmure);
  const resetCombat = useCharacterStore((s) => s.resetCombat);

  // Mode sélectionné par arme (munitions alternatives) — index dans arme.modes
  const [modesArmes, setModesArmes] = useState<Record<string, number>>({});

  // Formulaire de dégâts subis
  const [degats, setDegats] = useState(0);
  const [ignoreCdF, setIgnoreCdF] = useState(false);
  const [ignoreArmure, setIgnoreArmure] = useState(false);
  const [perceArmure, setPerceArmure] = useState(0);
  const [penetrant, setPenetrant] = useState(0);
  const [resultat, setResultat] = useState<DamageResult | null>(null);

  const styleActif = character.conditions.find((c) => c.id === 'style-combat')?.nom.replace('Style : ', '') ?? 'Standard';

  const encaisser = () => {
    const r = subirDegats({
      degats: Math.max(0, degats),
      ignoreCdF,
      ignoreArmure,
      perceArmure: perceArmure > 0 ? perceArmure : undefined,
      penetrant: penetrant > 0 ? penetrant : undefined,
    });
    setResultat(r);
  };

  const modeIndexArme = (arme: Weapon) => modesArmes[arme.id] ?? 0;

  return (
    <div className="space-y-5">
      {/* ─── Valeurs défensives (lecture seule, moteur) ─────────────── */}
      <section>
        <h2 className="font-display mb-2 text-xs uppercase tracking-widest text-zinc-500">Défenses</h2>
        <div className="grid grid-cols-4 gap-1.5 text-center">
          {[
            { label: 'Défense', valeur: derived.defense },
            { label: 'Réaction', valeur: derived.reaction },
            { label: 'Init.', valeur: derived.initiative },
            { label: 'CdF', valeur: derived.cdf },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-zinc-800 bg-zinc-900/70 py-2">
              <p className="text-[9px] uppercase tracking-wider text-zinc-500">{s.label}</p>
              <p className="text-lg font-bold text-white">{s.valeur}</p>
            </div>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-zinc-600">
          Réaction {derived.reaction} = seuil à dépasser au tir · Défense {derived.defense} = au contact (p.86-88)
        </p>
      </section>

      {/* ─── Styles de combat (p.87-89) ─────────────────────────────── */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-display text-xs uppercase tracking-widest text-zinc-500">Style de combat</h2>
          <span className="text-[10px] text-neon-cyan">{styleActif}</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {STYLES_COMBAT.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => declarerStyle(s.id)}
              className={`min-h-[44px] shrink-0 rounded-lg border px-3 text-xs ${
                styleActif === s.nom
                  ? 'border-neon-cyan text-neon-cyan shadow-glow-cyan'
                  : 'border-zinc-700 text-zinc-400'
              }`}
            >
              {s.nom}
            </button>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-zinc-600">
          Déclaré avant l'initiative · changement = 1 action de déplacement (p.87)
        </p>
      </section>

      {/* ─── Armes ──────────────────────────────────────────────────── */}
      <section>
        <h2 className="font-display mb-2 text-xs uppercase tracking-widest text-zinc-500">Armes</h2>
        <div className="space-y-2">
          {character.armes.map((arme) => (
            <WeaponCard
              key={arme.id}
              arme={arme}
              modeActif={modeIndexArme(arme)}
              onModeChange={(i) => setModesArmes((m) => ({ ...m, [arme.id]: i }))}
              onEquiper={(e) => equiperArme(arme.id, e)}
              onDesequiper={() => equiperArme(arme.id, false)}
            />
          ))}
        </div>
      </section>

      {/* ─── Dégâts subis — résolution par le moteur ────────────────── */}
      <section>
        <h2 className="font-display mb-2 text-xs uppercase tracking-widest text-zinc-500">Dégâts subis</h2>
        <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
          <div className="flex items-center gap-2">
            <label htmlFor="degats" className="w-24 text-xs text-zinc-400">Dégâts</label>
            <input
              id="degats"
              type="number"
              min={0}
              value={degats || ''}
              onChange={(e) => setDegats(parseInt(e.target.value, 10) || 0)}
              className="min-h-[44px] w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-center text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex min-h-[44px] items-center gap-2 rounded-lg bg-zinc-950 px-2">
              <input type="checkbox" checked={ignoreCdF} onChange={(e) => setIgnoreCdF(e.target.checked)} className="h-4 w-4 accent-cyan-400" />
              Ignore CdF
            </label>
            <label className="flex min-h-[44px] items-center gap-2 rounded-lg bg-zinc-950 px-2">
              <input type="checkbox" checked={ignoreArmure} onChange={(e) => setIgnoreArmure(e.target.checked)} className="h-4 w-4 accent-cyan-400" />
              Ignore armure
            </label>
            <label className="flex min-h-[44px] items-center gap-2 rounded-lg bg-zinc-950 px-2">
              Perce armure
              <input type="number" min={0} value={perceArmure || ''} onChange={(e) => setPerceArmure(parseInt(e.target.value, 10) || 0)} className="w-14 rounded border border-zinc-700 bg-zinc-950 px-1 text-center text-white" />
            </label>
            <label className="flex min-h-[44px] items-center gap-2 rounded-lg bg-zinc-950 px-2">
              Pénétrant
              <input type="number" min={0} value={penetrant || ''} onChange={(e) => setPenetrant(parseInt(e.target.value, 10) || 0)} className="w-14 rounded border border-zinc-700 bg-zinc-950 px-1 text-center text-white" />
            </label>
          </div>
          <button
            type="button"
            onClick={encaisser}
            className="min-h-[44px] w-full rounded-lg bg-red-900/40 text-sm font-semibold uppercase tracking-wider text-red-300 active:bg-red-900/60"
          >
            Encaisser
          </button>

          {/* Résultat de la résolution */}
          {resultat && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-1 rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-xs">
              {resultat.degatsApresCdF === 0 ? (
                <p className="text-neon-cyan">Champ de force : aucun dégât (règle p.130)</p>
              ) : (
                <ul className="space-y-0.5 text-zinc-300">
                  <li>PA encaissés : <span className="text-white">{resultat.degatsSurPA}</span> → PA restants {resultat.nouvellesJauges.pa}</li>
                  {resultat.psPerdusTranche > 0 && (
                    <li className="text-amber-300">Secousse dans l'armure : −{resultat.psPerdusTranche} PS (tranche de 5, p.130)</li>
                  )}
                  {resultat.degatsSurPS > 0 && (
                    <li className="text-red-300">PS touchés : −{resultat.degatsSurPS} → PS restants {resultat.nouvellesJauges.ps}</li>
                  )}
                  {resultat.armureFoldedAuto && (
                    <li className="font-semibold text-red-300">Armure foldée automatiquement (0 PA → Guardian, p.130)</li>
                  )}
                </ul>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── Méta-armure : fold + modules rapides ───────────────────── */}
      <section>
        <h2 className="font-display mb-2 text-xs uppercase tracking-widest text-zinc-500">Méta-armure</h2>
        <div className="mb-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => basculerArmure(true)}
            disabled={character.armureDeployee}
            className="min-h-[44px] rounded-lg border border-neon-cyan/40 text-xs text-neon-cyan disabled:opacity-40 active:bg-neon-cyan/10"
          >
            Déployer (120 PA · CdF 8)
          </button>
          <button
            type="button"
            onClick={() => basculerArmure(false)}
            disabled={!character.armureDeployee}
            className="min-h-[44px] rounded-lg border border-zinc-700 text-xs text-zinc-400 disabled:opacity-40 active:bg-zinc-800"
          >
            Replier → Guardian (5 PA · CdF 5)
          </button>
        </div>
        <div className="space-y-2">
          {character.modules.map((mod) => (
            <ModuleCard key={mod.id} module={mod} onActiver={(a) => activerModule(mod.id, a)} />
          ))}
        </div>
      </section>

      {/* ─── Reset combat ───────────────────────────────────────────── */}
      <section className="pb-2">
        <button
          type="button"
          onClick={() => resetCombat()}
          className="min-h-[44px] w-full rounded-lg border border-neon-gold/40 text-xs font-semibold uppercase tracking-wider text-neon-gold active:bg-neon-gold/10"
        >
          Reset combat (retour Camelot)
        </button>
        <p className="mt-1 text-center text-[10px] text-zinc-600">
          Jauges au max · modules temporaires coupés · héroïsme conservé (p.90/96/130)
        </p>
      </section>
    </div>
  );
}
