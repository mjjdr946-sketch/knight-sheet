/**
 * Tests — paliers d'OD (annexe overdrives) + implant/thérapie (p.91).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { combatLaMort, perteReduiteEspritAcier } from '../heroisme';
import { computeDefense, computeInitiative, computePSMax, computeDerived } from '../stats';
import { personnageExemple } from '../../data/character';
import { useCharacterStore } from '../../store/characterStore';
import type { Character } from '../../types/character';

function clone(c: Character): Character {
  return structuredClone(c);
}

describe('Paliers d\u2019OD — annexe overdrives', () => {
  it('OD Endurance niv 3 : +6 PS EN MÉTA-ARMURE (annexe)', () => {
    const c = clone(personnageExemple); // PS 39
    c.overdrives.push({ trait: 'endurance', niveau: 3 });
    expect(computePSMax(c)).toBe(45); // 39 + 6 (armure déployée)
    c.armureDeployee = false;
    expect(computePSMax(c)).toBe(39); // pas d'OD armure foldée
  });

  it('OD Aura niv 5 : ajoute l\u2019Aura à la défense', () => {
    const c = clone(personnageExemple);
    c.overdrives.push({ trait: 'aura', niveau: 5 });
    // Défense Hargne 5 + Aura 4 = 9
    expect(computeDefense(c)).toBe(9);
  });

  it('OD Instinct niv 3 : +3 initiative par niveau d\u2019OD', () => {
    const c = clone(personnageExemple);
    c.overdrives.push({ trait: 'instinct', niveau: 4 });
    // Initiative Perception 4 + OD Perception 1 (exemple) + 3 × 4 (bonus Instinct) = 17
    expect(computeInitiative(c)).toBe(17);
  });

  it('OD Hargne niv 3 : à 0 PS combat la mort (armure déployée)', () => {
    const c = clone(personnageExemple);
    expect(combatLaMort(c)).toBe(false); // pas d'OD Hargne
    c.overdrives.push({ trait: 'hargne', niveau: 3 });
    expect(combatLaMort(c)).toBe(true);
    c.armureDeployee = false;
    expect(combatLaMort(c)).toBe(false); // OD uniquement en armure
  });

  it('Esprit d\u2019acier (lame IX) : perte d\u2019espoir réduite de 1', () => {
    const c = clone(personnageExemple);
    expect(perteReduiteEspritAcier(c, 3)).toBe(3);
    c.identite.cartes.push({
      numero: 'IX', nom: 'L\u2019Ermite', aspect: 'machine',
      avantagesRetenus: ['Esprit d\u2019acier : −1 point d\u2019espoir perdu (toutes sources)'], effets: [],
    });
    expect(perteReduiteEspritAcier(c, 3)).toBe(2);
    expect(perteReduiteEspritAcier(c, 1)).toBe(0);
  });
});

describe('Implant / thérapie — p.91 (store)', () => {
  beforeEach(() => {
    const character = structuredClone(personnageExemple);
    useCharacterStore.setState({
      character,
      derived: computeDerived(character),
      autresFiches: {},
      actifId: 'principal',
    });
  });

  const S = () => useCharacterStore.getState();

  it('poserImplant : retire la blessure, −3 PEs total, max 6', () => {
    // ajouter une blessure
    S().ajouterBlessure({
      id: 'b1', nom: 'Côtes brisées', categorie: 'blessure',
      description: '', effets: [], permanente: true,
    });
    const pesAvant = S().character.jauges.pes.current;
    expect(S().poserImplant('b1')).toBe(true);
    const conditions = S().character.conditions;
    expect(conditions.some((c) => c.nom === 'Côtes brisées')).toBe(false);
    expect(conditions.some((c) => c.nom.startsWith('Implant'))).toBe(true);
    // PEs max recalculé : 55 − 3
    expect(S().derived.pes.max).toBe(pesAvant - 3);
  });

  it('max 6 implants', () => {
    for (let i = 0; i < 6; i++) {
      S().ajouterBlessure({
        id: `b${i}`, nom: `Blessure ${i}`, categorie: 'blessure',
        description: '', effets: [], permanente: true,
      });
      S().poserImplant(`b${i}`);
    }
    S().ajouterBlessure({
      id: 'b7', nom: 'Blessure 7', categorie: 'blessure',
      description: '', effets: [], permanente: true,
    });
    expect(S().poserImplant('b7')).toBe(false); // 6 implants déjà posés
  });

  it('thérapie : efface toutes les blessures (100 PG, p.91)', () => {
    S().ajouterBlessure({
      id: 'b1', nom: 'Pied brisé', categorie: 'blessure',
      description: '', effets: [], permanente: true,
    });
    S().ajouterBlessure({
      id: 'b2', nom: 'Borgne', categorie: 'blessure',
      description: '', effets: [], permanente: true,
    });
    expect(S().therapieReconstruction()).toBe(true);
    expect(S().character.conditions).toHaveLength(0);
  });

  it('thérapie sans blessure : refus', () => {
    expect(S().therapieReconstruction()).toBe(false);
  });

  it('monterNiveauModule : niv 1→2, refus au-delà de 3 (p.428)', () => {
    expect(S().monterNiveauModule('lame-de-bras')).toBe(true);
    expect(S().character.modules.find((m) => m.id === 'lame-de-bras')?.niveau).toBe(2);
  });
});
