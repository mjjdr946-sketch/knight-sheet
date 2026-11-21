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
  const [nouveauNom, setNouveauNom] = useState('');
  const [creation, setCreation] = useState(false);

  const choisir = async (nom: string, creer = false) => {
    setChargement(true);
    const r = await fetch('/api/comptes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, creer }),
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
      <div className="w-full space-y-2">
        {!creation ? (
          <button type="button" onClick={() => setCreation(true)} className="min-h-[48px] w-full rounded-lg border border-neon-cyan/40 bg-neon-cyan/10 text-sm font-bold text-neon-cyan active:bg-neon-cyan/20">
            + Créer un nouveau compte
          </button>
        ) : (
          <div className="flex gap-2">
            <input value={nouveauNom} onChange={(e) => setNouveauNom(e.target.value)} placeholder="Nom du compte…"
              className="min-h-[48px] flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm text-white" />
            <button type="button" onClick={() => nouveauNom.trim() && choisir(nouveauNom.trim(), true)}
              className="min-h-[48px] rounded-lg bg-neon-cyan/20 px-3 text-sm font-bold text-neon-cyan">Créer</button>
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-[11px] text-zinc-600">
        Chaque compte garde ses propres chevaliers et adversaires (sauvegarde serveur).
      </p>
    </main>
  );
}
