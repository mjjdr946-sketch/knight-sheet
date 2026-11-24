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

// §1 RÉPARATION (idempotent) : tout compte dont id == nom est migré vers un
// id immuable et SES fiches (chevaliers/adversaires/sessions) sont rebranchées.
const aReparer = db.prepare('SELECT id, nom FROM accounts WHERE id = nom').all();
for (const c of aReparer) {
  const nouvelId = 'acc-' + require('crypto').createHash('sha256').update(c.nom).digest('hex').slice(0, 8);
  db.prepare('UPDATE accounts SET id = ? WHERE id = ?').run(nouvelId, c.id);
  db.prepare('UPDATE chevaliers SET account_id = ? WHERE account_id = ?').run(nouvelId, c.id);
  db.prepare('UPDATE adversaires SET account_id = ? WHERE account_id = ?').run(nouvelId, c.id);
  db.prepare('UPDATE sessions_combat SET account_id = ? WHERE account_id = ?').run(nouvelId, c.id);
  console.log(`✓ réparé : compte « ${c.nom} » → id ${nouvelId} (fiches rebranchées)`);
}
if (aReparer.length === 0) console.log('· aucun compte à réparer (ids déjà immuables)');

const RECETTES = ['premiers-pas', 'vibe-recette', 'Aldric-le-Recette'];

let marques = 0;
for (const nom of RECETTES) {
  // §3 : reconnaître le compte PAR SON ID-IMMUBLE-RÉSOLU — le nom peut déjà
  // porter le suffixe (2e passage : « compte absent » au run précédent).
  const deja = db.prepare('SELECT id, nom FROM accounts WHERE LOWER(nom) = LOWER(?)').get(`${nom} (test)`);
  if (deja) { console.log(`· déjà marqué : ${deja.nom} (id ${deja.id} — intouché)`); continue; }
  const existe = db.prepare('SELECT id, nom FROM accounts WHERE LOWER(nom) = LOWER(?)').get(nom);
  if (!existe) { console.log(`· compte absent : ${nom} — ignoré`); continue; }
  if (existe.nom.includes('(test)')) { console.log(`· déjà marqué : ${existe.nom}`); continue; }
  // §2 : le RENOMMAGE ne touche QUE le nom — l'id est immuable (acc-<hash>),
  // les fiches référencées par account_id restent branchées (le bug prod :
  // id = nom renommé → fiches orphelines + PUT 500 sur sessions_combat).
  db.prepare('UPDATE accounts SET nom = ? WHERE id = ?').run(`${existe.nom} (test)`, existe.id);
  console.log(`✓ marqué : ${existe.nom} → ${existe.nom} (test) (id ${existe.id} immuable)`);
  marques++;
}
console.log(`${marques} compte(s) marqué(s) (test).`);
db.close();
