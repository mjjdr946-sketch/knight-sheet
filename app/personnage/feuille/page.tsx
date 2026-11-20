'use client';

/**
 * Onglet 📜 Feuille (prompt v8 livrable 4) : regroupe Attributs, Méta-armure
 * et Identité en accordéons repliés par défaut (une seule route à scroller).
 */
import { useState } from 'react';
import AttributsPage from '../attributs/page';
import MetaArmurePage from '../meta-armure/page';
import IdentitePage from '../identite/page';
import Accordion from '../../../components/ui/Accordion';
import CapacitesClasse from '../capacites-classe';
import { useCharacterStore } from '@/store/characterStore';
import { useCinematique } from '../../../components/ui/ResultatAnime';

/** Widget XP (prompt v8 livrable 5) : ajouter des points, journal, paliers franchis = réclamations */
function XpWidget() {
  const scelle = useCharacterStore((s) => s.character.scelle);
  const deverrouiller = useCharacterStore((s) => s.deverrouiller);
  const gloire = useCharacterStore((s) => s.character.gloire);
  const journalRef = useCharacterStore((s) => s.character.xpJournal); // selector STABLE (zustand v5 : pas de ?? [] dans le selector)
  const journal = journalRef ?? [];
  const ajouterXP = useCharacterStore((s) => s.ajouterXP);
  const [pts, setPts] = useState(10);

  const ajouter = () => {
    const paliers = ajouterXP(pts, 'session');
    if (paliers.length > 0) {
      alert(`Palier franchi : ${paliers.join(', ')} PG — évolution réclamable dans Méta-armure !`);
    } else {
      alert(`+${pts} PG de gloire (total ${gloire + pts})`);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
      <p className="text-xs uppercase tracking-widest text-zinc-500">Points de gloire (XP)</p>
      <p className="text-2xl font-bold text-neon-gold">{gloire} PG</p>
      <div className="mt-2 flex gap-2">
        <input type="number" min={1} value={pts} onChange={(e) => setPts(Number(e.target.value) || 0)}
          className="min-h-[48px] w-24 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm text-white" />
        <button type="button" onClick={ajouter} className="min-h-[48px] flex-1 rounded-lg bg-neon-gold/20 text-sm font-bold text-neon-gold active:bg-neon-gold/30">
          Ajouter des XP
        </button>
      </div>
      <p className="mt-1 text-[11px] text-zinc-600">Paliers d'évolution : 150 / 200 / 250 PG (détails dans l'onglet Armure de la Méta-armure).</p>
      {journal.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {journal.slice(-5).reverse().map((j, i) => (
            <p key={i} className="text-[11px] text-zinc-500">
              +{j.points} PG{j.paliers.length > 0 ? ` — palier ${j.paliers.join('/')} franchi` : ''} · {j.note}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FeuillePage() {
  const scelle = useCharacterStore((s) => s.character.scelle);
  const [cinematique, setCinematique] = useCinematique(); // prompt v11 §3 : réglages
  const deverrouiller = useCharacterStore((s) => s.deverrouiller);
  return (
    <main className="mx-auto max-w-md px-3 pb-24 pt-4">
      <h1 className="font-display mb-3 text-xl text-neon-cyan">
        Feuille {scelle && <span className="text-sm text-neon-gold">🔒 scellée</span>}
      </h1>
      {scelle && (
        <button
          type="button"
          onClick={() => { if (confirm('Déverrouiller la fiche pour édition ? Le MJ devra valider les modifications.')) deverrouiller(); }}
          className="mb-3 min-h-[48px] w-full rounded-lg border border-neon-gold/50 text-xs text-neon-gold active:bg-neon-gold/10"
        >
          🔓 Déverrouiller l'édition
        </button>
      )}
      {/* Réglages (prompt v11 §3) : animation Cinématique ON par défaut */}
      <label className="flex min-h-[48px] items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 text-sm text-zinc-300">
        <span>🎬 Cinématique (flash/vibration au jet)</span>
        <input type="checkbox" checked={cinematique} onChange={(e) => setCinematique(e.target.checked)} className="h-5 w-5 accent-cyan-400" />
      </label>
      <XpWidget />
      <CapacitesClasse />
      {/* Chaque section existante est réutilisée telle quelle — repliées par défaut */}
      <div className="space-y-3">
        <Accordion titre="Caractéristiques & dérivées" accent="cyan">
          <AttributsPage />
        </Accordion>
        <Accordion titre="Méta-armure" accent="cyan">
          <MetaArmurePage />
        </Accordion>
        <Accordion titre="Identité — tarot, motivations, état" accent="gold">
          <IdentitePage />
        </Accordion>
      </div>
    </main>
  );
}
