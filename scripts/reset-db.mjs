#!/usr/bin/env node
/**
 * Reset de la base (prompt v19 §1) — remise à plat assumée par NunnuN :
 * tables `chevaliers`, `adversaires`, `sessions_combat` VIDÉES ; les comptes
 * restent (les 4 seed + comptes libres créés). Usage :
 *   node scripts/reset-db.mjs            (DB par défaut)
 *   node scripts/reset-db.mjs /chemin/knight.db
 */
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const cible = process.argv[2] ?? process.env.KNIGHT_DB_PATH ?? '/data/knight.db';
// en dev local sans volume : fallback scratch du repo
const dossier = path.dirname(cible);
if (!fs.existsSync(dossier)) {
  console.log(`⚠ Dossier absent (${dossier}) — création…`);
  fs.mkdirSync(dossier, { recursive: true });
}
const db = new Database(cible);
db.pragma('journal_mode = WAL');

// Schéma v1 idempotent (le script doit marcher sur une DB vierge ou existante)
db.exec(`
  CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, nom TEXT NOT NULL UNIQUE, role TEXT NOT NULL CHECK (role IN ('mj','joueur')));
  CREATE TABLE IF NOT EXISTS chevaliers (id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id), nom TEXT NOT NULL, fiche_json TEXT NOT NULL, mis_a_jour TEXT NOT NULL DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS adversaires (id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id), fiche_json TEXT NOT NULL, mis_a_jour TEXT NOT NULL DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS sessions_combat (account_id TEXT PRIMARY KEY REFERENCES accounts(id), session_json TEXT NOT NULL, mis_a_jour TEXT NOT NULL DEFAULT (datetime('now')));
`);
const v = db.prepare('SELECT version FROM schema_version').get();
if (!v) db.prepare('INSERT INTO schema_version (version) VALUES (1)').run();
// comptes : INSERT OR IGNORE (les 4 seed restent présents, prompt v19 §1)
const seed = db.prepare('INSERT OR IGNORE INTO accounts (id, nom, role) VALUES (?, ?, ?)');
for (const [id, nom, role] of [['nuncyco','nuncyco','mj'],['bigboy','bigboy','joueur'],['xcypher','xcypher','joueur'],['albatar','albatar','joueur']]) seed.run(id, nom, role);

const avant = {
  chevaliers: (db.prepare('SELECT COUNT(*) n FROM chevaliers').get() ?? { n: 0 }).n,
  adversaires: (db.prepare('SELECT COUNT(*) n FROM adversaires').get() ?? { n: 0 }).n,
  sessions: (db.prepare('SELECT COUNT(*) n FROM sessions_combat').get() ?? { n: 0 }).n,
};
db.prepare('DELETE FROM chevaliers').run();
db.prepare('DELETE FROM adversaires').run();
db.prepare('DELETE FROM sessions_combat').run();
const comptes = (db.prepare('SELECT COUNT(*) n FROM accounts').get() ?? { n: 0 }).n;

console.log(`✓ Reset terminé : ${avant.chevaliers} chevaliers, ${avant.adversaires} adversaires, ${avant.sessions} sessions supprimés — ${comptes} comptes conservés.`);
db.close();
