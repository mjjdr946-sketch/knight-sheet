/**
 * Tests moteur — héroïsme (p.96-97) et test d'espoir (p.96).
 */
import { describe, expect, it } from 'vitest';
import { appliquerTestEspoir, depenserHeroisme, gagnerHeroisme, revenirDuDesespoir } from '../heroisme';
import { personnageExemple } from '../../data/character';
import type { Character } from '../../types/character';

function clone(c: Character): Character {
  return structuredClone(c);
}

describe('Usages d\u2019héroïsme — règle p.96-97', () => {
  it('usage 1 (ignorer agonie) : conserve 1 PS exactement', () => {
    const c = clone(personnageExemple);
    c.jauges.heroisme.current = 2;
    const r = depenserHeroisme(c, 'ignorer-agonie');
    expect(r.ok).toBe(true);
    expect(r.heroisme).toBe(1);
    expect(r.ps).toBe(1);
  });

  it('usage 2 (garder espoir) : conserve 1 PEs exactement', () => {
    const c = clone(personnageExemple);
    c.jauges.heroisme.current = 1;
    const r = depenserHeroisme(c, 'garder-espoir');
    expect(r.pes).toBe(1);
    expect(r.heroisme).toBe(0);
  });

  it('usages 3/4/5 : coût 1, pas de modification de jauge', () => {
    const c = clone(personnageExemple);
    c.jauges.heroisme.current = 3;
    for (const usage of ['relancer-jet', 'degats-maximum', 'combo-supplementaire'] as const) {
      const r = depenserHeroisme(c, usage);
      expect(r.ok).toBe(true);
      expect(r.ps).toBeUndefined();
      expect(r.pes).toBeUndefined();
    }
  });

  it('cartes du destin : coût de 3 points (p.97, optionnel)', () => {
    const c = clone(personnageExemple);
    c.jauges.heroisme.current = 4;
    const r = depenserHeroisme(c, 'carte-destin');
    expect(r.ok).toBe(true);
    expect(r.heroisme).toBe(1);
  });

  it('héroïsme insuffisant : refus avec raison', () => {
    const c = clone(personnageExemple); // 0 héroïsme
    const r = depenserHeroisme(c, 'ignorer-agonie');
    expect(r.ok).toBe(false);
    expect(r.raison).toContain('insuffisant');
  });

  it('gain borné au max de 6 (p.96)', () => {
    const c = clone(personnageExemple);
    c.jauges.heroisme.current = 5;
    expect(gagnerHeroisme(c, 3)).toBe(6);
  });
});

describe('Test d\u2019espoir — règle p.96', () => {
  it('réussite : aucune perte de PEs', () => {
    const r = appliquerTestEspoir(personnageExemple, true, 4);
    expect(r.perte).toBe(0);
    expect(r.pes).toBe(55);
  });

  it('échec : −1D6 PEs (dé injecté)', () => {
    const r = appliquerTestEspoir(personnageExemple, false, 3);
    expect(r.perte).toBe(3);
    expect(r.pes).toBe(52);
  });
});

describe('Revenir du désespoir — règle p.96', () => {
  it('à 0 PEs : 1 point d\u2019héroïsme ramène à 1 PEs, sans action', () => {
    const c = clone(personnageExemple);
    c.jauges.pes.current = 0;
    c.jauges.heroisme.current = 2;
    const r = revenirDuDesespoir(c);
    expect(r.ok).toBe(true);
    expect(r.pes).toBe(1);
    expect(r.heroisme).toBe(1);
  });
});
