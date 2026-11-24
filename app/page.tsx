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
import { evaluerMigration, poserAcquittement } from '@/lib/migration';
import { computeDerived, palierPuissance } from '@/engine/stats';
import { compteActif, chargerFichesServeur } from '@/lib/sync';
import { personnageExemple } from '@/data/character';
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
  // IT. 22 §1 : suppression avec confirmation CUSTOM + DELETE serveur
  // `id` = id SERVEUR (celui de la fiche), `cle` = clé du store (actifId pour la fiche
  // active, son id sinon). Le DELETE doit viser l'id serveur : envoyer `actifId`
  // (« principal ») supprimait 0 ligne en répondant 200 → la fiche revenait au reload.
  const [suppressionEnCours, setSuppressionEnCours] = useState<{ id: string; cle: string; nom: string } | null>(null);
  const [erreurSuppression, setErreurSuppression] = useState('');

  const [hydrate, setHydrate] = useState(false);
  // IT. 20 §3 : le GET serveur est ASYNCHRONE — l'état « vide » ne doit
  // JAMAIS s'afficher avant la réponse (course de chargement constatée :
  // « pas encore de chevalier » alors que la fiche existait en base).
  const [chargementFiches, setChargementFiches] = useState(true);
  // Prompt v19 §2 : alerte d'incompatibilité — les anciens chevaliers sont
  // EFFACÉS (schéma pré-it. 11 incompatible, perte assumée par NunnuN).
  const [incompat, setIncompat] = useState(false);

  // CORRECTIF it. 17bis (bug 1) : zustand-persist recrée la clé juste après
  // removeItem → la modale bouclait. Fix : acquittement DÉDIÉ versionné
  // (knight-migration-ack = SCHEMA_VERSION) + purge des SEULES données de
  // fiche (champs du state), jamais de la clé entière.
  const detecterIncompatibles = () => {
    if (typeof window === 'undefined') return;
    // it. 19 §1 (prompt v21) : comparaison CHIFFRÉE de la version persistée —
    // la modale ne se déclenche que si les données sont plus ANCIENNES que le
    // schéma courant ; toute donnée créée par la version courante est
    // acquittée d'office (plus jamais sur un compte neuf).
    const verdict = evaluerMigration(
      localStorage.getItem('knight-sheet-v1'),
      localStorage.getItem('knight-migration-ack'),
    );
    if (verdict === 'modale') setIncompat(true);
    else if (verdict === 'acquittable' && !localStorage.getItem('knight-migration-ack')) {
      poserAcquittement(); // données de la version courante → ack posé d'office
    }
  };

  const acquitterMigration = () => {
    // purge des seules DONNÉES de fiche dans knight-sheet-v1 (le persist
    // zustand recrée la clé, on laisse une coquille propre) + acquittement
    const brut = localStorage.getItem('knight-sheet-v1');
    if (brut) {
      try {
        const parsed = JSON.parse(brut) as Record<string, unknown>;
        if (parsed.state) {
          (parsed.state as Record<string, unknown>).character = null; // fiches effacées
          (parsed.state as Record<string, unknown>).autresFiches = {};
          localStorage.setItem('knight-sheet-v1', JSON.stringify(parsed));
        }
      } catch {
        localStorage.removeItem('knight-sheet-v1');
      }
    }
    poserAcquittement();
    setIncompat(false);
  };

  useEffect(() => {
    useCharacterStore.persist.rehydrate();
    const state = useCharacterStore.getState();
    useCharacterStore.setState({ derived: computeDerived(state.character) });
    document.documentElement.setAttribute('data-theme', themeDeFiche(state.character));
    detecterIncompatibles();
    // Prompt v13 : les fiches du COMPTE viennent du serveur (cache local écrasé)
    const accountId = compteActif();
    if (accountId) {
      chargerFichesServeur(accountId).then((fiches) => {
        // CORRECTIF ops (it. 11, recette pt 6) : le cache local appartient au
        // compte PRÉCÉDENT. Si le serveur ne renvoie rien, on repart d'une fiche
        // neutre — sinon un compte vierge voit les chevaliers d'un autre compte.
        const liste = fiches ?? [];
        if (liste.length > 0) {
          // Invariant (it. 7) : l'active n'est JAMAIS dans autresFiches, sinon
          // l'accueil affiche la même fiche deux fois (constaté en prod).
          const active = liste.find((f) => f.id === state.actifId) ?? liste[0]!;
          useCharacterStore.setState({
            character: active,
            autresFiches: Object.fromEntries(liste.filter((f) => f.id !== active.id).map((f) => [f.id, f])),
          } as never);
        } else {
          const neutre = { ...structuredClone(personnageExemple), id: 'aucune', nom: '' };
          useCharacterStore.setState({ character: neutre, autresFiches: {} } as never);
        }
      }).finally(() => setChargementFiches(false)); // réponse serveur reçue (ou échec)
    } else {
      setChargementFiches(false); // pas de compte : pas de chargement serveur
    }
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

  // Toutes les fiches : l'active (si elle existe — état « aucune fiche » propre) + les autres
  // CORRECTIF it. 17bis (bug 2) : la fiche neutre de repli (id 'aucune',
  // invariant it. 11) n'est PAS un chevalier — elle ne doit jamais être rendue.
  const fiches: { id: string; fiche: Character; active: boolean }[] = [
    ...(actifId && character.id !== 'aucune' ? [{ id: actifId, fiche: character, active: true }] : []),
    ...Object.entries(autresFiches)
      .filter(([id]) => id !== 'aucune')
      .map(([id, f]) => ({ id, fiche: f, active: false })),
  ];

  if (!hydrate) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <span className="font-display animate-pulse text-sm text-neon-cyan">Knight</span>
      </div>
    );
  }

  // Prompt v14 §2 (bug 2 it. 17bis) : état vide PROPRE — pas de carte fantôme.
  // IT. 20 §3 : distinguer CHARGEMENT (spinner) de VIDE — jamais de « pas
  // encore de chevalier » avant la réponse serveur.
  if (chargementFiches) {
    return (
      <main className="flex h-dvh items-center justify-center">
        <span className="font-display animate-pulse text-sm text-neon-cyan">Chargement des chevaliers…</span>
      </main>
    );
  }
  if (fiches.length === 0) {
    return (
      <main className="mx-auto flex h-dvh max-w-md lg:max-w-2xl flex-col items-center justify-center gap-4 px-3">
        <p className="font-display text-xl text-neon-cyan">Knight</p>
        <p className="text-center text-sm text-zinc-400">
          Ce compte n'a pas encore de chevalier. Crée ton premier chevalier avec l'assistant (10 étapes).
        </p>
        <button type="button" onClick={() => router.push('/personnage/creation')}
          className="min-h-[56px] w-full rounded-xl border border-neon-cyan/40 bg-neon-cyan/10 text-sm font-bold text-neon-cyan active:bg-neon-cyan/20">
          + Créer mon premier chevalier
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md lg:max-w-2xl space-y-4 px-3 pb-10 pt-8">
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
                    const blob = new Blob([JSON.stringify(fiche, null, 2)], { type: 'application/json' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `knight-${fiche.nom.replace(/\s+/g, '-').toLowerCase()}.json`;
                    a.click();
                    URL.revokeObjectURL(a.href);
                  }}
                  className="min-h-[48px] flex-1 rounded-lg border border-zinc-700 text-xs text-zinc-400 active:bg-zinc-800"
                >
                  Exporter
                </button>
                <button
                  type="button"
                  onClick={() => setSuppressionEnCours({ id: fiche.id, cle: id, nom: fiche.nom })}
                  className="min-h-[48px] flex-1 rounded-lg border border-red-900/50 text-xs text-red-400 active:bg-red-900/20"
                >
                  Supprimer
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* IT. 22 §1 : confirmation CUSTOM + DELETE serveur (avant : la garde « au moins une fiche » + l'absence de DELETE laissaient la fiche réapparaître) */}
      {suppressionEnCours && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal>
          <div className="w-full max-w-sm space-y-3 rounded-xl border border-zinc-700 bg-zinc-950 p-4">
            <p className="font-display text-sm text-red-300">🗑 Supprimer {suppressionEnCours.nom} ?</p>
            <p className="text-xs text-zinc-400">Irréversible — la fiche disparaît du serveur et de cet appareil.</p>
            {erreurSuppression && <p className="rounded-lg border border-red-700 bg-red-950/40 p-2 text-xs text-red-300">{erreurSuppression}</p>}
            <button type="button" onClick={async () => {
              const accountId = compteActif();
              const cle = suppressionEnCours.cle;
              if (accountId) {
                try {
                  const r = await fetch(`/api/chevaliers?accountId=${encodeURIComponent(accountId)}&id=${encodeURIComponent(suppressionEnCours.id)}`, { method: 'DELETE' });
                  if (!r.ok) { setErreurSuppression(`Suppression refusée par le serveur (${r.status}) — fiche conservée.`); return; }
                } catch (e) { console.error('[accueil] DELETE échoué', e); setErreurSuppression('Serveur injoignable — fiche conservée.'); return; }
              } else {
                setErreurSuppression('Aucun compte sélectionné — fiche conservée.');
                return;
              }
              supprimerFiche(cle);
              setErreurSuppression('');
              setSuppressionEnCours(null);
            }} className="min-h-[48px] w-full rounded-lg border border-red-900 text-xs font-bold text-red-300 active:bg-red-900/40">
              Supprimer définitivement
            </button>
            <button type="button" onClick={() => setSuppressionEnCours(null)}
              className="min-h-[48px] w-full rounded-lg border border-zinc-700 text-xs text-zinc-300 active:bg-zinc-800">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ─── Créer → wizard 10 étapes (CORRECTIF it. 7, bug 3 🔴) ────── */}
      <button
        type="button"
        onClick={() => router.push('/personnage/creation')}
        className="min-h-[48px] w-full rounded-xl border border-neon-cyan/40 bg-neon-cyan/10 text-sm font-bold text-neon-cyan active:bg-neon-cyan/20"
      >
        + Nouveau chevalier (assistant 10 étapes)
      </button>

      {/* ─── Alerte d'incompatibilité (prompt v19 §2) — perte assumée ─── */}
      {incompat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
          <div className="max-w-sm space-y-3 rounded-xl border border-amber-700/60 bg-zinc-950 p-4 text-center">
            <p className="text-2xl">🛠</p>
            <p className="text-base font-bold text-white">Mise à jour effectuée</p>
            <p className="text-xs text-zinc-400">Les anciens chevaliers sont <b>incompatibles</b> et vont être effacés. Recrée ton chevalier avec l&apos;assistant.</p>
            <button
              type="button"
              onClick={acquitterMigration}
              className="min-h-[48px] w-full rounded-lg bg-neon-cyan/20 text-sm font-bold text-neon-cyan"
            >
              J&apos;ai compris
            </button>
          </div>
        </div>
      )}

          </main>
  );
}
