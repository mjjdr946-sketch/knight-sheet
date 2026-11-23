'use client';

/**
 * Générateur d'arme de prestige (prompt v13 §4, digest PARTIE 7 G pp.36-38) :
 * budget de 150 PG, grille d'effets à coûts, verrou Table Ronde (500 PG).
 * Produit une arme cohérente ajoutée à ⚒ Équipement.
 */
import { useMemo, useState } from 'react';
import { useCharacterStore } from '@/store/characterStore';
import { computeAttack } from '@/engine/attaque';
import type { Weapon } from '@/types/character';

// Grille PARTIE 7 G (pages 36-38) — coût en PG de conception
const EFFETS_GRILLE: { effet: string; cout: number; famille: string; restriction?: string }[] = [
  { effet: 'anti-Anathème', cout: 20, famille: 'anatheme' },
  { effet: 'anti-véhicule', cout: 20, famille: 'antivehicule' },
  { effet: 'artillerie', cout: 10, famille: 'artillerie' },
  { effet: 'assistance à l\u2019attaque', cout: 10, famille: 'assistance' },
  { effet: 'barrage 2', cout: 5, famille: 'barrage' },
  { effet: 'barrage 4', cout: 10, famille: 'barrage' },
  { effet: 'choc 2', cout: 10, famille: 'choc' },
  { effet: 'dégâts continus 3', cout: 5, famille: 'continus' },
  { effet: 'démoralisant', cout: 15, famille: 'demoralisant' },
  { effet: 'désignation', cout: 5, famille: 'designation' },
  { effet: 'destructeur', cout: 10, famille: 'destructeur' },
  { effet: 'en chaîne', cout: 15, famille: 'enchaine' },
  { effet: 'espérance', cout: 15, famille: 'esperance' },
  { effet: 'fureur', cout: 20, famille: 'fureur' },
  { effet: 'ignore armure', cout: 20, famille: 'ignorearmure' },
  { effet: 'ignore CdF', cout: 20, famille: 'ignorecdf' },
  { effet: 'jumelé akimbo', cout: 10, famille: 'jumele' },
  { effet: 'lesté', cout: 10, famille: 'leste', restriction: 'contact' },
  { effet: 'lumière 2', cout: 5, famille: 'lumiere' },
  { effet: 'lumière 4', cout: 15, famille: 'lumiere' },
  { effet: 'meurtrier', cout: 10, famille: 'meurtrier' },
  { effet: 'oblitération', cout: 15, famille: 'obliteration' },
  { effet: 'orfèvrerie', cout: 10, famille: 'orfevrerie', restriction: 'contact' },
  { effet: 'pénétrant 5', cout: 5, famille: 'penetrant' },
  { effet: 'perce armure 20', cout: 5, famille: 'percearmure' },
  { effet: 'précision', cout: 10, famille: 'precision', restriction: 'distance' },
  { effet: 'réaction 2', cout: 10, famille: 'reaction' },
  { effet: 'silencieux', cout: 10, famille: 'silencieux' },
  { effet: 'tir en sécurité', cout: 10, famille: 'securite' },
  { effet: 'ultraviolence', cout: 10, famille: 'ultraviolence' },
  { effet: 'deux mains', cout: -20, famille: 'deuxmains' }, // rapporte 20 PG
  { effet: 'ténébricide', cout: -20, famille: 'tenebricide' }, // rapporte 20 PG
];

const BUDGET = 150; // PG de conception (p.36)
const SEUIL_TABLE_RONDE = 500; // PG cumulés (prompt v13 §4)

