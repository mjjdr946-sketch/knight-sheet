'use client';

/**
 * Écran « Qui joue ? » (prompt v12 §1, v19bis) : liste DYNAMIQUE depuis le
 * serveur — après le reset complet il peut y avoir ZÉRO compte : la création
 * en libre-service est alors le seul chemin (prompt v14 §2). Le sas
 * (SHEET_PASSWORD) a déjà validé l'accès — ici on choisit/crée le compte
 * (cookie re-signé avec accountId, sans re-saisie). Pas de distinction de
 * rôle : les 4 comptes initiaux n'existent plus (remise à plat it. 17).
 */
import { useEffect, useState } from 'react';

interface Compte { id: string; nom: string; role: string }

export default function QuiJouePage() {
  const [chargement, setChargement] = useState(false);
  const [nouveauNom, setNouveauNom] = useState('');
  const [creation, setCreation] = useState(false);
  const [comptes, setComptes] = useState<Compte[] | null>(null); // null = chargement

  useEffect(() => {
    fetch('/api/comptes')
      .then((r) => r.json())
      .then((d: { comptes: Compte[] }) => setComptes(d.comptes))
      .catch(() => setComptes([]));
  }, []);

  const choisir = async (nom: string, creer = false) => {
    setChargement(true);
    const r = await fetch('/api/comptes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, creer }),
    });
    const data = (await r.json()) as { ok: boolean; message?: string };
    if (data.ok) {
      localStorage.setItem('knight-compte', nom); // préférence UI uniquement
      window.location.href = '/';
    } else {
      alert(data.message ?? 'Erreur de sélection de compte');
      setChargement(false);
    }
  };

  return (
    <main className="mx-auto flex h-dvh max-w-md flex-col items-center justify-center gap-4 px-3">
      <h1 className="font-display text-2xl text-neon-cyan">Qui joue ?</h1>

      <div className="w-full space-y-2.5">
        {comptes === null ? (
          <p className="animate-pulse text-center text-sm text-zinc-500">Chargement…</p>
        ) : comptes.length === 0 ? (
          <p className="text-center text-sm text-zinc-400">
            Aucun compte encore — crée le tien pour commencer.
          </p>
        ) : (
          comptes.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={chargement}
              onClick={() => choisir(c.nom)}
              className="min-h-[56px] w-full rounded-xl border border-zinc-700 bg-zinc-900/80 text-left active:bg-zinc-800"
            >
              <span className="px-3 text-base font-bold text-white">{c.nom}</span>
            </button>
          ))
        )}
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
