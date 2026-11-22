import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import { useCharacterStore } from '../../store/characterStore';
import { personnageExemple } from '../../data/character';

/**
 * HOTFIX v19bis — le scellement du wizard ne persistait rien côté serveur
 * (pousserTout était un stub Promise<void> non câblé). Tests :
 * scellement → fiche dans le PUT ; échec réseau → bandeau + pas de redirection.
 */

let sync: typeof import('../sync');

beforeAll(async () => {
  for (const f of ['/tmp/knight-scellement.db', '/tmp/knight-scellement.db-wal', '/tmp/knight-scellement.db-shm']) {
    if (fs.existsSync(f)) fs.rmSync(f);
  }
  process.env.KNIGHT_DB_PATH = '/tmp/knight-scellement.db';
  sync = await import('../sync');
  // compte + fiche en place
});

afterAll(() => {
  delete process.env.KNIGHT_DB_PATH;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('pousserTout — scellement persiste côté serveur', () => {
  it('succès : PUT par fiche (active + autres), retourne true', async () => {
    const put = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', put);
    const ficheA = { ...structuredClone(personnageExemple), id: 'fiche-A', nom: 'Dame Vesper' };
    const ficheB = { ...structuredClone(personnageExemple), id: 'fiche-B', nom: 'Gauvain' };
    useCharacterStore.setState({ character: ficheA, autresFiches: { 'fiche-B': ficheB } } as never);
    const ok = await sync.pousserTout('acc-test');
    expect(ok).toBe(true);
    expect(put).toHaveBeenCalledTimes(2); // 2 fiches poussées
    const corps = JSON.parse(String(put.mock.calls[0]![1]!.body)) as { accountId: string; fiche: { nom: string } };
    expect(corps.accountId).toBe('acc-test');
    expect(corps.fiche.nom).toBe('Dame Vesper'); // nom/classe/armes/budget embarqués
  });

  it('échec réseau : retourne false + bandeau (surSync reçoit true)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau coupé')));
    let bandeau = false;
    const off = sync.surSync((v) => { bandeau = v; });
    const ok = await sync.pousserTout('acc-test');
    expect(ok).toBe(false); // PAS de redirection en cas d'échec
    expect(bandeau).toBe(true); // bandeau « ⚠ Non sauvegardé » affiché
    off();
  });

  it('échec HTTP (500) : retourne false aussi', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const ok = await sync.pousserTout('acc-test');
    expect(ok).toBe(false);
  });
});

describe('garde de source — wizard : scellement attendu + pas de redirection en échec', () => {
  it('la page creation pousse la FICHE SCELLÉE (hotfix 2 : brouillon du store) avec garde sur le résultat', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = require('fs').readFileSync('app/personnage/creation/page.tsx', 'utf8');
    // HOTFIX 2 : le brouillon du store (pas la fiche neutre) est scellé et poussé
    expect(src).toContain('await sauverFicheImmediate(accountId, finie)');
    expect(src).toContain('Non sauvegardé'); // bandeau
    expect(src).toMatch(/if \(!ok\)/); // garde avant redirection
    expect(src).toContain('confirmerScellement(finie)'); // swap store en succès uniquement
    expect(src).not.toContain('pousserTout'); // plus de push de la fiche neutre
  });
});
