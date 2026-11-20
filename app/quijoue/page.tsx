'use client';

/**
 * Écran « Qui joue ? » (prompt v12 §1) : 4 comptes créés en dur.
 * Le sas d'entrée (SHEET_PASSWORD) a déjà validé l'accès — ici on choisit
 * seulement le compte (cookie re-signé avec accountId, sans re-saisie).
 * Rôles : nuncyco = mj, les 3 autres = joueur (cosmétique pour l'instant).
 */
import { useEffect, useState } from 'react';

const COMPTES: { nom: string; role: string }[] = [
  { nom: 'nuncyco', role: 'mj' },
  { nom: 'bigboy', role: 'joueur' },
  { nom: 'xcypher', role: 'joueur' },
  { nom: 'albatar', role: 'joueur' },
];

export default function QuiJouePage() {
  const [chargement, setChargement] = useState(false);

  const choisir = async (nom: string) => {
    setChargement(true);
    const r = await fetch('/api/comptes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom }),
    });
    const data = (await r.json()) as { ok: boolean };
    if (data.ok) {
      localStorage.setItem('knight-compte', nom); // préférence UI uniquement
      window.location.href = '/';
    } else {
      alert('Erreur de sélection de compte');
      setChargement(false);
    }
  };

  return (
    <main className="mx-auto flex h-dvh max-w-md flex-col items-center justify-center gap-4 px-3">
      <h1 className="font-display text-2xl text-neon-cyan">Qui joue ?</h1>
      <div className="w-full space-y-2.5">
        {COMPTES.map((c) => (
          <button
            key={c.nom}
            type="button"
            disabled={chargement}
            onClick={() => choisir(c.nom)}
            className="min-h-[56px] w-full rounded-xl border border-zinc-700 bg-zinc-900/80 text-left active:bg-zinc-800"
          >
            <span className="px-3 text-base font-bold text-white">{c.nom}</span>
            <span className="px-1 text-xs uppercase tracking-widest text-zinc-500">
              {c.role === 'mj' ? 'Maître du jeu' : 'Joueur'}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-[11px] text-zinc-600">
        Chaque compte garde ses propres chevaliers et adversaires (sauvegarde serveur).
      </p>
    </main>
  );
}