export default function AtelierPage() {
  const gloire = useCharacterStore((s) => s.character.gloire);
  const ajouterArme = useCharacterStore((s) => s.ajouterArme);

  const [type, setType] = useState<'contact' | 'distance'>('contact');
  const [desDegats, setDesDegats] = useState(2); // base 2D6 (p.36)
  const [desViolence, setDesViolence] = useState(2);
  const [bonusFixe, setBonusFixe] = useState(0); // +3 = 5 PG · +6 = 10 · +9 = 15 · +12 = 20
  const [porteePlus, setPorteePlus] = useState(0);
  const [effetsChoisis, setEffetsChoisis] = useState<Set<string>>(new Set());
  const [nom, setNom] = useState('');
  const [armeForgee, setArmeForgee] = useState<string | null>(null); // modale custom (prompt v16 §6)

  const verrou = gloire < SEUIL_TABLE_RONDE;

  const cout = useMemo(() => {
    let c = 0;
    c += Math.max(0, desDegats - 2) * (desDegats > 10 ? 10 : 5);
    c += Math.max(0, desViolence - 2) * (desViolence > 10 ? 10 : 5);
    c += bonusFixe / 3 * 5;
    c += porteePlus * (type === 'distance' ? 5 : 10);
    for (const e of effetsChoisis) {
      const ligne = EFFETS_GRILLE.find((x) => x.effet === e);
      if (ligne) c += ligne.cout;
    }
    return c;
  }, [desDegats, desViolence, bonusFixe, porteePlus, effetsChoisis, type]);

  const restant = BUDGET - cout;
  const valide = restant >= 0 && nom.trim().length > 0 && cout >= 0;

  const forger = () => {
    if (!valide) return;
    const arme: Weapon = {
      id: `prestige-${Date.now()}`,
      nom: nom.trim(),
      type,
      accessibilite: 'rare',
      coutPG: 0, // forgée, pas achetée (p.36 : remise par Merlin)
      equipee: false,
      degats: { nombre: desDegats, faces: 6, bonus: bonusFixe },
      violence: { nombre: desViolence, faces: 6, bonus: 0 },
      portee: (type === 'contact' ? 'contact' : (['courte', 'moyenne', 'longue'] as const)[Math.min(2, porteePlus)] ?? 'courte'),
      effets: Array.from(effetsChoisis),
    };
    ajouterArme(arme); // propriété du compte (sauvegarde serveur via sync)
    setArmeForgee(arme.nom); // modale custom au lieu d'alert
  };

  if (verrou) {
    return (
      <main className="mx-auto max-w-md space-y-3 px-3 pb-24 pt-6">
        <h1 className="font-display text-xl text-neon-cyan">Atelier — arme de prestige</h1>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-300">
          🔒 <b>Verrouillé.</b> La création d'une arme de prestige exige d'être chevalier de la
          <b> Table Ronde (500 PG cumulés)</b> ou 700 PG, au choix du MJ (p.36).
          PG actuels : <b className="text-neon-gold">{gloire}</b> / {SEUIL_TABLE_RONDE}.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-3 px-3 pb-24 pt-6">
      <h1 className="font-display text-xl text-neon-cyan">Atelier — arme de prestige</h1>
      <p className="text-xs text-zinc-500">Budget de conception : <b className="text-neon-gold">{restant}</b> PG restants / {BUDGET} (p.36)</p>

      <div className="flex gap-2">
        {(['contact', 'distance'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setType(t)}
            className={`min-h-[48px] flex-1 rounded-lg border text-sm ${type === t ? 'border-neon-cyan/60 bg-neon-cyan/10 text-white' : 'border-zinc-800 text-zinc-400'}`}>
            {t === 'contact' ? 'Contact' : 'Distance'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-zinc-300">
        <label className="rounded-lg border border-zinc-800 p-2">
          Dégâts : {desDegats}D6
          <input type="range" min={2} max={15} value={desDegats} onChange={(e) => setDesDegats(Number(e.target.value))} className="w-full" />
        </label>
        <label className="rounded-lg border border-zinc-800 p-2">
          Violence : {desViolence}D6
          <input type="range" min={2} max={15} value={desViolence} onChange={(e) => setDesViolence(Number(e.target.value))} className="w-full" />
        </label>
      </div>

      <label className="block rounded-lg border border-zinc-800 p-2 text-sm text-zinc-300">
        Bonus fixe : +{bonusFixe} (5 PG par tranche de 3)
        <input type="range" min={0} max={12} step={3} value={bonusFixe} onChange={(e) => setBonusFixe(Number(e.target.value))} className="w-full" />
      </label>

      <label className="block rounded-lg border border-zinc-800 p-2 text-sm text-zinc-300">
        Portée +{porteePlus} niveau{porteePlus > 1 ? 'x' : ''} ({porteePlus * (type === 'distance' ? 5 : 10)} PG)
        <input type="range" min={0} max={2} value={porteePlus} onChange={(e) => setPorteePlus(Number(e.target.value))} className="w-full" />
      </label>

      <div className="rounded-lg border border-zinc-800 p-2">
        <p className="mb-1 text-[11px] uppercase tracking-widest text-zinc-500">Effets (un seul type par famille)</p>
        <div className="flex flex-wrap gap-1.5">
          {EFFETS_GRILLE.map((e) => {
            const choisi = effetsChoisis.has(e.effet);
            const interdit = e.restriction && e.restriction !== type;
            return (
              <button key={e.effet} type="button" disabled={interdit === true ? true : undefined}
                onClick={() => setEffetsChoisis((s) => {
                  const next = new Set(s);
                  if (choisi) next.delete(e.effet);
                  else {
                    // famille exclusive sauf mention : retirer les autres de la même famille
                    for (const x of next) {
                      const l = EFFETS_GRILLE.find((g) => g.effet === x);
                      if (l?.famille === e.famille) next.delete(x);
                    }
                    next.add(e.effet);
                  }
                  return next;
                })}
                className={`min-h-[36px] rounded border px-2 text-[11px] ${interdit ? 'opacity-30' : ''} ${choisi ? 'border-neon-cyan/60 bg-neon-cyan/10 text-white' : 'border-zinc-800 text-zinc-400'}`}>
                {e.effet} {e.cout > 0 ? `(${e.cout})` : `(+${-e.cout})`}
              </button>
            );
          })}
        </div>
      </div>

      <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom de l'arme (validé avec le MJ — p.38)"
        className="min-h-[48px] w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm text-white" />

      {/* Modale de forge (prompt v16 §6) — jamais d'alert natif */}
      {armeForgee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
          <div className="max-w-sm space-y-3 rounded-xl border border-neon-gold/50 bg-zinc-950 p-4 text-center">
            <p className="font-display text-lg text-neon-gold">⚒ « {armeForgee} » forgée !</p>
            <p className="text-xs text-zinc-400">Remise par Merlin en cérémonie (p.38) — visible dans ⚒ Équipement et sauvegardée côté serveur.</p>
            <button type="button" onClick={() => setArmeForgee(null)} className="min-h-[48px] w-full rounded-lg bg-neon-gold/20 text-sm font-bold text-neon-gold">Parfait</button>
          </div>
        </div>
      )}
      <button type="button" onClick={forger} disabled={!valide}
        className="min-h-[48px] w-full rounded-lg bg-neon-gold/20 text-base font-bold text-neon-gold disabled:opacity-40">
        ⚒ Forger l'arme de prestige
      </button>
      <p className="text-[11px] text-zinc-600">
        Max 20 PG d'amélioration par intervalle entre missions (p.38). Une deuxième arme possible (même type ou complément, les deux à une main).
      </p>
    </main>
  );
}
