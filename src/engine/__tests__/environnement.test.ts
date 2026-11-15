/**
 * Tests moteur — dégâts environnementaux (règle p.92). Dés injectés.
 */
import { describe, expect, it } from 'vitest';
import { apneeSecondes, degatsAccident, degatsChute, degatsFeu, degatsNoyade, degatsToxique } from '../environnement';

/** rand qui produit séquentiellement les faces 1..6 puis répète */
function seq(...faces: number[]): () => number {
  let i = 0;
  return () => {
    const f = faces[i % faces.length]!;
    i++;
    return (f - 1) / 6;
  };
}
/** rand constant : toujours la face f */
function constant(f: number): () => number {
  return () => (f - 1) / 6;
}

describe('Chute — règle p.92', () => {
  it('en méta-armure : ≤ 10 m rien', () => {
    expect(degatsChute(10, true).total).toBe(0);
  });

  it('en méta-armure : > 10 m → 1D6 par tranche complète de 3 m', () => {
    // 16 m → (16−10)/3 = 2 tranches
    const r = degatsChute(16, true, seq(3, 4));
    expect(r.des).toHaveLength(2);
    expect(r.total).toBe(7);
  });

  it('sans méta-armure : 1D6 par tranche de 3 m dès le départ', () => {
    const r = degatsChute(9, false, constant(2));
    expect(r.des).toHaveLength(3);
    expect(r.total).toBe(6);
  });

  it('chute > 20 m sans méta-armure : agonie automatique signalée', () => {
    const r = degatsChute(24, false, constant(2));
    expect(r.notes.some((n) => n.includes('agonie automatique'))).toBe(true);
  });

  it('tranche incomplète : pas de dé supplémentaire', () => {
    // 13 m en armure → (13−10)/3 = 1 tranche complète (2 m ignorés)
    const r = degatsChute(13, true, constant(3));
    expect(r.des).toHaveLength(1);
    // 12 m en armure → (12−10)/3 = 0 tranche complète
    expect(degatsChute(12, true, constant(3)).des).toHaveLength(0);
  });
});

describe('Feu — règle p.92', () => {
  it('1D6 par tour hors méta-armure, blessure « brûlé vif » notée', () => {
    const r = degatsFeu(false, constant(5));
    expect(r.total).toBe(5);
    expect(r.notes.some((n) => n.includes('brûlé vif'))).toBe(true);
  });

  it('méta-armure immunisée aux incendies (0 dégât, note explicite)', () => {
    const r = degatsFeu(true, constant(5));
    expect(r.total).toBe(0);
    expect(r.notes.some((n) => n.includes('lance-flammes'))).toBe(true);
  });
});

describe('Noyade — règle p.92', () => {
  it('apnée = 20 × Endurance secondes', () => {
    expect(apneeSecondes(4)).toBe(80);
  });

  it('dans la fenêtre apnée : aucun dégât', () => {
    expect(degatsNoyade(80, 4, constant(2)).total).toBe(0);
  });

  it('après l\u2019apnée : 1D6 toutes les 10 s', () => {
    // Endurance 4 → apnée 80 s ; 110 s → (110−80)/10 = 3 tours
    const r = degatsNoyade(110, 4, constant(2));
    expect(r.des).toHaveLength(3);
    expect(r.total).toBe(6);
  });

  it('fenêtre partielle (< 10 s) : pas de dé', () => {
    expect(degatsNoyade(85, 4, constant(2)).des).toHaveLength(0);
  });
});

describe('Gaz / poisons / maladies — règle p.92', () => {
  it('virulence faible : 1 à 3 dés', () => {
    const r = degatsToxique('faible', seq(6, 6, 6)); // bonus 3 dés (max)
    expect(r.des).toHaveLength(3);
  });

  it('virulence moyenne : 4 à 6 dés', () => {
    const r = degatsToxique('moyenne', constant(6));
    expect(r.des).toHaveLength(6);
  });

  it('virulence forte : 7 à 9 dés', () => {
    const r = degatsToxique('forte', constant(6));
    expect(r.des).toHaveLength(9);
  });

  it('agonie par poison : le MJ choisit la blessure (pas de tirage)', () => {
    const r = degatsToxique('forte', constant(1));
    expect(r.notes.some((n) => n.includes('MJ choisit'))).toBe(true);
  });
});

describe('Accident de véhicule — règle p.92', () => {
  it('1 à 5D6, multiplié par la vitesse en mouvement', () => {
    // rand seq: premier appel → 5 dés (rand 4/6 → 1+3=4? careful: nombreDes = 1 + floor(rand*5))
    // constant(4) → rand 3/6=0.5 → floor(2.5)=2 → 3 dés ; dés = 2,2,2 → 6 ; vitesse 3 → 18
    const r = degatsAccident(3, true, constant(4));
    expect(r.des).toHaveLength(3);
    expect(r.total).toBe(36); // (4+4+4) × vitesse 3
  });

  it('véhicule immobile : pas de multiplication', () => {
    const r = degatsAccident(3, false, constant(4));
    expect(r.total).toBe(12); // (4+4+4) sans multiplication
  });
});
