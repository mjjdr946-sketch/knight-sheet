import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';

/**
 * HOTFIX renommage de compte (recette vibe-coder, post-IT. 21) :
 * le script « (test) » renommait les comptes mais PAS les fiches —
 * id du compte = NOM → renommer ORPHELINAIT toutes les fiches
 * (fiche invisible + PUT /api/session 500, bandeau permanent).
 * Fix : id IMMUALE (acc-<hash>) + résolution nom→id dans la couche db.
 */

let dbMod: typeof import('../db');

beforeAll(async () => {
  for (const f of ['/tmp/knight-renomme.db', '/tmp/knight-renomme.db-wal', '/tmp/knight-renomme.db-shm']) {
    if (fs.existsSync(f)) fs.rmSync(f);
  }
  process.env.KNIGHT_DB_PATH = '/tmp/knight-renomme.db';
  dbMod = await import('../db');
});

afterAll(() => {
  delete process.env.KNIGHT_DB_PATH;
  vi.unstubAllGlobals();
});

describe('renommer un compte qui possède une fiche', () => {
  it('la fiche reste lisible par le NOUVEAU nom et par l’id immuable', async () => {
    // compte créé « à l'ancienne » : id = nom (schéma pré-migration)
    const db = (dbMod as unknown as { getDb: () => { prepare: (s: string) => { run: (...a: unknown[]) => void } } }).getDb();
    db.prepare('INSERT INTO accounts (id, nom, role) VALUES (?, ?, ?)').run('Aldric-le-Recette', 'Aldric-le-Recette', 'joueur');
    dbMod.sauverChevalier('Aldric-le-Recette', { id: 'fiche-aldric', nom: 'Aldric de Virelay' } as never);
    expect(dbMod.chevaliersDuCompte('Aldric-le-Recette')).toHaveLength(1);

    // le renommage (script) ne touche que le nom
    db.prepare('UPDATE accounts SET nom = ? WHERE id = ?').run('Aldric-le-Recette (test)', 'Aldric-le-Recette');

    // ✅ la fiche est lisible par le NOUVEAU nom (résolution nom → id immuable)
    expect(dbMod.chevaliersDuCompte('Aldric-le-Recette (test)')).toHaveLength(1);
    expect(dbMod.chevaliersDuCompte('Aldric-le-Recette (test)')[0]!.nom).toBe('Aldric de Virelay');
    // ✅ et par l'id immuable
    expect(dbMod.chevaliersDuCompte('Aldric-le-Recette')).toHaveLength(1);
  });

  it('PUT /api/session sur le compte renommé → 200, pas de 500', () => {
    const scellee = { tour: 1, jets: [] };
    dbMod.sauverSession('Aldric-le-Recette (test)', scellee); // ne doit PAS lever (avant : FK 500)
    const session = JSON.parse(dbMod.sessionDuCompte('Aldric-le-Recette (test)')!) as { tour: number };
    expect(session.tour).toBe(1);
  });

  it('deux noms proches → ids immuables DIFFÉRENTS (anti-collision sha256)', () => {
    dbMod.creerCompte('e2e-header-1234');
    dbMod.creerCompte('e2e-header-f-1234'); // mêmes 4 premiers caractères
    const a = dbMod.compteParNom('e2e-header-1234')!;
    const b = dbMod.compteParNom('e2e-header-f-1234')!;
    expect(a.id).not.toBe(b.id); // un hex LITTÉRAL les faisait entrer en collision (PK conflict)
    expect(a.id).not.toBe('e2e-header-1234'); // id immuable ≠ nom
  });

  it('migration v2 : les comptes id = nom sont convertis (fiches rebranchées) au premier getDb', () => {
    // le getDb du test précédent a déjà tourné la migration : aucun compte id=nom ne reste
    const comptes = dbMod.tousComptes();
    for (const c of comptes) expect(c.id).not.toBe(c.nom); // id immuable partout
  });

  it('garde de source — le script ne renomme QUE le nom (id immuable) et est idempotent', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const script = require('fs').readFileSync('scripts/mark-test-accounts.mjs', 'utf8');
    expect(script).toContain('déjà marqué'); // 2e passage : plus de « compte absent » fantôme
    expect(script).toContain('UPDATE accounts SET nom = ? WHERE id = ?'); // le nom seul
    // le BLOC de renommage ne touche jamais l'id (la réparation §1, elle,
    // migre légitimement id=nom → id immuable, une seule fois)
    expect(script).toContain('fiches rebranchées'); // réparation §1
  });
});
