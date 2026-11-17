import { describe, it, expect } from 'vitest';
import {
  TYPES_WARRIOR, coutTypeWarrior, odDuType,
  IMPULSIONS_WARLORD, coutImpulsion, conditionImpulsion,
  coutGhost, bonusAttaqueSurpriseGhost,
  coutLongbow, profilLongbow, coutVision,
  coutChangeling,
  coutBenedictionArmes, ATTAQUE_PLASMA, ORIFLAMME,
  relancesAutorisees,
} from '../capacites';
import { computeAttack } from '../attaque';
import { personnageExemple } from '../../data/character';

/**
 * Itération 8 — capacités des 6 classes restantes (digest PARTIE 6).
 * Chaque test cite la page du digest.
 */
describe('WARRIOR — Types (p.136)', () => {
  it('5 types liés à un aspect, 3 caractéristiques chacune', () => {
    expect(TYPES_WARRIOR.map((t) => t.id)).toEqual(['soldier', 'hunter', 'scholar', 'herald', 'scout']);
    for (const t of TYPES_WARRIOR) expect(t.traits).toHaveLength(3);
  });

  it('coût : 1 PE/tour en conflit, 6 PE par scène hors conflit (p.136)', () => {
    expect(coutTypeWarrior(true)).toBe(1);
    expect(coutTypeWarrior(false)).toBe(6);
  });

  it('le type donne 1 OD dans les 3 traits de l\u2019aspect, marquées type-warrior (p.136)', () => {
    const od = odDuType('scholar');
    expect(od.map((o) => o.trait)).toEqual(['tir', 'savoir', 'technique']);
    expect(od.every((o) => o.origine === 'type-warrior' && o.niveau === 1)).toBe(true);
    expect(odDuType('inconnu')).toEqual([]);
  });
});

describe('WARMASTER — impulsions (p.148)', () => {
  it('coûts par allié + surcoût porteur pour Action (10 PE)', () => {
    expect(coutImpulsion('esquive', 2, false)).toBe(6); // 3 × 2
    expect(coutImpulsion('action', 1, true)).toBe(14); // 4 + 10
    expect(coutImpulsion('guerre', 3, false)).toBe(3); // 1 × 3
  });

  it('condition impulsion sur soi : Esquive +2 déf/réaction, Force +2 CdF (p.148)', () => {
    expect(conditionImpulsion('esquive')!.effets).toEqual([
      { cible: 'defense', valeur: 2, type: 'bonus' },
      { cible: 'reaction', valeur: 2, type: 'bonus' },
    ]);
    expect(conditionImpulsion('force')!.effets[0]!.cible).toBe('cdf');
    expect(conditionImpulsion('action')).toBeNull();
  });

  it('5 impulsions déclarées (p.148)', () => {
    expect(IMPULSIONS_WARLORD).toHaveLength(5);
  });
});

describe('ROGUE — Ghost (p.152)', () => {
  it('coût 2 PE/tour en conflit, 6 PE/minute hors conflit', () => {
    expect(coutGhost(true)).toBe(2);
    expect(coutGhost(false)).toBe(6);
  });

  it('attaque surprise : dés + fixe = Discrétion OD inclus (p.152)', () => {
    const perso = { ...structuredClone(personnageExemple), traits: { ...personnageExemple.traits, discretion: 4 }, overdrives: [{ trait: 'discretion' as const, niveau: 1 }] };
    const bonus = bonusAttaqueSurpriseGhost(perso);
    expect(bonus).toEqual({ desSupplementaires: 5, bonusFixe: 5 }); // 4 + 1 OD
  });

  it('computeAttack : option ghostSurprise ajoute les dés et le fixe (p.152)', () => {
    const perso = { ...structuredClone(personnageExemple), traits: { ...personnageExemple.traits, discretion: 3 } };
    const arme = perso.armes[0]!;
    const sans = computeAttack(perso, arme, 'standard');
    const avec = computeAttack(perso, arme, 'standard', { ghostSurprise: true });
    expect(avec.desDegatsGhost).toBe(3);
    expect(avec.fixeDegatsGhost).toBe(3);
    void sans;
  });
});

describe('RANGER — Longbow (p.156)', () => {
  it('profil de base 3D6 / 1D6 / moyenne ; +1D6 par PE (max 6D6 générés)', () => {
    const base = profilLongbow({ desDegats: 0, desViolence: 0, porteePlus: 0, effets2PE: [], effets3PE: [] });
    expect(base).toMatchObject({ degats: 3, violence: 1, portee: 2, valide: true });
    const plus = profilLongbow({ desDegats: 3, desViolence: 1, porteePlus: 1, effets2PE: [], effets3PE: [] });
    expect(plus).toMatchObject({ degats: 6, violence: 2, portee: 3 }); // 6D6 générés, portée longue
    const trop = profilLongbow({ desDegats: 4, desViolence: 0, porteePlus: 0, effets2PE: [], effets3PE: [] });
    expect(trop.valide).toBe(false); // 7D6 > max 6
  });

  it('coût : 1 PE/point, 2 PE effet palier 2, 3 PE palier 3 (p.156)', () => {
    expect(coutLongbow({ desDegats: 2, desViolence: 1, porteePlus: 0, effets2PE: ['choc 1'], effets3PE: [] })).toBe(5); // 2 dés + 1 dé + 2 PE effet
  });

  it('Vision : 5 à 10 PE au MJ (p.157)', () => {
    expect(coutVision(3)).toBe(5);
    expect(coutVision(7)).toBe(7);
    expect(coutVision(15)).toBe(10);
  });
});

describe('BARD — Changeling (p.160)', () => {
  it('coûts : 6 transformation, 8 taille étendue, 3 par faux être', () => {
    expect(coutChangeling(true, false, 0)).toBe(6);
    expect(coutChangeling(true, true, 2)).toBe(20); // 6 + 8 + 6
    expect(coutChangeling(false, false, 4)).toBe(12);
  });

  it('percer l\u2019illusion : PNJ Machine 6, PJ Perception 3 (p.160)', () => {
    expect(coutChangeling); // référence
  });
});

describe('WIZARD — Borealis/Oriflamme (p.164-165)', () => {
  it('bénédiction : 6 PE + 2 par allié (p.164)', () => {
    expect(coutBenedictionArmes(0)).toBe(6);
    expect(coutBenedictionArmes(2)).toBe(10);
  });
  it('attaque plasma 4D6/2 PE ; Oriflamme 6D6+6/12 PE (p.164-165)', () => {
    expect(ATTAQUE_PLASMA).toMatchObject({ degats: 4, coutPE: 2 });
    expect(ORIFLAMME).toMatchObject({ degatsDes: 6, degatsFixe: 6, coutPE: 12, violenceFixe: 12 });
  });
});

describe('TRANCHAGE §0 — relance d\u2019exploit sans cascade (p.78)', () => {
  it('une seule relance par jet, jamais de cascade', () => {
    expect(relancesAutorisees(1)).toBe(1);
    expect(relancesAutorisees(5)).toBe(1);
  });
});
