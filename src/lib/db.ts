/**
 * SQLite — prompt v12 §2 : la sauvegarde passe côté serveur (better-sqlite3),
 * fichier dans le volume Docker (`/data/knight.db`, surchargeable par
 * KNIGHT_DB_PATH). localStorage n'est PLUS une source de vérité.
 * Schéma versionné + seed des 4 comptes au premier lancement.
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.KNIGHT_DB_PATH ?? '/data/knight.db';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  // en dev local sans volume : fallback scratch
  let dir = path.dirname(DB_PATH);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    dir = './.data';
    fs.mkdirSync(dir, { recursive: true });
  }
  db = new Database(path.join(dir, path.basename(DB_PATH)));
  db.pragma('journal_mode = WAL');
  migrer(db);
  semer(db);
  return db;
}

/** Schéma versionné — v1 */
function migrer(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('mj', 'joueur'))
    );
    CREATE TABLE IF NOT EXISTS chevaliers (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      nom TEXT NOT NULL,
      fiche_json TEXT NOT NULL,       -- fiche versionnée (schemaVersion embarqué)
      mis_a_jour TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS adversaires (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      fiche_json TEXT NOT NULL,
      mis_a_jour TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sessions_combat (
      account_id TEXT PRIMARY KEY REFERENCES accounts(id),
      session_json TEXT NOT NULL,
      mis_a_jour TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  const v = db.prepare('SELECT version FROM schema_version').get() as { version: number } | undefined;
  if (!v) db.prepare('INSERT INTO schema_version (version) VALUES (1)').run();
}

/** Seed : 4 comptes créés en dur au premier lancement (prompt v12 §1). */
function semer(db: Database.Database): void {
  const comptes: [string, string, string][] = [
    ['nuncyco', 'nuncyco', 'mj'],
    ['bigboy', 'bigboy', 'joueur'],
    ['xcypher', 'xcypher', 'joueur'],
    ['albatar', 'albatar', 'joueur'],
  ];
  const insert = db.prepare('INSERT OR IGNORE INTO accounts (id, nom, role) VALUES (?, ?, ?)');
  for (const [id, nom, role] of comptes) insert.run(id, nom, role);
}

/** Récupère un compte par nom (écran « Qui joue ? »). */
export function compteParNom(nom: string): { id: string; nom: string; role: string } | null {
  return (getDb().prepare('SELECT id, nom, role FROM accounts WHERE nom = ?').get(nom) as never) ?? null;
}

export function compteParId(id: string): { id: string; nom: string; role: string } | null {
  return (getDb().prepare('SELECT id, nom, role FROM accounts WHERE id = ?').get(id) as never) ?? null;
}

export function tousComptes(): { id: string; nom: string; role: string }[] {
  return getDb().prepare('SELECT id, nom, role FROM accounts ORDER BY nom').all() as never;
}

// ─── Chevaliers ─────────────────────────────────────────────────────────────

export function chevaliersDuCompte(accountId: string): { id: string; nom: string; fiche: string }[] {
  return getDb().prepare('SELECT id, nom, fiche_json FROM chevaliers WHERE account_id = ? ORDER BY nom').all(accountId) as never;
}

export function sauverChevalier(accountId: string, fiche: { id: string; nom: string }): void {
  getDb()
    .prepare(`INSERT INTO chevaliers (id, account_id, nom, fiche_json, mis_a_jour) VALUES (?, ?, ?, ?, datetime('now'))
              ON CONFLICT(id) DO UPDATE SET nom = excluded.nom, fiche_json = excluded.fiche_json,
              account_id = excluded.account_id, mis_a_jour = excluded.mis_a_jour`)
    .run(fiche.id, accountId, fiche.nom, JSON.stringify(fiche));
}

export function supprimerChevalier(accountId: string, id: string): void {
  getDb().prepare('DELETE FROM chevaliers WHERE id = ? AND account_id = ?').run(id, accountId);
}

// ─── Adversaires ────────────────────────────────────────────────────────────

export function sauverAdversaire(accountId: string, adversaire: unknown & { id: string }): void {
  getDb()
    .prepare(`INSERT INTO adversaires (id, account_id, fiche_json, mis_a_jour) VALUES (?, ?, ?, datetime('now'))
              ON CONFLICT(id) DO UPDATE SET fiche_json = excluded.fiche_json, mis_a_jour = excluded.mis_a_jour`)
    .run(adversaire.id, accountId, JSON.stringify(adversaire));
}

export function adversairesDuCompte(accountId: string): string[] {
  return (getDb().prepare('SELECT fiche_json FROM adversaires WHERE account_id = ?').all(accountId) as { fiche_json: string }[]).map((r) => r.fiche_json);
}

// ─── Session de combat (sauvegarde à chaque jet, debounce côté client) ──────

export function sauverSession(accountId: string, session: unknown): void {
  getDb()
    .prepare(`INSERT INTO sessions_combat (account_id, session_json, mis_a_jour) VALUES (?, ?, datetime('now'))
              ON CONFLICT(account_id) DO UPDATE SET session_json = excluded.session_json, mis_a_jour = excluded.mis_a_jour`)
    .run(accountId, JSON.stringify(session));
}

export function sessionDuCompte(accountId: string): string | null {
  const r = getDb().prepare('SELECT session_json FROM sessions_combat WHERE account_id = ?').get(accountId) as { session_json: string } | undefined;
  return r?.session_json ?? null;
}
