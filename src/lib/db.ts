/**
 * SQLite — prompt v12 §2 : la sauvegarde passe côté serveur (better-sqlite3),
 * fichier dans le volume Docker (`/data/knight.db`, surchargeable par
 * KNIGHT_DB_PATH). localStorage n'est PLUS une source de vérité.
 * Schéma versionné + seed des 4 comptes au premier lancement.
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

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
  // Prompt v19bis : PAS de seed — on reprend réellement à zéro, les comptes
  // sont créés en libre-service sur « Qui joue ? ».
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
  let v = db.prepare('SELECT version FROM schema_version').get() as { version: number } | undefined;
  if (!v) { db.prepare('INSERT INTO schema_version (version) VALUES (1)').run(); v = { version: 1 }; }
  // HOTFIX (recette vibe-coder) : les fiches référencent le compte par account_id
  // = NOM — renommer un compte (suffixe « (test) ») les ORPHELINAIT. Migration v2 :
  // l'id devient IMMuable (acc-<hash>), le nom redevient affichable/modifiable.
  if (v.version < 2) {
    // CORRECTIF ops (simulation sur copie de la base prod) — deux bugs bloquants :
    // 1) la garde `id !== nom` sautait TOUS les comptes renommés « (test) » (id sans
    //    suffixe, nom avec) : ils n'étaient jamais migrés, puis la version passait à 2
    //    (migration perdue). Un id immuable se reconnaît à son préfixe `acc-`.
    // 2) les FK sont ACTIVES en prod (pragma foreign_keys = 1) et le DDL n'a pas
    //    `ON UPDATE CASCADE` : `UPDATE accounts SET id` échouait en
    //    « FOREIGN KEY constraint failed ». La migration passe donc en transaction
    //    avec `defer_foreign_keys` (FK vérifiées au COMMIT).
    const comptes = db.prepare('SELECT id, nom FROM accounts').all() as { id: string; nom: string }[];
    const migrerCompte = db.transaction((c: { id: string; nom: string }) => {
      const nouvelId = `acc-${hashId(c.nom)}`;
      db.pragma('defer_foreign_keys = ON');
      db.prepare('UPDATE chevaliers SET account_id = ? WHERE account_id = ?').run(nouvelId, c.id);
      db.prepare('UPDATE adversaires SET account_id = ? WHERE account_id = ?').run(nouvelId, c.id);
      db.prepare('UPDATE sessions_combat SET account_id = ? WHERE account_id = ?').run(nouvelId, c.id);
      db.prepare('UPDATE accounts SET id = ? WHERE id = ?').run(nouvelId, c.id);
    });
    for (const c of comptes) {
      if (c.id.startsWith('acc-')) continue; // déjà immuable
      migrerCompte(c);
    }
    db.prepare('UPDATE schema_version SET version = 2').run();
  }
}

/** Id immuable déterministe (8 hex du sha256 du nom de création).
 * ATTENTION : un vrai hash — les 8 premiers hex du nom LITTÉRAL font
 * collision dès que deux noms partagent leurs premiers caractères. */
function hashId(nom: string): string {
  return crypto.createHash('sha256').update(nom).digest('hex').slice(0, 8);
}

/** Résout une CLÉ de compte (id immuable OU nom courant) vers l'id immuable. */
export function resoudreCompteId(cle: string): string {
  const direct = getDb().prepare('SELECT id FROM accounts WHERE id = ?').get(cle) as { id: string } | undefined;
  if (direct) return direct.id;
  const parNom = getDb().prepare('SELECT id FROM accounts WHERE LOWER(nom) = LOWER(?)').get(cle) as { id: string } | undefined;
  return parNom?.id ?? cle; // inconnu : renvoyer tel quel (les requêtes ne rienteront rien)
}

/** Récupère un compte par nom (écran « Qui joue ? »). */
/** Recherche casse-insensible (HOTFIX : connexion avec n'importe quelle casse). */
export function compteParNom(nom: string): { id: string; nom: string; role: string } | null {
  return (getDb().prepare('SELECT id, nom, role FROM accounts WHERE LOWER(nom) = LOWER(?)').get(nom) as never) ?? null;
}

export function compteParId(id: string): { id: string; nom: string; role: string } | null {
  return (getDb().prepare('SELECT id, nom, role FROM accounts WHERE id = ?').get(id) as never) ?? null;
}

