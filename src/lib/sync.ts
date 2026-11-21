/**
 * Sync UI → API (prompt v13 §1, singleton renforcé prompt v16 §4) —
 * le localStorage n'est plus la source de vérité : chaque action d'écriture
 * du store est poussée au serveur (debounce 800 ms fiche / 300 ms session).
 * État de sauvegarde UNIQUE avec un canal par objet : le succès de la session
 * NE MASQUE PAS un échec de fiche (le bandeau reflète un OU logique).
 * Préférences UI seulement en localStorage (thème, cinématique, compte).
 */
import { useCharacterStore } from '../store/characterStore';

export const COMPTE_KEY = 'knight-compte';

export function compteActif(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(COMPTE_KEY);
}

/** État de sauvegarde — un canal par objet (prompt v16 §4). */
type SyncListener = (enRetard: boolean) => void;
const listeners = new Set<SyncListener>();
const etat: { fiche: boolean; session: boolean } = { fiche: false, session: false };
function notifier(): void {
  const enRetard = etat.fiche || etat.session;
  for (const l of listeners) l(enRetard);
}
export function surSync(l: SyncListener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
export function syncEnRetard(): boolean {
  return etat.fiche || etat.session;
}

// Timers SÉPARÉS (bug it. 11 : la session 300 ms pouvait masquer l'échec fiche)
let timerFiche: ReturnType<typeof setTimeout> | null = null;
let timerSession: ReturnType<typeof setTimeout> | null = null;

/** Sauvegarde la fiche active (debounce 800 ms, prompt v13 §1). */
export function planifierSauvegardeFiche(): void {
  const accountId = compteActif();
  if (!accountId) return;
  if (timerFiche) clearTimeout(timerFiche);
  timerFiche = setTimeout(() => void pousserFiche(accountId), 800);
}

async function pousserFiche(accountId: string): Promise<void> {
  const fiche = useCharacterStore.getState().character;
  try {
    const r = await fetch('/api/chevaliers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, fiche }),
    });
    etat.fiche = !r.ok;
    notifier();
  } catch {
    etat.fiche = true; // échec réseau → bandeau (retry au prochain changement)
    notifier();
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
      etat.session = !r.ok;
      notifier();
    } catch {
      etat.session = true;
      notifier();
    }
  }, 300);
}

/** Charge les fiches du compte depuis le serveur (recette points 1-3). */
export async function chargerFichesServeur(accountId: string): Promise<Character_Serveur[] | null> {
  try {
    const r = await fetch(`/api/chevaliers?accountId=${accountId}`);
    if (!r.ok) { etat.fiche = true; notifier(); return null; }
    const data = (await r.json()) as { fiches: Character_Serveur[] };
    return data.fiches;
  } catch {
    etat.fiche = true;
    notifier();
    return null;
  }
}
interface Character_Serveur { id: string; nom: string; [k: string]: unknown }

/** Branche le subscriber du store : toute écriture planifie une sauvegarde. */
let branche = false;
export function brancherSync(): void {
  if (branche) return;
  branche = true;
  useCharacterStore.subscribe(() => {
    planifierSauvegardeFiche();
    planifierSauvegardeSession();
  });
}
