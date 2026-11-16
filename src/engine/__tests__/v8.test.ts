import { describe, it, expect } from 'vitest';
import { computeDerived } from '../stats';
import { personnageExemple } from '../../data/character';

describe('DOCUMENT 3 + v8 : Goliath / XP / scellement', () => {
  it('Goliath +1 m : réaction −2, défense −1 (p.168)', () => {
    const base = computeDerived(personnageExemple);
    const goliath = computeDerived({ ...personnageExemple, goliathMetres: 1 });
    expect(goliath.reaction).toBe(base.reaction - 2);
    expect(goliath.defense).toBe(base.defense - 1);
  });

  it('Goliath 6 m : réaction plafonnée à 0 (min 0)', () => {
    const goliath = computeDerived({ ...personnageExemple, goliathMetres: 6 });
    expect(goliath.reaction).toBe(Math.max(0, computeDerived(personnageExemple).reaction - 12));
  });

  it('cdfGoliath exposé au simulateur (+1 CdF/m, p.168)', () => {
    expect(computeDerived({ ...personnageExemple, goliathMetres: 3 }).cdfGoliath).toBe(3);
    expect(computeDerived(personnageExemple).cdfGoliath).toBe(0);
  });
});
