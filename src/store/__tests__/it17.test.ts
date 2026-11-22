import { describe, it, expect } from 'vitest';
import { compteActif } from '../../lib/sync';

/** Itération 17 — remise à plat + flux strict (prompt v19). */
describe('§1 — reset serveur (script reset-db.mjs)', () => {
  it('garde : le script existe et cible chevaliers/adversaires/sessions (comptes conservés)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = require('fs').readFileSync('scripts/reset-db.mjs', 'utf8');
    expect(src).toContain('DELETE FROM chevaliers');
    expect(src).toContain('DELETE FROM adversaires');
    expect(src).toContain('DELETE FROM sessions_combat');
    expect(src).toContain("INSERT OR IGNORE INTO accounts"); // les comptes restent
  });
});

describe('§2 — alerte d\u2019incompatibilité au lieu de l\u2019import', () => {
  it('garde de source : la modale d\u2019import/migration est SUPPRIMÉE de l\u2019accueil, remplacée par l\u2019alerte', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = require('fs').readFileSync('app/page.tsx', 'utf8');
    expect(src).toContain("Mise à jour effectuée");
    expect(src).toContain("compris");
    expect(src).not.toContain('importerLocales');
    expect(src).not.toContain('proposerMigration');
    expect(src).not.toContain('Importer un personnage');
  });

  it('compteActif : préférence UI only (pas une source de fiches)', () => {
    expect(compteActif()).toBeNull(); // jsdom : pas de compte posé
  });
});

describe('§3 — flux strict (sas → compte → application)', () => {
  it('garde : middleware exige le payload accountId (ts.accountId.signature)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = require('fs').readFileSync('middleware.ts', 'utf8');
    expect(src).toContain("token.split('.').length >= 3");
    expect(src).toContain('/quijoue');
  });
});
