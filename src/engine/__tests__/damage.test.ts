/**
 * Tests de résolution des dégâts — une règle = un test, page citée.
 */
import { describe, expect, it } from 'vitest';
import { personnageExemple } from '../../data/character';
import type { Character } from '../../types/character';
import { applyDamage } from '../damage';

function clone(character: Character): Character {
  return structuredClone(character);
}

describe('Champ de force — règle p.130', () => {
  it('le CdF se retranche de chaque score de dégâts (ex. CdF 10 vs 12 → 2)', () => {
    // exemple du digest p.131 — CdF 8 (armure) + 2 (module cumulable) = 10
    const perso = clone(personnageExemple);
    perso.conditions.push({
      id: 'cdf-plus2',
      nom: 'Champ renforcé',
      categorie: 'autre',
      description: '',
      effets: [{ source: 'Champ renforcé', target: 'cdf', valeur: 2, type: 'bonus' }],
      permanente: false,
    });
    const r = applyDamage(perso, { degats: 12 });
    expect(r.degatsApresCdF).toBe(2);
  });

  it('total ramené à 0 → aucun dégât (ni PA ni PS)', () => {
    const perso = clone(personnageExemple); // CdF 8
    const r = applyDamage(perso, { degats: 8 });
    expect(r.degatsApresCdF).toBe(0);
    expect(r.degatsSurPA).toBe(0);
    expect(r.degatsSurPS).toBe(0);
    expect(r.nouvellesJauges).toEqual({ pa: 120, ps: 39 });
  });

  it('pénétrant X : X de CdF ignorés (annexe)', () => {
    const perso = clone(personnageExemple); // CdF 8
    const r = applyDamage(perso, { degats: 10, penetrant: 5 });
    expect(r.degatsApresCdF).toBe(7); // 10 − (8−5)
  });

  it('pénétrant X ≥ CdF : CdF totalement ignoré (annexe)', () => {
    const perso = clone(personnageExemple);
    const r = applyDamage(perso, { degats: 10, penetrant: 20 });
    expect(r.degatsApresCdF).toBe(10);
  });

  it('ignore CdF : les dégâts touchent les PA directement (p.130)', () => {
    const perso = clone(personnageExemple);
    const r = applyDamage(perso, { degats: 7, ignoreCdF: true });
    expect(r.degatsApresCdF).toBe(7);
  });
});

describe('PA et « secousse » — règle p.130', () => {
  it('exemple du livre : 7 dégâts sur les PA → 1 PS perdu + 2 restants', () => {
    // p.130 : "Ex. : 7 dégâts sur les PA → 1 PS perdu + 2 restants sur l'armure"
    const perso = clone(personnageExemple); // PA 120, PS 39
    perso.jauges.pa = { current: 10 };
    const r = applyDamage(perso, { degats: 7, ignoreCdF: true });
    expect(r.degatsSurPA).toBe(7);
    expect(r.psPerdusTranche).toBe(1);
    expect(r.nouvellesJauges.pa).toBe(3);
    expect(r.nouvellesJauges.ps).toBe(38); // 39 − 1
  });

  it('dégâts dépassant les PA : le surplus touche les PS (p.130)', () => {
    const perso = clone(personnageExemple);
    perso.jauges.pa = { current: 5 };
    const r = applyDamage(perso, { degats: 8, ignoreCdF: true });
    expect(r.degatsSurPA).toBe(5);
    expect(r.degatsSurPS).toBe(3);
    expect(r.psPerdusTranche).toBe(1); // 1 tranche complète de 5 sur les PA
    expect(r.nouvellesJauges.pa).toBe(0);
    expect(r.nouvellesJauges.ps).toBe(35); // 39 − 3 − 1
  });

  it('tranche incomplète : pas de PS perdu (4 dégâts sur PA → 0 PS)', () => {
    const perso = clone(personnageExemple);
    perso.jauges.pa = { current: 10 };
    const r = applyDamage(perso, { degats: 4, ignoreCdF: true });
    expect(r.psPerdusTranche).toBe(0);
  });

  it('ignore armure : santé touchée directement (p.130) — le CdF s\'applique toujours', () => {
    // 14 dégâts − CdF 8 = 6 ; PA ignorés → 6 directement sur les PS
    const perso = clone(personnageExemple);
    const r = applyDamage(perso, { degats: 14, ignoreArmure: true });
    expect(r.nouvellesJauges.ps).toBe(33); // 39 − 6
    expect(r.nouvellesJauges.pa).toBe(120); // intacts
  });

  it('perce armure X : X de PA ignorés (annexe ; ex. marteau-épieu perce 40)', () => {
    // 14 dégâts − CdF 8 = 6 ; PA effectifs 10 (50 − 40) → 6 absorbés, 1 tranche → 1 PS
    const perso = clone(personnageExemple);
    perso.jauges.pa = { current: 50 };
    const r = applyDamage(perso, { degats: 14, perceArmure: 40 });
    expect(r.degatsSurPA).toBe(6);
    expect(r.psPerdusTranche).toBe(1);
    // seuls les dégâts absorbés (6) réduisent la jauge ; les 40 "ignorés" restent
    expect(r.nouvellesJauges.pa).toBe(44);
  });
});

describe('Infatigable — lame I, p.122', () => {
  it('pas de PS perdus pour dégâts à l\'armure (tranche de 5)', () => {
    const perso = clone(personnageExemple);
    perso.identite.cartes.push({
      numero: 'I',
      nom: 'Le Bateleur',
      aspect: 'dame',
      avantagesRetenus: ['Infatigable : pas de PS perdus pour dégâts à l\'armure (1 PS/tranche de 5 PA)'],
      effets: [],
    });
    perso.jauges.pa = { current: 30 };
    const r = applyDamage(perso, { degats: 12, ignoreCdF: true });
    expect(r.psPerdusTranche).toBe(0); // au lieu de 2
    expect(r.nouvellesJauges.ps).toBe(39);
  });
});

describe('Colosses — règle p.103', () => {
  it('tranches complètes de 10 dégâts : 25 dégâts → 2 PS perdus, 5 ignorés', () => {
    // exemple du digest p.103
    const perso = clone(personnageExemple);
    perso.jauges.pa = { current: 100 };
    const r = applyDamage(perso, { degats: 25, ignoreCdF: true, colosse: true });
    expect(r.psPerdusTranche).toBe(2);
  });
});

describe('À 0 PA — règle p.130', () => {
  it("l'armure se folde automatiquement (flag retourné au store)", () => {
    const perso = clone(personnageExemple);
    perso.jauges.pa = { current: 6 };
    const r = applyDamage(perso, { degats: 6, ignoreCdF: true });
    expect(r.nouvellesJauges.pa).toBe(0);
    expect(r.armureFoldedAuto).toBe(true);
  });

  it('à 0 PA de Guardian, son CdF reste applicable (p.130)', () => {
    // le CdF du personnage foldé (Guardian 5) continue de s'appliquer
    const perso = clone(personnageExemple);
    perso.armureDeployee = false;
    perso.jauges.pa = { current: 1 };
    perso.jauges.cdf = { current: 5 };
    const r = applyDamage(perso, { degats: 3 }); // CdF Guardian 5 actif
    expect(r.degatsApresCdF).toBe(0);
    expect(r.nouvellesJauges.pa).toBe(1); // intact
  });
});
