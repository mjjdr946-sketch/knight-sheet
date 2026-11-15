'use client';

/**
 * Page de login (prompt v6 §5) — mot de passe unique partagé.
 * Message d'erreur volontairement générique.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState(false);
  const [attente, setAttente] = useState(false);

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttente(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push('/personnage/combat');
        router.refresh();
      } else {
        setErreur(true);
      }
    } catch {
      setErreur(true);
    } finally {
      setAttente(false);
    }
  };

  return (
    <div className="flex h-dvh items-center justify-center bg-zinc-950 px-6">
      <form onSubmit={soumettre} className="w-full max-w-sm space-y-4 rounded-2xl border border-neon-cyan/30 bg-zinc-900/80 p-6">
        <h1 className="font-display text-center text-xl text-neon-cyan">Knight</h1>
        <p className="text-center text-sm text-zinc-500">Feuille de personnage — accès protégé</p>
        <label className="block">
          <span className="text-xs uppercase text-zinc-500">Mot de passe</span>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErreur(false); }}
            autoComplete="current-password"
            className="mt-1 min-h-[48px] w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white outline-none focus:border-neon-cyan"
            autoFocus
          />
        </label>
        {erreur && <p className="text-center text-sm text-red-400">Accès refusé</p>}
        <button
          type="submit"
          disabled={attente || password.length === 0}
          className="min-h-[48px] w-full rounded-lg bg-neon-cyan/20 text-base font-bold uppercase tracking-widest text-neon-cyan shadow-glow-cyan disabled:opacity-40 active:bg-neon-cyan/30"
        >
          Entrer
        </button>
      </form>
    </div>
  );
}
