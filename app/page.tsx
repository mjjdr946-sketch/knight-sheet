'use client';

/**
 * Accueil « Mes chevaliers » (prompt v8 livrable 1).
 * Liste des fiches des joueurs (nom, classe, PG), colorée par armure
 * (DOCUMENT 3 règle 5 : bordure + glow discret de la classe de CHAQUE carte).
 * Actions : jouer (charge + redirection), créer, dupliquer, supprimer,
 * importer (JSON).
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCharacterStore, ACCENT_PAR_MODELE, themeDeFiche } from '@/store/characterStore';
import { computeDerived, palierPuissance } from '@/engine/stats';
import type { Character } from '@/types/character';

export default function AccueilPage() {
  const router = useRouter();
  const character = useCharacterStore((s) => s.character);
  const actifId = useCharacterStore((s) => s.actifId);
  const autresFiches = useCharacterStore((s) => s.autresFiches);
  const dupliquerFiche = useCharacterStore((s) => s.dupliquerFiche);
  const supprimerFiche = useCharacterStore((s) => s.supprimerFiche);
  const chargerFiche = useCharacterStore((s) => s.chargerFiche);
  const remplacerPersonnage = useCharacterStore((s) => s.remplacerPersonnage);

  const [hydrate, setHydrate] = useState(false);
  const [importOuvert, setImportOuvert] = useState(false);

  useEffect(() => {
    useCharacterStore.persist.rehydrate();
    const state = useCharacterStore.getState();
    useCharacterStore.setState({ derived: computeDerived(state.character) });
    document.documentElement.setAttribute('data-theme', themeDeFiche(state.character));
    setHydrate(true);
  }, []);

  const jouer = (id: string) => {
    // si ce n'est pas l'active, la charger (sauvegarde de l'active au passage)
    if (id !== actifId) chargerFiche(id);
    // le thème suit la classe du personnage chargé (DOCUMENT 3 règle 4)
    const fiche = id === actifId ? character : autresFiches[id];
    if (fiche) document.documentElement.setAttribute('data-theme', themeDeFiche(fiche));
    router.push('/personnage/combat');
  };

  const importer = (fichier: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const perso = JSON.parse(reader.result as string) as Character;
        if (!perso.id || !perso.jauges || !perso.metaArmor) throw new Error('format');
        // l'import devient la fiche active
        remplacerPersonnage(perso);
        useCharacterStore.setState((s) => ({
          actifId: perso.id,
          autresFiches: { ...s.autresFiches, [perso.id]: perso },
        }));
        alert(`Import réussi : ${perso.nom}`);
        setImportOuvert(false);
      } catch {
        alert('Fichier invalide — import refusé');
      }
    };
    reader.readAsText(fichier);
  };

  // Toutes les fiches : l'active (si elle existe — état « aucune fiche » propre) + les autres
  const fiches: { id: string; fiche: Character; active: boolean }[] = [
    ...(actifId ? [{ id: actifId, fiche: character, active: true }] : []),
    ...Object.entries(autresFiches).map(([id, f]) => ({ id, fiche: f, active: false })),
  ];

  if (!hydrate) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <span className="font-display animate-pulse text-sm text-neon-cyan">Knight</span>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-md space-y-4 px-3 pb-10 pt-8">
      <header className="text-center">
        <h1 className="font-display text-2xl text-neon-cyan">Knight</h1>
        <p className="mt-1 text-sm text-zinc-500">Mes chevaliers</p>
      </header>

      {/* ─── Liste des fiches ─────────────────────────────────────────── */}
      <ul className="space-y-2.5">
        {fiches.map(({ id, fiche, active }) => {
          const accent = ACCENT_PAR_MODELE[fiche.metaArmor.modele] ?? 'hsl(0 84% 58%)';
          const modele = fiche.metaArmor.modele;
          return (
            <li
              key={id}
              className="rounded-xl border bg-zinc-900/80 p-3"
              style={{ borderColor: `${accent}66`, boxShadow: `0 0 12px ${accent}22` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-bold text-white">
                    {fiche.nom}
                    {active && <span className="ml-2 text-[11px] font-normal text-neon-cyan">active</span>}
                  </p>
                  <p className="text-xs" style={{ color: accent }}>
                    {modele.charAt(0).toUpperCase() + modele.slice(1)} · {fiche.niveau} · {fiche.gloire} PG
                    <span className="ml-1.5 rounded border border-zinc-700 px-1 text-[10px] text-zinc-300">
                      {palierPuissance(fiche.gloire).rang}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => jouer(id)}
                  className="min-h-[48px] rounded-lg bg-zinc-800 px-4 text-sm font-semibold text-white"
                  style={{ boxShadow: `0 0 10px ${accent}55` }} // glow discret de la classe (règle 5)
                >
                  Jouer
                </button>
              </div>
              <div className="mt-2 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => dupliquerFiche(id)}
                  className="min-h-[48px] flex-1 rounded-lg border border-zinc-700 text-xs text-zinc-400 active:bg-zinc-800"
                >
                  Dupliquer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (fiches.length <= 1) { alert('Au moins une fiche doit rester.'); return; }
                    if (confirm(`Supprimer ${fiche.nom} ?`)) supprimerFiche(id);
                  }}
                  className="min-h-[48px] flex-1 rounded-lg border border-red-900/50 text-xs text-red-400 active:bg-red-900/20"
                >
                  Supprimer
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* ─── Créer → wizard 10 étapes (CORRECTIF it. 7, bug 3 🔴) ────── */}
      <button
        type="button"
        onClick={() => router.push('/personnage/creation')}
        className="min-h-[48px] w-full rounded-xl border border-neon-cyan/40 bg-neon-cyan/10 text-sm font-bold text-neon-cyan active:bg-neon-cyan/20"
      >
        + Nouveau chevalier (assistant 10 étapes)
      </button>

      {/* ─── Importer ─────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setImportOuvert((o: boolean) => !o)}
        className="min-h-[48px] w-full rounded-lg border border-zinc-700 text-xs text-zinc-300 active:bg-zinc-800"
      >
        Importer un personnage (JSON)
      </button>
      {importOuvert && (
        <input
          type="file"
          accept="application/json"
          className="block w-full text-xs text-zinc-400"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importer(f);
            e.target.value = '';
          }}
        />
      )}
    </main>
  );
}
