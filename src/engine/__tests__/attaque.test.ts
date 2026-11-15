/**
 * Tests moteur — préparation d'attaque (règles p.76-89).
 */
import { describe, expect, it } from 'vitest';
import { computeAttack, desDegatsTouche } from '../attaque';
import { personnageExemple } from '../../data/character';
import type { Character } from '../../types/character';

function clone(c: Character): Character {
  return structuredClone(c);
}

describe('Nombre de dés = base + combo — p.76-78', () => {
  it('arme de contact : base Combat + combo Force (3 + 3 = 6 dés)', () => {
    const marteau = personnageExemple.armes.find((a) => a.id === 'marteau-epieu')!;
    const prep = computeAttack(personnageExemple, marteau, 'standard');
    expect(prep.base).toBe('combat');
    expect(prep.combo).toBe('force');
    expect(prep.nbDes).toBe(6); // Combat 3 + Force 3
  });

  it('arme de tir : base Tir seul par défaut (4 dés)', () => {
    const fusil = personnageExemple.armes.find((a) => a.id === 'fusil-assaut')!;
    const prep = computeAttack(personnageExemple, fusil, 'standard');
    expect(prep.base).toBe('tir');
    expect(prep.combo).toBeNull();
    expect(prep.nbDes).toBe(4);
  });

  it('combo de tir surchargé via les options', () => {
    const fusil = personnageExemple.armes.find((a) => a.id === 'fusil-assaut')!;
    const prep = computeAttack(personnageExemple, fusil, 'standard', { comboTrait: 'savoir' });
    expect(prep.nbDes).toBe(6); // Tir 4 + Savoir 2
  });
});

describe('Réussites automatiques des OD — p.130', () => {
  it('contact : OD Force niv 1 → +1 réussite auto', () => {
    const marteau = personnageExemple.armes.find((a) => a.id === 'marteau-epieu')!;
    const prep = computeAttack(personnageExemple, marteau, 'standard');
    expect(prep.reussitesAuto).toBe(1); // OD force 1
  });

  it('tir : OD Tir niv 1 → +1 réussite auto', () => {
    const fusil = personnageExemple.armes.find((a) => a.id === 'fusil-assaut')!;
    const prep = computeAttack(personnageExemple, fusil, 'standard');
    expect(prep.reussitesAuto).toBe(1); // OD tir 1
  });
});

describe('Modificateurs de style — p.87-89', () => {
  const marteau = personnageExemple.armes.find((a) => a.id === 'marteau-epieu')!;

  it('Agressif : +3 dés', () => {
    const prep = computeAttack(personnageExemple, marteau, 'agressif');
    expect(prep.bonusDesStyle).toBe(3);
    expect(prep.nbDes).toBe(9); // 6 + 3
  });

  it('Défensif : −3 dés', () => {
    const prep = computeAttack(personnageExemple, marteau, 'defensif');
    expect(prep.malusDesStyle).toBe(3);
    expect(prep.nbDes).toBe(3);
  });

  it('Précis : 3ᵉ caractéristique ajoutée, OD de ce trait ignorées (p.88)', () => {
    const c = clone(personnageExemple);
    c.overdrives.push({ trait: 'instinct', niveau: 2 }); // devrait donner +2 si compté
    const epee = personnageExemple.armes.find((a) => a.id === 'marteau-epieu')!;
    const prep = computeAttack(c, epee, 'precis', { troisiemeTrait: 'instinct' });
    expect(prep.nbDes).toBe(8); // 6 + Instinct 2, SANS les 2 réussites auto de l'OD
    expect(prep.reussitesAuto).toBe(1); // OD force seule
  });

  it('Puissant : sacrifice de dés toucher → dégâts (max 6, p.89)', () => {
    const prep = computeAttack(personnageExemple, marteau, 'puissant', { sacrificeDes: 3 });
    expect(prep.desSacrifies).toBe(3);
    expect(prep.nbDes).toBe(3); // 6 − 3
  });

  it('sacrifice borné à 6', () => {
    const prep = computeAttack(personnageExemple, marteau, 'puissant', { sacrificeDes: 9 });
    expect(prep.desSacrifies).toBe(6);
  });

  it('Pilonnage : −2 dés d\u2019attaque, cumul de dégâts borné à +6 (p.89)', () => {
    const fusil = personnageExemple.armes.find((a) => a.id === 'fusil-assaut')!;
    const prep = computeAttack(personnageExemple, fusil, 'pilonnage', { pileDegats: 9 });
    expect(prep.malusDesStyle).toBe(2);
    expect(prep.desDegatsPile).toBe(6);
    expect(prep.nbDes).toBe(2); // 4 − 2
  });
});

describe('Dés de dégâts sur touche', () => {
  it('profil de l\u2019arme + pile Pilonnage + sacrifices Puissant', () => {
    const marteau = personnageExemple.armes.find((a) => a.id === 'marteau-epieu')!;
    const prep = computeAttack(personnageExemple, marteau, 'puissant', { sacrificeDes: 2, pileDegats: 1 });
    const d = desDegatsTouche(marteau, prep);
    // profil principal du marteau : 3D6 + force → fixe numérique 0 (Force affichée à part)
    expect(d.nombreDes).toBe(3 + 1 + 2);
    expect(d.fixe).toBe(0);
  });
});
