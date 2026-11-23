/**
 * Évaluation de la modale « 🛠 Mise à jour effectuée » (prompt v21 §1, it. 19).
 *
 * Logique PURE et testée : la modale ne se déclenche QUE si la version
 * persistée est INFÉRIEURE à SCHEMA_VERSION (comparaison chiffrée). Toute
 * donnée créée par la version courante est acquittée D'OFFICE — un nouveau
 * joueur ne voit plus jamais la modale après son premier scellement.
 */
import { SCHEMA_VERSION } from '../store/characterStore';

export type VerdictMigration = 'rien' | 'modale' | 'acquittable';

/** Payload zustand persist : { state: {...}, version: N } */
interface PayloadPersist { state?: unknown; version?: number }

export function evaluerMigration(brut: string | null, ack: string | null): VerdictMigration {
  // Aucune donnée persistée → rien à migrer (première visite)
  if (!brut) return 'rien';
  let versionPersistee = 0;
  try {
    versionPersistee = (JSON.parse(brut) as PayloadPersist).version ?? 0;
  } catch {
    versionPersistee = 0; // payload illisible → prudence : traité comme ancien
  }
  // Données créées par la version COURANTE (ou plus récente) → acquittement
  // automatique posé d'office (le test du prompt v21 : premier scellement →
  // recharger → AUCUNE modale).
  if (versionPersistee >= SCHEMA_VERSION) return 'acquittable';
  // Anciennes données (v < SCHEMA_VERSION, ex. pré-it. 17) :
  // modale UNE FOIS si pas encore acquittée pour ce schéma.
  if (ack === String(SCHEMA_VERSION)) return 'rien'; // déjà acquitté
  return 'modale';
}

/** Pose l'acquittement de la version courante (après modale ou auto). */
export function poserAcquittement(): void {
  localStorage.setItem('knight-migration-ack', String(SCHEMA_VERSION));
}