/** Crée un compte (prompt v14 §2 : libre-service, unicité insensible à la casse). */
export function creerCompte(nom: string): { ok: boolean; compte?: { id: string; nom: string; role: string }; message?: string } {
  const nomPropre = nom.trim();
  if (nomPropre.length < 2) return { ok: false, message: 'Nom trop court (2 caractères minimum)' };
  const existant = getDb().prepare('SELECT id, nom FROM accounts WHERE LOWER(nom) = LOWER(?)').get(nomPropre) as { id: string } | undefined;
  if (existant) return { ok: false, message: 'Ce nom est déjà pris' };
  // HOTFIX : id IMMUALE (acc-<hash>) — le nom n'est plus une clé. Les routes
  // résolvent nom → id via resoudreCompteId, la FK n'est plus fragilisée par
  // un renommage (avant : renommer le compte orphelinait TOUTES ses fiches).
  const id = `acc-${hashId(nomPropre)}`;
  getDb().prepare('INSERT INTO accounts (id, nom, role) VALUES (?, ?, ?)').run(id, nomPropre, 'joueur');
  return { ok: true, compte: { id, nom: nomPropre, role: 'joueur' } };
}

export function tousComptes(): { id: string; nom: string; role: string }[] {
  return getDb().prepare('SELECT id, nom, role FROM accounts ORDER BY nom').all() as never;
}

// ─── Chevaliers ─────────────────────────────────────────────────────────────

export function chevaliersDuCompte(accountId: string): { id: string; nom: string; fiche: string }[] {
  accountId = resoudreCompteId(accountId); // clé = id immuable OU nom courant
  // CORRECTIF ops (it. 10) : la colonne est `fiche_json` mais les appelants
  // (app/api/chevaliers/route.ts) lisent `r.fiche` → JSON.parse(undefined) → 500
  // dès qu'un compte possède une fiche. Alias explicite ; à upstreamer proprement
  // par le dev (renommer le champ dans le type si préféré).
  return getDb().prepare('SELECT id, nom, fiche_json AS fiche FROM chevaliers WHERE account_id = ? ORDER BY nom').all(accountId) as never;
}

export function sauverChevalier(accountId: string, fiche: { id: string; nom: string }): void {
  accountId = resoudreCompteId(accountId); // HOTFIX : le compte peut être désigné par son nom
  getDb()
    .prepare(`INSERT INTO chevaliers (id, account_id, nom, fiche_json, mis_a_jour) VALUES (?, ?, ?, ?, datetime('now'))
              ON CONFLICT(id) DO UPDATE SET nom = excluded.nom, fiche_json = excluded.fiche_json,
              account_id = excluded.account_id, mis_a_jour = excluded.mis_a_jour`)
    .run(fiche.id, accountId, fiche.nom, JSON.stringify(fiche));
}

export function supprimerChevalier(accountId: string, id: string): void {
  getDb().prepare('DELETE FROM chevaliers WHERE id = ? AND account_id = ?').run(id, resoudreCompteId(accountId));
}

// ─── Adversaires ────────────────────────────────────────────────────────────

export function sauverAdversaire(accountId: string, adversaire: unknown & { id: string }): void {
  accountId = resoudreCompteId(accountId);
  getDb()
    .prepare(`INSERT INTO adversaires (id, account_id, fiche_json, mis_a_jour) VALUES (?, ?, ?, datetime('now'))
              ON CONFLICT(id) DO UPDATE SET fiche_json = excluded.fiche_json, mis_a_jour = excluded.mis_a_jour`)
    .run(adversaire.id, accountId, JSON.stringify(adversaire));
}

export function adversairesDuCompte(accountId: string): string[] {
  return (getDb().prepare('SELECT fiche_json FROM adversaires WHERE account_id = ?').all(resoudreCompteId(accountId)) as { fiche_json: string }[]).map((r) => r.fiche_json);
}

// ─── Session de combat (sauvegarde à chaque jet, debounce côté client) ──────

export function sauverSession(accountId: string, session: unknown): void {
  accountId = resoudreCompteId(accountId); // HOTFIX : nom OU id (PUT /api/session ne 500 plus)
  getDb()
    .prepare(`INSERT INTO sessions_combat (account_id, session_json, mis_a_jour) VALUES (?, ?, datetime('now'))
              ON CONFLICT(account_id) DO UPDATE SET session_json = excluded.session_json, mis_a_jour = excluded.mis_a_jour`)
    .run(accountId, JSON.stringify(session));
}

export function sessionDuCompte(accountId: string): string | null {
  const r = getDb().prepare('SELECT session_json FROM sessions_combat WHERE account_id = ?').get(resoudreCompteId(accountId)) as { session_json: string } | undefined;
  return r?.session_json ?? null;
}
