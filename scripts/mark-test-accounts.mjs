/**
 * IT. 21 §6 : marque les comptes de RECETTE avec le suffixe « (test) »
 * (nom affiché ET stocké). Idempotent : ne re-marque jamais un compte
 * déjà suffixé. Nuncyco n'est PAS touché.
 *
 * Usage : node scripts/mark-test-accounts.mjs /data/knight.db
 */
import Database from 'better-sqlite3';

const dbPath = process.argv[2] ?? '/data/knight.db';
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

const RECETTES = ['premiers-pas', 'vibe-recette', 'Aldric-le-Recette'];

let marques = 0;
for (const nom of RECETTES) {
  const existe = db.prepare('SELECT id, nom FROM accounts WHERE LOWER(nom) = LOWER(?)').get(nom);
  if (!existe) { console.log(`· compte absent : ${nom} — ignoré`); continue; }
  if (existe.nom.includes('(test)')) { console.log(`· déjà marqué : ${existe.nom}`); continue; }
  db.prepare('UPDATE accounts SET nom = ? WHERE id = ?').run(`${existe.nom} (test)`, existe.id);
  console.log(`✓ marqué : ${existe.nom} → ${existe.nom} (test)`);
  marques++;
}
console.log(`${marques} compte(s) marqué(s) (test).`);
db.close();
