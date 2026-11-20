/**
 * Sync UI → API (prompt v13 §1) — le localStorage n'est plus la source de
 * vérité : chaque action d'écriture du store est poussée au serveur
 * (debounce 800 ms). Bandeau « non sauvegardé » sur échec (retry léger).
 * Préférences UI seulement en localStorage (thème, cinématique, compte).
 */
import { useCharacterStore } from '../store/characterStore';

export const COMPTE_KEY = 'knight-compte';

export function compteActif(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(COMPTE_KEY);
}

/** État de sync minimal (module, pas Zustand — consommé par le bandeau). */
type SyncListener = (enRetard: boolean) => void;
const listeners = new Set<SyncListener>();
let enRetard = false;
function notifier(v: boolean) {
  enRetard = v;
  for (const l of listeners) l(v);
}
export function surSync(l: SyncListener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
export function syncEnRetard(): boolean {
  return enRetard;
}

let timerFiche: ReturnType<typeof setTimeout> | null = null;
let timerSession: ReturnType<typeof setTimeout> | null = null;

/** Sauvegarde la fiche active (debounce 800 ms, prompt v13 §1). */
export function planifierSauvegardeFiche(): void {
  const accountId = compteActif();
  if (!accountId) return;
  if (timerFiche) clearTimeout(timerFiche);
  timerFiche = setTimeout(() => pousserFiche(accountId), 800);
}

async function pousserFiche(accountId: string): Promise<void> {
  const fiche = useCharacterStore.getState().character;
  try {
    const r = await fetch('/api/chevaliers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, fiche }),
    });
    notifier(!r.ok);
  } catch {
    notifier(true); // échec réseau → bandeau (retry au prochain changement)
  }
}

/** Sauvegarde immédiate de la session de combat (à chaque jet, debounce court). */
export function planifierSauvegardeSession(): void {
  const accountId = compteActif();
  if (!accountId) return;
  if (timerSession) clearTimeout(timerSession);
  timerSession = setTimeout(async () => {
    const session = useCharacterStore.getState().combatSession;
    try {
      const r = await fetch('/api/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, session }),
      });
      notifier(!r.ok);
    } catch {
      notifier(true);
    }
  }, 300);
}

/** Charge les fiches du compte depuis le serveur (recette points 1-3). */
export async function chargerFichesServeur(accountId: string): Promise<Character_Serveur[] | null> {
  try {
    const r = await fetch(`/api/chevaliers?accountId=${accountId}`);
    if (!r.ok) { notifier(true); return null; }
    const data = (await r.json()) as { fiches: Character_Serveur[] };
    notifier(false);
    return data.fiches;
  } catch {
    notifier(true);
    return null;
  }
}
interface Character_Serveur { id: string; nom: string; [k: string]: unknown }

/**
 * Branche le subscriber du store : toute écriture planifie une sauvegarde.
 * Appelé une seule fois au montage du layout personnage.
 */
let branche = false;
export function brancherSync(): void {
  if (branche) return;
  branche = true;
  useCharacterStore.subscribe(() => {
    planifierSauvegardeFiche();
    planifierSauvegardeSession();
  });
}
