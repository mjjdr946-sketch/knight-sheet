import { describe, it, expect } from 'vitest';
import { ARMES_PRESTIGE, NOUVEL_ARSENAL_2038, MODULES_PRESTIGE, RELIQUES_ESPOIR } from '../arsenal-2038';
import { armesArsenal } from '../weapons';
import { catalogueModules } from '../modules';

/** Itération 14 — rattrapage arsenal 2038 (prompt v16 §0, DOCUMENT 3). */
describe('§0 — rattrapage arsenal-2038 (compte des items vs digest)', () => {
  it('5 armes du nouvel arsenal standard 2038 (p.23)', () => {
    expect(NOUVEL_ARSENAL_2038).toHaveLength(5);
    const noms = NOUVEL_ARSENAL_2038.map((a) => a.nom.toLowerCase());
    expect(noms.some((n) => n.includes('sonique'))).toBe(true);
    expect(noms.some((n) => n.includes('canon uv'))).toBe(true);
    // Canon UV rare, les autres avancé
    expect(NOUVEL_ARSENAL_2038.find((a) => a.nom.toLowerCase().includes('canon uv'))?.accessibilite).toBe('rare');
    // stats digest : fusil sonique 4D6/4D6 courte
    const sonique = NOUVEL_ARSENAL_2038.find((a) => a.nom.toLowerCase().includes('sonique'))!;
    expect(sonique.degats.nombre).toBe(4);
    expect(sonique.violence.nombre).toBe(4);
  });

  it('34 modules de prestige par blason (tableau pp.26-33), aucun slot', () => {
    expect(MODULES_PRESTIGE.length).toBe(34);
    const blasons = new Set(MODULES_PRESTIGE.map((m) => m.blason));
    expect(blasons.size).toBe(12); // ours, serpent, dragon, faucon, sanglier, cheval, aigle, cerf, corbeau, lion, taureau, loup
    for (const m of MODULES_PRESTIGE) {
      expect(m.coutPG).toBeGreaterThan(0);
      expect(m.page).toMatch(/2038 p\.\d+/);
    }
  });

  it('compte global : 45 armes + 90 modules (40+5, 57+33)', () => {
    expect(armesArsenal.length).toBe(40);
    expect(ARMES_PRESTIGE.length).toBe(7);
    expect(NOUVEL_ARSENAL_2038.length).toBe(5); // 40+5 armes
    expect(catalogueModules.length).toBe(57);
    expect(MODULES_PRESTIGE.length).toBe(34); // 57+34 modules (tableau digest pp.26-33)
    expect(RELIQUES_ESPOIR.length).toBe(3);
  });
});
