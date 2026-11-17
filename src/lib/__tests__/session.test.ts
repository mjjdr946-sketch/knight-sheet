import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

/**
 * Tests du cookie HMAC (correctif it. 7, bug 7 🟠 — prompt v9) :
 * le cookie ne contient JAMAIS le mot de passe ; rotation du mot de passe →
 * sessions invalidées.
 */
import { creerTokenSession, verifierTokenSession } from '../session';

describe('session HMAC (bug 7)', () => {
  const MDP = 'un-mot-de-passe-secret';

  beforeAll(() => { process.env.SHEET_PASSWORD = MDP; });
  afterAll(() => { delete process.env.SHEET_PASSWORD; });

  it('le token signé est valide et ne contient PAS le mot de passe', async () => {
    const token = await creerTokenSession();
    expect(token).toBeTruthy();
    expect(token).not.toContain(MDP); // 🔒 le secret n'est jamais dans le cookie
    expect(await verifierTokenSession(token)).toBe(true);
  });

  it('la rotation du mot de passe invalide les sessions existantes', async () => {
    const token = await creerTokenSession(); // signé avec MDP
    process.env.SHEET_PASSWORD = 'nouveau-mot-de-passe';
    expect(await verifierTokenSession(token)).toBe(false); // signature dérivée ≠
    process.env.SHEET_PASSWORD = MDP;
  });

  it('un token forgé (mauvaise signature) est refusé', async () => {
    expect(await verifierTokenSession('abc.deadbeef')).toBe(false);
    expect(await verifierTokenSession('')).toBe(false);
    expect(await verifierTokenSession('pas-un-token')).toBe(false);
  });
});
