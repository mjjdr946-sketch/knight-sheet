/**
 * Tests des données — cohérence avec les tranchages validés (prompt v4 §0).
 */
import { describe, expect, it } from 'vitest';
import { paladin } from '../meta-armor';
import { personnageExemple } from '../character';
import type { AspectId, TraitId } from '../../types/character';

/** Aspect de chaque caractéristique (p.110) */
const ASPECT_DU_TRAIT: Record<TraitId, AspectId> = {
  deplacement: 'chair', force: 'chair', endurance: 'chair',
  hargne: 'bete', combat: 'bete', instinct: 'bete',
  tir: 'machine', savoir: 'machine', technique: 'machine',
  aura: 'dame', parole: 'dame', sangfroid: 'dame',
  discretion: 'masque', dexterite: 'masque', perception: 'masque',
};

describe('Tranchage v4 §0.1 — OD de base Paladin (p.138)', () => {
  it('4 OD de base, chacun dans un aspect DIFFÉRENT', () => {
    const aspects = paladin.overdrivesDeBase.map((od) => ASPECT_DU_TRAIT[od.trait]);
    expect(new Set(aspects).size).toBe(4); // 4 aspects distincts
    expect(paladin.overdrivesDeBase).toHaveLength(4);
    expect(paladin.overdrivesDeBase.every((od) => od.niveau === 1)).toBe(true);
  });

  it("Tir est Machine et Perception est Masque (jamais Dame — correction du digest)", () => {
    const tir = ASPECT_DU_TRAIT.tir;
    const perception = ASPECT_DU_TRAIT.perception;
    expect(tir).toBe('machine');
    expect(perception).toBe('masque');
  });

  it("le personnage d'exemple respecte le même tranchage", () => {
    const aspects = personnageExemple.overdrives.map((od) => ASPECT_DU_TRAIT[od.trait]);
    expect(new Set(aspects).size).toBe(4);
  });
});

describe('Tranchage v4 §0.2 — dérivées « au choix » (p.88)', () => {
  it("l'exemple porte des choix explicites pour les 4 dérivées", () => {
    expect(personnageExemple.choixDerivees.defense).toBeDefined();
    expect(personnageExemple.choixDerivees.reaction).toBeDefined();
    expect(personnageExemple.choixDerivees.initiative).toBeDefined();
    expect(personnageExemple.choixDerivees.sante).toBeDefined();
  });
});
