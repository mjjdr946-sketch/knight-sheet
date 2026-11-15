'use client';

/**
 * Page Identité — lames de tarot (22 lames), haut fait, blason, motivations,
 * serment + export/import du personnage en JSON.
 * L'effet des lames sur les stats passe par les `Modifier` des cartes
 * (ex. Dur à cuir → +5 PS, Forteresse spirituelle → +5 PEs).
 */
import { useRef, useState } from 'react';
import RuleDrawer from '../../../components/drawers/RuleDrawer';
import Accordion from '../../../components/ui/Accordion';
import { LAMES_TAROT } from '../../../src/data/tarot';
import { useCharacterStore } from '@/store/characterStore';

export default function IdentitePage() {
  const character = useCharacterStore((s) => s.character);
  const majIdentite = useCharacterStore((s) => s.majIdentite);
  const remplacerPersonnage = useCharacterStore((s) => s.remplacerPersonnage);

  const [drawer, setDrawer] = useState(false);
  const [lameSelectionnee, setLameSelectionnee] = useState<number | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [messageImport, setMessageImport] = useState<string | null>(null);

  // Numéros des lames retenues sur la feuille
  const numerosRetenus = new Set(character.identite.cartes.map((c) => c.numero));

  const toggleLame = (index: number) => {
    const lame = LAMES_TAROT[index];
    if (!lame) return;
    if (numerosRetenus.has(lame.numero)) {
      // retire la lame de la feuille (et ses effets)
      majIdentite({ cartes: character.identite.cartes.filter((c) => c.numero !== lame.numero) });
      return;
    }
    // ajoute la lame avec son avantage (les effets de stats sont déclarés
    // manuellement pour les avantages chiffrés, ex. Dur à cuir / Forteresse)
    const effets = [];
    if (lame.avantage.startsWith('Dur à cuir')) {
      effets.push({ source: 'Dur à cuir', target: 'ps' as const, valeur: 5, type: 'bonus' as const });
    }
    if (lame.avantage.startsWith('Forteresse spirituelle')) {
      effets.push({ source: 'Forteresse spirituelle', target: 'pes' as const, valeur: 5, type: 'bonus' as const });
    }
    majIdentite({
      cartes: [...character.identite.cartes, {
        numero: lame.numero,
        nom: lame.nom,
        aspect: null, // mapping aspect FR → id géré par le MJ à la création
        avantagesRetenus: [lame.avantage],
        inconvénientRetenu: lame.inconvénient,
        effets,
      }],
    });
  };

  // ─── Export / import JSON ─────────────────────────────────────────────
  const exporter = () => {
    const blob = new Blob([JSON.stringify(character, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knight-${character.nom.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importer = (fichier: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const perso = JSON.parse(reader.result as string) as typeof character;
        if (!perso.id || !perso.jauges || !perso.metaArmor) throw new Error('format');
        remplacerPersonnage(perso);
        setMessageImport(`Import réussi : ${perso.nom}`);
      } catch {
        setMessageImport('Fichier invalide — import refusé');
      }
    };
    reader.readAsText(fichier);
  };

  return (
    <div className="space-y-5">
      {/* ─── Lames du tarot (replié, compteur = retenues) ───────────── */}
      <Accordion titre="Lames du tarot" compteur={`${numerosRetenus.size}/22`} sousTitre="2 avantages + 1 inconvénient retenus (p.114-122)" accent="gold">
        <div className="grid grid-cols-4 gap-1.5">
          {LAMES_TAROT.map((lame, i) => (
            <button
              key={lame.numero + lame.nom}
              type="button"
              onClick={() => { setLameSelectionnee(i); setDrawer(true); }}
              className={`min-h-[72px] rounded-lg border p-1.5 text-center active:bg-zinc-800 ${
                numerosRetenus.has(lame.numero) ? 'border-neon-gold/60 shadow-glow-gold bg-zinc-900' : 'border-zinc-800'
              }`}
            >
              <span className="block text-xs text-zinc-500">{lame.numero}</span>
              <span className="block text-xs leading-tight text-white">{lame.nom.replace('L\u2019', '')}</span>
            </button>
          ))}
        </div>
      </Accordion>

      {/* ─── Haut fait / blason / serment ───────────────────────────── */}
      <section className="space-y-2">
        <h2 className="font-display text-xs uppercase tracking-widest text-zinc-500">Histoire</h2>
        <label className="block rounded-xl border border-zinc-800 bg-zinc-900/70 p-2">
          <span className="text-xs uppercase text-zinc-500">Haut fait</span>
          <input
            value={character.identite.hautFait.nom}
            onChange={(e) => majIdentite({ hautFait: { ...character.identite.hautFait, nom: e.target.value } })}
            className="mt-1 min-h-[40px] w-full bg-transparent text-sm text-white outline-none"
          />
        </label>
        <label className="block rounded-xl border border-zinc-800 bg-zinc-900/70 p-2">
          <span className="text-xs uppercase text-zinc-500">Surnom</span>
          <input
            value={character.identite.hautFait.surnom}
            onChange={(e) => majIdentite({ hautFait: { ...character.identite.hautFait, surnom: e.target.value } })}
            className="mt-1 min-h-[40px] w-full bg-transparent text-sm text-white outline-none"
          />
        </label>
        <label className="block rounded-xl border border-zinc-800 bg-zinc-900/70 p-2">
          <span className="text-xs uppercase text-zinc-500">Blason & vœu (p.126)</span>
          <input
            value={character.identite.blason}
            onChange={(e) => majIdentite({ blason: e.target.value })}
            className="mt-1 min-h-[40px] w-full bg-transparent text-sm text-white outline-none"
          />
        </label>
        <label className="block rounded-xl border border-zinc-800 bg-zinc-900/70 p-2">
          <span className="text-xs uppercase text-zinc-500">Serment</span>
          <input
            value={character.identite.serment ?? ''}
            onChange={(e) => majIdentite({ serment: e.target.value })}
            className="mt-1 min-h-[40px] w-full bg-transparent text-sm text-white outline-none"
          />
        </label>
      </section>

      {/* ─── Motivations (replié) ───────────────────────────────────── */}
      <Accordion titre="Motivations" compteur={character.identite.motivations.length} accent="gold">
        <ul className="space-y-1.5">
          {character.identite.motivations.map((m, i) => (
            <li key={i} className={`rounded-lg border px-2.5 py-2 text-xs ${m.type === 'majeure' ? 'border-neon-gold/40 text-neon-gold' : 'border-zinc-800 text-zinc-300'}`}>
              <span className="mr-1.5 text-xs uppercase">{m.type}</span>{m.texte}
            </li>
          ))}
        </ul>
        <p className="mt-1 text-xs text-zinc-600">1 majeure + 3 mineures (vœu du blason inclus) · motivation accomplie = +1D6 espoir (p.127)</p>
      </Accordion>

      {/* ─── Export / import (replié) ───────────────────────────────── */}
      <Accordion titre="Sauvegarde" accent="cyan">
        <div className="space-y-2 pb-2">
        <button
          type="button"
          onClick={exporter}
          className="min-h-[48px] w-full rounded-lg border border-neon-cyan/40 text-xs font-semibold uppercase tracking-wider text-neon-cyan active:bg-neon-cyan/10"
        >
          Exporter le personnage (JSON)
        </button>
        <button
          type="button"
          onClick={() => importRef.current?.click()}
          className="min-h-[48px] w-full rounded-lg border border-zinc-700 text-xs text-zinc-300 active:bg-zinc-800"
        >
          Importer un personnage (JSON)
        </button>
        <input
          ref={importRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importer(f);
            e.target.value = '';
          }}
        />
        {messageImport && <p className="text-center text-xs text-neon-cyan">{messageImport}</p>}
        </div>
      </Accordion>

      {/* Drawer de détail d'une lame */}
      {lameSelectionnee !== null && LAMES_TAROT[lameSelectionnee] && (
        <RuleDrawer
          open={drawer}
          onClose={() => setDrawer(false)}
          titre={`${LAMES_TAROT[lameSelectionnee].numero} — ${LAMES_TAROT[lameSelectionnee].nom}`}
          sousTitre={LAMES_TAROT[lameSelectionnee].aspect ? `Aspect : ${LAMES_TAROT[lameSelectionnee].aspect}` : 'Bonus spécial'}
          pageRef="p.114-122"
        >
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase text-zinc-500">Avantage</p>
              <p className="text-sm text-neon-cyan">{LAMES_TAROT[lameSelectionnee].avantage}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-zinc-500">Inconvénient</p>
              <p className="text-sm text-red-300">{LAMES_TAROT[lameSelectionnee].inconvénient}</p>
            </div>
            <button
              type="button"
              onClick={() => { toggleLame(lameSelectionnee); setDrawer(false); }}
              className={`min-h-[48px] w-full rounded-lg text-sm font-medium ${
                numerosRetenus.has(LAMES_TAROT[lameSelectionnee].numero)
                  ? 'bg-red-900/30 text-red-300'
                  : 'bg-neon-gold/15 text-neon-gold'
              }`}
            >
              {numerosRetenus.has(LAMES_TAROT[lameSelectionnee].numero) ? 'Retirer de la feuille' : 'Retenir cette lame'}
            </button>
            <p className="text-xs text-zinc-600">
              Chaque lame une seule fois · avantage + inconvénient de la même lame possibles (FAQ p.449)
            </p>
          </div>
        </RuleDrawer>
      )}
    </div>
  );
}
