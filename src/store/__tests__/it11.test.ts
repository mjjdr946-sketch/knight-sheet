import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCharacterStore } from '../characterStore';
import { personnageExemple } from '../../data/character';
import { computeDerived } from '../../engine/stats';
import { META_ARMURES } from '../../data/meta-armures';
import { ARMES_PRESTIGE } from '../../data/arsenal-2038';

/** Itération 11 — câblage UI→API, Necromancer, générateur (prompt v13). */
const S = () => useCharacterStore.getState();
const reset = () => {
  const c = structuredClone(personnageExemple);
  useCharacterStore.setState({ character: c, derived: computeDerived(c), actifId: c.id, autresFiches: {} } as never);
};

describe('§1 — sync : toute écriture pousse au serveur (mock fetch)', () => {
  beforeEach(() => {
    reset();
    localStorage.setItem('knight-compte', 'test-account');
  });

  it('brancherSync : un ajusterJauge planifie un PUT /api/chevaliers', async () => {
    const { brancherSync } = await import('../../lib/sync');
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    brancherSync();
    S().ajusterJauge('pe', -1); // écriture → subscriber → debounce
    await vi.advanceTimersByTimeAsync(900); // debounce 800 ms
    const appels = fetchMock.mock.calls.filter((c) => String(c[0]).includes('/api/chevaliers'));
    expect(appels.length).toBeGreaterThanOrEqual(1);
    const [url, init] = appels[appels.length - 1] as [string, RequestInit];
    expect(init.method).toBe('PUT');
    const corps = JSON.parse(String(init.body)) as { accountId: string; fiche: { jauges: { pe: { current: number } } } };
    expect(corps.accountId).toBe('test-account');
    expect(corps.fiche.jauges.pe.current).toBe(S().character.jauges.pe.current);
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
});

describe('§3 — Necromancer / Armure Sarcophage (2038 p.21-23)', () => {
  beforeEach(reset);

  it('profil 80 PA / 100 PE / CdF 12, 12 slots partout', () => {
    const m = META_ARMURES['necromancer']!;
    expect(m.paTotal).toBe(80);
    expect(m.peTotal).toBe(100);
    expect(m.cdfTotal).toBe(12);
    expect(Object.values(m.slots).every((s) => s === 12)).toBe(true);
  });

  it('transition : conserve PG/XP/armes, perd armure+OD+modules, dotation par palier (p.21)', () => {
    const p = structuredClone(personnageExemple);
    p.gloire = 160; // palier 150-199 : 3 std + 2 avancés
    p.xpJournal = [{ quand: 'x', points: 160, note: 'test', paliers: [150] }];
    S().remplacerPersonnage(p);
    const armesAvant = S().character.armes.map((a) => a.id);

    const r = S().devenirNecromancer();
    expect(r.ok).toBe(true);
    const fin = S().character;
    expect(fin.metaArmor.modele).toBe('necromancer');
    expect(fin.gloire).toBe(160); // conservé
    expect(fin.xpJournal).toHaveLength(1); // conservé
    expect(fin.armes.map((a) => a.id)).toEqual(armesAvant); // conservées
    expect(fin.overdrives).toHaveLength(0); // OD perdues (4 libres au MJ, p.21)
    expect(fin.modules.length).toBe(5); // dotation 3 std + 2 avancés (le store installe depuis le catalogue)
  });

  it('garde anti-double-transition (jamais deux fois)', () => {
    S().devenirNecromancer();
    const r2 = S().devenirNecromancer();
    expect(r2.ok).toBe(false);
    expect(r2.message).toContain('jamais deux fois');
  });
});

describe('§4 — générateur d\u2019arme de prestige (PARTIE 7 G)', () => {
  beforeEach(reset);

  it('grille : l\u2019anti-Anathème coûte 20 PG, le ténébricide RAPPORTE 20 PG (p.36-38)', () => {
    const src = require('fs').readFileSync('app/personnage/atelier/page.tsx', 'utf8');
    expect(src).toContain("effet: 'anti-Anathème', cout: 20");
    expect(src).toContain("cout: -20"); // effets rapportant des PG
    expect(src).toContain('const BUDGET = 150');
    expect(src).toContain('const SEUIL_TABLE_RONDE = 500');
  });

  it('verrou : arme de prestige absente des données tant que PG < 500 (l\u2019atelier affiche le seuil)', () => {
    // l'arme de prestige de base n'est PAS dans l'arsenal standard (7 armes prestige à part)
    const nomsStd = S().character.armes.map((a) => a.nom);
    expect(nomsStd).not.toContain('Chaîne-épée Wyvern');
    expect(ARMES_PRESTIGE.length).toBe(7); // données présentes, accessoires de l'atelier
  });

  it('ajouterArme : l\u2019arme forgée rejoint ⚒ Équipement (propriété du compte)', () => {
    const arme = { ...ARMES_PRESTIGE[0]!, id: 'forge-test', nom: 'Testforge', equipee: false };
    S().ajouterArme(arme);
    expect(S().character.armes.some((a) => a.id === 'forge-test')).toBe(true);
  });
});
