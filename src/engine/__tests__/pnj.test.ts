/**
 * Tests moteur — PNJ / adversaires (digest PARTIE 2, pp.100-104).
 */
import { describe, expect, it } from 'vitest';
import { debordementCumule, initiativePNJ, masquerValeurs, seuilEffectif, subirDegatsPNJ, type Adversaire } from '../pnj';

const salopard: Adversaire = {
  id: 'adv1', nom: 'Salopard', type: 'salopard',
  defense: 5, reaction: 4, pa: 30, ps: 20, cdf: 6,
  pointsFaibles: ['combat'],
};

describe('Points faibles — règle p.103', () => {
  it('attaque avec la caractéristique du point faible : défense ÷2 (arrondi inf.)', () => {
    expect(seuilEffectif(salopard, 'combat', false)).toBe(2); // 5/2 = 2.5 → 2
    expect(seuilEffectif(salopard, 'combat', true)).toBe(2); // réaction 4/2 = 2
  });

  it('sans point faible : seuil normal', () => {
    expect(seuilEffectif(salopard, 'tir', false)).toBe(5);
    expect(seuilEffectif(salopard, 'force', false)).toBe(5);
  });

  it('une seule division même si plusieurs points faibles cumulés', () => {
    const adv: Adversaire = { ...salopard, pointsFaibles: ['combat', 'force'] };
    expect(seuilEffectif(adv, 'combat', false)).toBe(2); // pas ÷4
  });
});

describe('Dégâts sur PNJ — PA puis PS, bouclier p.100/103', () => {
  it('le bouclier/CdF se retranche d\u2019abord', () => {
    const r = subirDegatsPNJ(salopard, 10);
    // 10 − CdF 6 = 4 → PA 30→26
    expect(r.apresCdf).toBe(4);
    expect(r.pa).toBe(26);
    expect(r.ps).toBe(20);
  });

  it('ignore CdF : les PA touchent directement', () => {
    const r = subirDegatsPNJ(salopard, 10, { ignoreCdf: true });
    expect(r.apresCdf).toBe(10);
    expect(r.pa).toBe(20);
  });

  it('dégâts dépassant les PA touchent les PS', () => {
    const r = subirDegatsPNJ(salopard, 40, { ignoreCdf: true });
    expect(r.degatsSurPA).toBe(30);
    expect(r.degatsSurPS).toBe(10); // 40 − 30
    expect(r.ps).toBe(10);
  });

  it('PNJ pas détruit s\u2019il lui reste des PS après les PA', () => {
    const r = subirDegatsPNJ({ ...salopard, pa: 5 }, 10, { ignoreCdf: true });
    expect(r.pa).toBe(0);
    expect(r.ps).toBe(15); // 20 − 5
    expect(r.detruit).toBe(false);
  });

  it('certains PNJ n\u2019ont que des PA : pas de PS à réduire', () => {
    const drone: Adversaire = { ...salopard, ps: undefined, pa: 10, cdf: 0 };
    const r = subirDegatsPNJ(drone, 12, { ignoreCdf: true });
    expect(r.pa).toBe(0);
    expect(r.ps).toBeUndefined();
    expect(r.detruit).toBe(true);
  });
});

describe('Colosses — règle p.103 : tranches complètes de 10', () => {
  const colosse: Adversaire = { ...salopard, type: 'colosse', pa: 50, ps: 40, cdf: 0 };

  it('exemple du livre : 25 dégâts → 2 perdus, 5 ignorés', () => {
    const r = subirDegatsPNJ(colosse, 25, { ignoreCdf: true });
    expect(r.degatsIgnoresTranche).toBe(5);
    expect(r.degatsSurPA).toBe(2); // 2 POINTS perdus sur les PA
    expect(r.pa).toBe(48);
  });

  it('anti-véhicule : dégâts normaux sans tranches (compense, p.103)', () => {
    const r = subirDegatsPNJ(colosse, 25, { ignoreCdf: true, antiVehicule: true });
    expect(r.degatsIgnoresTranche).toBe(0);
    expect(r.pa).toBe(25); // 50 − 25
  });

  it('le surplus des tranches touche les PS une fois les PA à zéro', () => {
    const r = subirDegatsPNJ({ ...colosse, pa: 0 }, 25, { ignoreCdf: true });
    expect(r.degatsSurPS).toBe(2); // 2 PS perdus
    expect(r.ps).toBe(38);
  });
});

describe('Bandes — règle p.100 : cohésion / débordement', () => {
  const bande: Adversaire = {
    id: 'b1', nom: 'Bande de pillards', type: 'bande',
    defense: 0, reaction: 0, pa: 0, pointsFaibles: [],
    cohesion: 20, debordement: 8,
  };

  it('les dégâts normaux ne peuvent PAS baisser la cohésion', () => {
    const r = subirDegatsPNJ(bande, 30, { ignoreCdf: true });
    expect(r.cohesion).toBe(20);
    expect(r.cohésionPerdue).toBe(0);
  });

  it('seule la VIOLENCE fait baisser la cohésion', () => {
    const r = subirDegatsPNJ(bande, 0, { violence: 12 });
    expect(r.cohesion).toBe(8);
    expect(r.cohésionPerdue).toBe(12);
  });

  it('cohésion à 0 → bande en fuite ou anéantie (p.100)', () => {
    const r = subirDegatsPNJ(bande, 0, { violence: 25 });
    expect(r.bandeDefaite).toBe(true);
  });

  it('débordement cumulé chaque tour : 8, puis 16, puis 24 (p.100)', () => {
    expect(debordementCumule(bande, 1)).toBe(8);
    expect(debordementCumule(bande, 2)).toBe(16);
    expect(debordementCumule(bande, 3)).toBe(24);
  });

  it('initiative des bandes : toujours 1 (p.100)', () => {
    expect(initiativePNJ(bande, 15)).toBe(1);
  });

  it('autres PNJ : initiative = jet + score (saisi dans le panneau)', () => {
    expect(initiativePNJ(salopard, 15)).toBe(15);
  });
});

describe('Mode MJ — le MJ ne révèle pas défense/réaction (p.86)', () => {
  it('masquerValeurs : flag sans toucher aux valeurs réelles', () => {
    const m = masquerValeurs(salopard);
    expect(m.modeMj).toBe(true);
    expect(m.defense).toBe(5); // conservé pour les calculs
  });
});
