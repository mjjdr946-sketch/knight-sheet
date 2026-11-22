import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';

/**
 * HOTFIX it. 17-bis prod — création de compte bloquée (404 « Compte inconnu »).
 * Tests au niveau `creerCompte` (logique d'unicité casse-insensible) + garde
 * de source de la route (auto-provisionnement sans flag, 409, validation).
 */

let dbMod: typeof import('../db');

beforeAll(async () => {
  // DB temporaire ISOLÉE et vierge à chaque run (avant le premier import du module)
  for (const f of ['/tmp/knight-hotfix-test.db', '/tmp/knight-hotfix-test.db-wal', '/tmp/knight-hotfix-test.db-shm']) {
    if (fs.existsSync(f)) fs.rmSync(f);
  }
  process.env.KNIGHT_DB_PATH = '/tmp/knight-hotfix-test.db';
  dbMod = await import('../db');
});

afterAll(() => {
  delete process.env.KNIGHT_DB_PATH;
});

describe('creerCompte — unicité casse-insensible (hotfix)', () => {
  it('crée un compte avec role joueur', () => {
    const r = dbMod.creerCompte('vibe-test');
    expect(r.ok).toBe(true);
    expect(r.compte?.nom).toBe('vibe-test');
    expect(r.compte?.role).toBe('joueur');
  });

  it('409 logique : doublon casse-insensible refusé (VIBE-TEST ≡ vibe-test)', () => {
    const r = dbMod.creerCompte('VIBE-TEST');
    expect(r.ok).toBe(false);
    expect(r.message).toContain('déjà pris');
  });

  it('nom vide ou trop court refusé (400 logique)', () => {
    expect(dbMod.creerCompte('').ok).toBe(false);
    expect(dbMod.creerCompte('  ').ok).toBe(false);
    expect(dbMod.creerCompte('a').ok).toBe(false);
  });

  it('compteParNom trouve le compte insensible à la casse (connexion après création)', () => {
    expect(dbMod.compteParNom('VIBE-TEST')).not.toBeNull();
    expect(dbMod.compteParNom('vibe-test')).not.toBeNull();
  });
});

describe('garde de source — route POST : auto-provisionnement + 409 + validation', () => {
  it('la route crée le compte inconnu (plus de 404 « Compte inconnu ») et gère 409/400', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = require('fs').readFileSync('app/api/comptes/route.ts', 'utf8');
    expect(src).not.toContain("message: 'Compte inconnu'"); // le 404 bloquant est mort
    expect(src).toContain('creerCompte(nomPropre)'); // auto-provisionnement
    expect(src).toContain("status: 409"); // doublon explicite
    expect(src).toContain("status: 400"); // nom vide
    // cookie knight-compte posé par l'API (prompt hotfix §1)
    expect(src).toContain("knight-compte");
  });

  it('l\u2019UI /quijoue affiche l\u2019erreur dans la page (toast, jamais de silence)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = require('fs').readFileSync('app/quijoue/page.tsx', 'utf8');
    expect(src).toContain("setErreur(data.message");
    expect(src).toContain('role="alert"');
  });
});
