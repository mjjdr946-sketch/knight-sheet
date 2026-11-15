'use client';

/**
 * Page Combat — simulateur de duel (prompt v5, onglet ⚔).
 * Mode « attaque » : jet p.76-89 (dés = base + combo, paire = réussite,
 * OD = réussites auto, styles) contre une opposition saisie (valeur MJ).
 * Mode « encaisser » : résolution de dégâts subis (reprise it. 1-2).
 * AUCUN calcul dans le composant : préparation et jets via le moteur.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import Accordion from '../../../components/ui/Accordion';
import PanneauAdversaire from '../panneau-adversaire';
import PanneauEnvironnement from '../panneau-environnement';
import { useCharacterStore } from '@/store/characterStore';
import { STYLES_COMBAT } from '../../../src/engine/combat';
import { seuilEffectif } from '../../../src/engine/pnj';
import { computeAttack, desDegatsTouche, type PreparationAttaque } from '../../../src/engine/attaque';
import { jetComplet, jetDegats, relanceExploit, touche, type JetComplet } from '../../../src/engine/dice';
import { formaterProfil } from '../../../src/utils/format';
import type { DamageResult } from '../../../src/engine/damage';
import type { TraitId, Weapon } from '@/types/character';

export default function CombatPage() {
  const character = useCharacterStore((s) => s.character);
  const derived = useCharacterStore((s) => s.derived);
  const declarerStyle = useCharacterStore((s) => s.declarerStyle);
  const subirDegats = useCharacterStore((s) => s.subirDegats);
  const basculerArmure = useCharacterStore((s) => s.basculerArmure);
  const resetCombat = useCharacterStore((s) => s.resetCombat);
  const tirerBlessureAgonie = useCharacterStore((s) => s.tirerBlessureAgonie);
  const depenserPEUsage = useCharacterStore((s) => s.depenserPEUsage);
  // Session de combat : opposition mémorisée + historique (persistés)
  const opposition = useCharacterStore((s) => s.combatSession.opposition);
  const typeOpposition = useCharacterStore((s) => s.combatSession.typeOpposition);
  const historique = useCharacterStore((s) => s.combatSession.historique);
  const memoriserOpposition = useCharacterStore((s) => s.memoriserOpposition);
  const journaliserJet = useCharacterStore((s) => s.journaliserJet);
  const basculerFavori = useCharacterStore((s) => s.basculerFavori);
  const favoris = character.favoris ?? [];
  const favorisArmes = favoris.filter((f) => f.startsWith('arme:')).map((f) => f.slice(5));
  const favorisCombos = favoris.filter((f) => f.startsWith('combo:')).map((f) => f.slice(6));

  // Jet libre (prompt v6 §1) : pas d'opposition — le joueur compare lui-même
  const [jetLibre, setJetLibre] = useState(false);

  const styleActif = character.conditions.find((c) => c.id === 'style-combat')?.nom.replace('Style : ', '') ?? 'Standard';
  const styleId = STYLES_COMBAT.find((s) => s.nom === styleActif)?.id ?? 'standard';

  // ─── Mode 1 : attaque ───────────────────────────────────────────────
  const armesEquipees = character.armes.filter((a) => a.equipee);
  const [armeId, setArmeId] = useState<string | null>(null);
  const arme: Weapon | undefined = armesEquipees.find((a) => a.id === armeId) ?? armesEquipees[0];
  const [sacrificeDes, setSacrificeDes] = useState(0);
  // Combo surchargé via les favoris (« combo:base+combo »)
  const [comboOverride, setComboOverride] = useState<TraitId | null>(null);
  const [jet, setJet] = useState<JetComplet | null>(null);
  const [prep, setPrep] = useState<PreparationAttaque | null>(null);
  const [degatsTouche, setDegatsTouche] = useState<number | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // RÈGLES: à compléter — l'opposition est la défense/réaction de L'ADVERSAIRE
  // (valeur donnée par le MJ) ; les valeurs du Paladin ci-dessous ne servent
  // que de repère visuel jusqu'au panneau adversaire.
  const seuil = typeOpposition === 'contact' ? derived.defense : derived.reaction;

  // ─── Seuil effectif : adversaire (points faibles ÷2) ou saisie manuelle ──
  const adversaire = useCharacterStore((s) => s.adversaire);
  const frapperAdversaire = useCharacterStore((s) => s.frapperAdversaire);
  const [violence, setViolence] = useState(0);
  const seuilAdversaire = adversaire ? seuilEffectif(adversaire, prep?.base ?? (arme?.type === 'distance' ? 'tir' : 'combat'), arme?.type === 'distance') : null;
  const seuilUtilise = jetLibre ? null : (seuilAdversaire ?? opposition);
  const modeMj = adversaire?.modeMj === true;

  const lancer = () => {
    if (!arme) return;
    const p = computeAttack(character, arme, styleId, { sacrificeDes, comboTrait: comboOverride ?? undefined });
    setPrep(p);
    // Watchtower active : chaque tir coûte 1 PE (FAQ p.455)
    const watchtower = character.metaArmor.capacites.find((c) => c.id === 'watchtower');
    if (watchtower?.active && arme.type === 'distance') depenserPEUsage(1);
    const j = jetComplet(p.nbDes, p.reussitesAuto);
    setJet(j);
    setDegatsTouche(null);
    if (!jetLibre) appliquerDegats(j, p, arme);
    journaliserJet({
      arme: arme.nom,
      des: j.des,
      total: j.total,
      seuil: jetLibre ? 0 : (seuilUtilise ?? 0),
      touche: !jetLibre && touche(j.total, seuilUtilise ?? 0),
      exploit: j.exploit,
      echecCritique: j.echecCritique,
      degats: jetLibre ? undefined : degatsToucheRef(j, p, arme),
      libre: jetLibre,
    });
  };

  /** Calcule les dégâts sans muter l'état (pour le journal) */
  const degatsToucheRef = (j: JetComplet, p: PreparationAttaque, a: Weapon): number | undefined => {
    if (!touche(j.total, seuilUtilise ?? 0)) return undefined;
    const prof = desDegatsTouche(a, p);
    const fixe = prof.fixe + (a.type === 'contact' ? character.traits.force : 0);
    return jetDegats(prof.nombreDes, fixe).total;
  };

  const appliquerDegats = (j: JetComplet, p: PreparationAttaque, a: Weapon) => {
    if (touche(j.total, seuilUtilise ?? 0)) {
      const prof = desDegatsTouche(a, p);
      // annexe : la Force s'ajoute aux dégâts de contact (l'OD via computeAttack)
      const fixe = prof.fixe + (a.type === 'contact' ? character.traits.force : 0);
      const d = jetDegats(prof.nombreDes, fixe);
      setDegatsTouche(d.total);
      // application à l'adversaire si défini (violence optionnelle pour les bandes)
      frapperAdversaire(d.total, violence > 0 ? { violence } : undefined);
    }
  };

  const relancer = () => {
    if (!jet || !prep || !arme) return;
    const j = relanceExploit(jet.des);
    setJet(j);
    setDegatsTouche(null);
    appliquerDegats(j, prep, arme);
    journaliserJet({
      arme: `${arme.nom} (relance exploit)`,
      des: j.des,
      total: j.total,
      seuil: jetLibre ? 0 : (seuilUtilise ?? 0),
      touche: !jetLibre && touche(j.total, seuilUtilise ?? 0),
      exploit: j.exploit,
      echecCritique: j.echecCritique,
      libre: jetLibre,
    });
  };

  // ─── Mode 2 : encaissement ──────────────────────────────────────────
  const [degats, setDegats] = useState(0);
  const [ignoreCdF, setIgnoreCdF] = useState(false);
  const [ignoreArmure, setIgnoreArmure] = useState(false);
  const [perceArmure, setPerceArmure] = useState(0);
  const [penetrant, setPenetrant] = useState(0);
  const [resultat, setResultat] = useState<DamageResult | null>(null);

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

  // Agonie : tirage de blessure aléatoire 2D6 (p.90-91)
  const tirerBlessure = () => {
    const d1 = 1 + Math.floor(Math.random() * 6);
    const d2 = 1 + Math.floor(Math.random() * 6);
    const r = tirerBlessureAgonie(d1, d2);
    alert(r.mort ? `MORT (${r.nom})` : `Blessure : ${r.nom} — ${r.description}`);
  };

  return (
    <div className="space-y-5">
      {/* ─── Adversaire (prompt v7 §1) ───────────────────────────────── */}
      <PanneauAdversaire />

      {/* ─── Environnement (prompt v7 §2, p.92) ──────────────────────── */}
      <PanneauEnvironnement />

      {/* ─── Valeurs défensives (lecture seule, moteur) ─────────────── */}
      <section>
        <div className="grid grid-cols-4 gap-1.5 text-center">
          {[
            { label: 'Défense', valeur: derived.defense },
            { label: 'Réaction', valeur: derived.reaction },
            { label: 'Init.', valeur: derived.initiative },
            { label: 'CdF', valeur: derived.cdf },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-zinc-800 bg-zinc-900/70 py-2">
              <p className="text-xs uppercase tracking-wider text-zinc-500">{s.label}</p>
              <p className="text-2xl font-bold text-white">{s.valeur}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Mode 1 : LE PALADIN ATTAQUE ────────────────────────────── */}
      <section className="rounded-xl border border-neon-cyan/30 bg-zinc-900/70 p-3">
        <h2 className="font-display mb-2 text-xs uppercase tracking-widest text-neon-cyan">⚔ Le Paladin attaque</h2>

        {/* Arme équipée */}
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
          {armesEquipees.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => { setArmeId(a.id); setJet(null); setDegatsTouche(null); }}
              className={`min-h-[48px] shrink-0 rounded-lg border px-3 text-xs ${
                arme?.id === a.id ? 'border-neon-cyan text-neon-cyan shadow-glow-cyan' : 'border-zinc-700 text-zinc-400'
              }`}
            >
              {favorisArmes.includes(a.id) && <span className="mr-1">★</span>}
              {a.nom}
            </button>
          ))}
          {armesEquipees.length === 0 && (
            <p className="text-xs text-zinc-500">Aucune arme équipée — onglet Matériel.</p>
          )}
        </div>

        {/* Favoris (replié par défaut — prompt v6 §3) */}
        {(favorisArmes.length > 0 || favorisCombos.length > 0) && (
          <details className="mb-2 rounded-lg border border-neon-gold/30 bg-zinc-950 p-2">
            <summary className="min-h-[48px] cursor-pointer py-3 text-xs uppercase tracking-widest text-neon-gold">
              ★ Favoris
            </summary>
            <div className="mt-1 space-y-1.5">
              {favorisArmes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {favorisArmes.map((id) => {
                    const a = character.armes.find((w) => w.id === id);
                    return a ? (
                      <button
                        key={id}
                        type="button"
                        onClick={() => { setArmeId(id); setJet(null); }}
                        className="min-h-[48px] rounded-lg border border-neon-gold/40 px-2.5 text-xs text-neon-gold"
                      >
                        ★ {a.nom}
                      </button>
                    ) : null;
                  })}
                </div>
              )}
              {favorisCombos.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {favorisCombos.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setComboOverride(c as TraitId)}
                      className="min-h-[48px] rounded-lg border border-zinc-600 px-2.5 text-xs text-zinc-300"
                    >
                      ★ combo {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </details>
        )}

        {/* Jet libre (prompt v6 §1) : pas d'opposition — le joueur compare lui-même */}
        <label className="mb-2 flex min-h-[48px] items-center gap-2 rounded-lg bg-zinc-950 px-2 text-xs text-zinc-300">
          <input type="checkbox" checked={jetLibre} onChange={(e) => setJetLibre(e.target.checked)} className="h-5 w-5 accent-cyan-400" />
          Jet libre (sans opposition — comparaison manuelle au MJ)
        </label>

        {/* Opposition + type (masqués si adversaire défini — son seuil prime) */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs text-zinc-400">
            {adversaire
              ? <>Cible : <span className="text-neon-gold">{adversaire.nom}</span>{modeMj && ' (MJ)'}</>
              : <>Style : <span className="text-neon-cyan">{styleActif}</span></>}
          </span>
          {!jetLibre && !adversaire && (
            <button
              type="button"
              onClick={() => memoriserOpposition(opposition, typeOpposition === 'contact' ? 'tir' : 'contact')}
              className="min-h-[48px] rounded-lg border border-zinc-700 px-2.5 text-xs text-zinc-300 active:bg-zinc-800"
            >
              {typeOpposition === 'contact' ? 'vs Défense' : 'vs Réaction'}
            </button>
          )}
        </div>
        {!jetLibre && !adversaire && (
        <div className="mb-2 flex items-center gap-2">
          <label htmlFor="opposition" className="w-32 text-xs text-zinc-400">Opposition (MJ)</label>
          <input
            id="opposition"
            type="number"
            min={0}
            value={opposition || ''}
            onChange={(e) => memoriserOpposition(parseInt(e.target.value, 10) || 0, typeOpposition)}
            className="min-h-[48px] w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-center text-white"
          />
          {styleId === 'puissant' && (
            <label className="ml-auto flex items-center gap-1.5 text-xs text-zinc-400">
              Sacrifier
              <input
                type="number" min={0} max={6} value={sacrificeDes || ''}
                onChange={(e) => setSacrificeDes(parseInt(e.target.value, 10) || 0)}
                className="w-14 rounded border border-zinc-700 bg-zinc-950 px-1 text-center text-white"
              />
              dés
            </label>
          )}
        </div>
        )}

        {/* Préparation affichée avant jet */}
        {arme && (
          <p className="mb-2 text-xs text-zinc-400">
            {computeAttack(character, arme, styleId, { sacrificeDes, comboTrait: comboOverride ?? undefined }).nbDes} dés +{' '}
            {computeAttack(character, arme, styleId, { sacrificeDes, comboTrait: comboOverride ?? undefined }).reussitesAuto} auto
            <span className="ml-2 text-zinc-600">
              {arme.type === 'contact' ? 'Combat + Force' : 'Tir'}{comboOverride ? ` + combo ${comboOverride}` : ''} · p.76-78
              {!jetLibre && adversaire?.vitesse !== undefined
                ? ` · véhicule en mouvement : difficulté ${3 * adversaire.vitesse} (p.104)`
                : !jetLibre && ` · repère vs ${seuil}`}
            </span>
          </p>
        )}

        <button
          type="button"
          onClick={lancer}
          disabled={!arme || (!jetLibre && !adversaire && opposition <= 0)}
          className="min-h-[56px] w-full rounded-lg bg-neon-cyan/20 text-base font-bold uppercase tracking-widest text-neon-cyan shadow-glow-cyan disabled:opacity-40 active:bg-neon-cyan/30"
        >
          Lancer les dés
        </button>

        {/* Résultat en grand */}
        {jet && prep && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="mt-3 space-y-2">
            <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-center">
              <p className="text-xs text-zinc-500">{jet.des.length} dés · {jet.reussitesAuto} auto</p>
              <p className="my-1 text-4xl font-bold text-white">
                {modeMj ? '???' : jet.total}
                {!jetLibre && !modeMj && <span className="text-xl text-zinc-500"> vs {seuilUtilise}</span>}
              </p>
              {jetLibre ? (
                <p className="text-sm text-zinc-400">
                  {jet.reussites} réussites (dés pairs) — à comparer à la valeur du MJ
                </p>
              ) : modeMj ? (
                // Mode MJ : seul TOUCHE/RATE est affiché (le MJ ne révèle pas
                // défense/réaction — règle p.86)
                touche(jet.total, seuilUtilise ?? 0) ? (
                  <p className="text-2xl font-bold uppercase tracking-widest text-neon-cyan">Touche !</p>
                ) : (
                  <p className="text-2xl font-bold uppercase tracking-widest text-zinc-500">Rate</p>
                )
              ) : touche(jet.total, seuilUtilise ?? 0) ? (
                <p className="text-2xl font-bold uppercase tracking-widest text-neon-cyan">Touche !</p>
              ) : (
                <p className="text-2xl font-bold uppercase tracking-widest text-zinc-500">Rate</p>
              )}
              {jet.exploit && (
                <p className="mt-1 text-xs font-semibold uppercase text-neon-gold">Exploit — tous les dés sont pairs (p.77)</p>
              )}
              {jet.echecCritique && (
                <p className="mt-1 text-xs font-semibold uppercase text-red-400">Échec critique — tous impairs (p.77)</p>
              )}
            </div>

            {jet.exploit && (
              <button
                type="button"
                onClick={relancer}
                className="min-h-[48px] w-full rounded-lg bg-neon-gold/15 text-sm font-semibold text-neon-gold active:bg-neon-gold/25"
              >
                Relancer (exploit — p.77)
              </button>
            )}

            {degatsTouche !== null && (
              <div className="rounded-lg border border-neon-cyan/40 bg-zinc-950 p-2.5 text-center">
                <p className="text-xs text-zinc-500">Dégâts infligés (à reporter au MJ)</p>
                <p className="text-3xl font-bold text-neon-cyan">{degatsTouche}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {arme?.degats.nombre}D6+bonus{prep.desDegatsPile > 0 ? ` +${prep.desDegatsPile} (pilonnage)` : ''}
                  {prep.desSacrifies > 0 ? ` +${prep.desSacrifies} (puissant)` : ''}
                  {arme!.type === 'contact' ? ` +Force ${character.traits.force}` : ''} · violence {formaterProfil(arme!.violence)} (p.89)
                </p>
              </div>
            )}

            {/* Détail du jet — repliable par défaut (prompt v5) */}
            <button
              type="button"
              onClick={() => setDetailVisible((v) => !v)}
              aria-expanded={detailVisible}
              className="min-h-[48px] w-full rounded-lg border border-zinc-800 text-xs text-zinc-400 active:bg-zinc-800"
            >
              {detailVisible ? '▾ Masquer le détail du jet' : '▸ Détail du jet'}
            </button>
            {detailVisible && (
              <div className="space-y-1 rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-xs">
                <div className="flex flex-wrap gap-1.5">
                  {jet.des.map((d, i) => (
                    <span key={i} className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-bold ${d % 2 === 0 ? 'border-neon-cyan text-neon-cyan' : 'border-zinc-700 text-zinc-400'}`}>
                      {d}
                    </span>
                  ))}
                </div>
                {prep.detail.map((ligne, i) => (
                  <p key={i} className="text-zinc-500">· {ligne}</p>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </section>

      {/* ─── Style de combat (p.87-89) ─────────────────────────────── */}
      <section>
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="font-display text-xs uppercase tracking-widest text-zinc-500">Style de combat</h2>
          <span className="text-xs text-neon-cyan">{styleActif}</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {STYLES_COMBAT.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => declarerStyle(s.id)}
              className={`min-h-[48px] shrink-0 rounded-lg border px-3 text-xs ${
                styleActif === s.nom ? 'border-neon-cyan text-neon-cyan shadow-glow-cyan' : 'border-zinc-700 text-zinc-400'
              }`}
            >
              {favoris.includes(`style:${s.id}`) && <span className="mr-1">★</span>}
              {s.nom}
            </button>
          ))}
          <button
            type="button"
            aria-label="Basculer le favori du style actif"
            onClick={() => basculerFavori(`style:${styleId}`)}
            className={`min-h-[48px] shrink-0 rounded-lg border px-3 text-sm ${
              favoris.includes(`style:${styleId}`) ? 'border-neon-gold text-neon-gold' : 'border-zinc-700 text-zinc-500'
            }`}
          >
            ★
          </button>
        </div>
      </section>

      {/* ─── Mode 2 : LE PALADIN ENCAISSE ───────────────────────────── */}
      <section className="rounded-xl border border-red-900/40 bg-zinc-900/70 p-3">
        <h2 className="font-display mb-2 text-xs uppercase tracking-widest text-red-300">🛡 Le Paladin encaisse</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label htmlFor="degats" className="w-24 text-xs text-zinc-400">Dégâts</label>
            <input
              id="degats"
              type="number"
              min={0}
              value={degats || ''}
              onChange={(e) => setDegats(parseInt(e.target.value, 10) || 0)}
              className="min-h-[48px] w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-center text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex min-h-[48px] items-center gap-2 rounded-lg bg-zinc-950 px-2">
              <input type="checkbox" checked={ignoreCdF} onChange={(e) => setIgnoreCdF(e.target.checked)} className="h-5 w-5 accent-cyan-400" />
              Ignore CdF
            </label>
            <label className="flex min-h-[48px] items-center gap-2 rounded-lg bg-zinc-950 px-2">
              <input type="checkbox" checked={ignoreArmure} onChange={(e) => setIgnoreArmure(e.target.checked)} className="h-5 w-5 accent-cyan-400" />
              Ignore armure
            </label>
            <label className="flex min-h-[48px] items-center gap-2 rounded-lg bg-zinc-950 px-2">
              Perce armure
              <input type="number" min={0} value={perceArmure || ''} onChange={(e) => setPerceArmure(parseInt(e.target.value, 10) || 0)} className="w-16 rounded border border-zinc-700 bg-zinc-950 px-1 text-center text-white" />
            </label>
            <label className="flex min-h-[48px] items-center gap-2 rounded-lg bg-zinc-950 px-2">
              Pénétrant
              <input type="number" min={0} value={penetrant || ''} onChange={(e) => setPenetrant(parseInt(e.target.value, 10) || 0)} className="w-16 rounded border border-zinc-700 bg-zinc-950 px-1 text-center text-white" />
            </label>
          </div>
          <button
            type="button"
            onClick={encaisser}
            className="min-h-[48px] w-full rounded-lg bg-red-900/40 text-sm font-semibold uppercase tracking-wider text-red-300 active:bg-red-900/60"
          >
            Encaisser
          </button>

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

          {/* À 0 PS : agonie — accès au tirage de blessure (p.90-91) */}
          {derived.etatAgonie && (
            <button
              type="button"
              onClick={tirerBlessure}
              className="min-h-[48px] w-full rounded-lg bg-red-900/60 text-sm font-bold uppercase tracking-wider text-white active:bg-red-900"
            >
              Tirer une blessure aléatoire (2D6 — p.91)
            </button>
          )}
        </div>
      </section>

      {/* ─── Historique des jets de la phase (replié) ───────────────── */}
      <Accordion titre="Historique des jets" compteur={historique.length} accent="cyan">
        {historique.length === 0 ? (
          <p className="text-xs text-zinc-600">Aucun jet cette phase.</p>
        ) : (
          <ul className="space-y-1">
            {historique.map((j) => (
              <li key={j.id} className={`rounded-lg border px-2.5 py-1.5 text-xs ${j.touche ? 'border-neon-cyan/40' : 'border-zinc-800'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-white">{j.arme}</span>
                  <span className={j.touche ? 'text-neon-cyan font-bold' : 'text-zinc-500'}>
                    {j.total} vs {j.seuil} — {j.touche ? 'TOUCHE' : 'rate'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  [{j.des.join(', ')}]{j.degats !== undefined ? ` · dégâts ${j.degats}` : ''}
                  {j.exploit ? ' · EXPLOIT' : ''}{j.echecCritique ? ' · échec critique' : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Accordion>

      {/* ─── Armure : fold rapide (replié) ──────────────────────────── */}
      <Accordion titre="Armure" sousTitre={character.armureDeployee ? 'déployée · 120 PA' : 'Guardian · 5 PA · CdF 5'} accent="gold">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => basculerArmure(true)}
            disabled={character.armureDeployee}
            className="min-h-[48px] rounded-lg border border-neon-cyan/40 text-xs text-neon-cyan disabled:opacity-40 active:bg-neon-cyan/10"
          >
            Déployer
          </button>
          <button
            type="button"
            onClick={() => basculerArmure(false)}
            disabled={!character.armureDeployee}
            className="min-h-[48px] rounded-lg border border-zinc-700 text-xs text-zinc-400 disabled:opacity-40 active:bg-zinc-800"
          >
            Replier → Guardian
          </button>
        </div>
        <p className="mt-1 text-[11px] text-zinc-600">Détail des modules : onglet Méta-armure.</p>
      </Accordion>

      {/* ─── Reset combat ───────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => resetCombat()}
        className="mb-2 min-h-[48px] w-full rounded-lg border border-neon-gold/40 text-xs font-semibold uppercase tracking-wider text-neon-gold active:bg-neon-gold/10"
      >
        Reset combat (retour Camelot)
      </button>
    </div>
  );
}
