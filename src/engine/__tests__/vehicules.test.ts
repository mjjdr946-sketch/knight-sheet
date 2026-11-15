/**
 * Tests — véhicules (annexe pp.447-450 + règles p.104-106).
 */
import { describe, expect, it } from 'vitest';
import { VEHICULES } from '../../data/vehicules';
import { difficulteFrappeVehicule, difficulteSautVehicule, malusPoursuite, psPassagersPerdus, reactionVehicule } from '../vehicules';

describe('Catalogue — annexe pp.447-450', () => {
  it('17 véhicules (10 militaires + 7 civils)', () => {
    expect(VEHICULES).toHaveLength(17);
    expect(VEHICULES.filter((v) => v.categorie === 'militaire')).toHaveLength(10);
    expect(VEHICULES.filter((v) => v.categorie === 'civil')).toHaveLength(7);
  });

  it('profils emblématiques : dropship 500 PA / titan 400 PA / moto steed 30 PA', () => {
    const dropship = VEHICULES.find((v) => v.id === 'dropship')!;
    const titan = VEHICULES.find((v) => v.id === 'titan')!;
    const steed = VEHICULES.find((v) => v.id === 'moto-steed')!;
    expect(dropship.pa).toBe(500);
    expect(titan.pa).toBe(400);
    expect(steed.pa).toBe(30);
    expect(steed.cdf).toBe(0);
  });

  it('tous les véhicules ont une vitesse 0-5 et une manœuvrabilité définie', () => {
    for (const v of VEHICULES) {
      expect(v.vitesse).toBeGreaterThanOrEqual(0);
      expect(v.vitesse).toBeLessThanOrEqual(5);
      expect(typeof v.manoeuvrabilite).toBe('number');
    }
  });
});

describe('Tir sur le véhicule — p.104', () => {
  const vector = VEHICULES.find((v) => v.id === 'vector-combat')!; // manœuvrabilité 0

  it('réaction effective = pilote + manœuvrabilité si en mouvement', () => {
    expect(reactionVehicule(vector, 4, true, true)).toBe(4);
  });

  it('véhicule stationnaire : pas de bonus de manœuvrabilité', () => {
    expect(reactionVehicule(vector, 4, false, true)).toBe(4);
  });

  it('sans pilote : réaction 0 → touché automatiquement', () => {
    expect(reactionVehicule(vector, 4, true, false)).toBe(0);
  });
});

describe('Frapper le véhicule — p.104', () => {
  const moto = VEHICULES.find((v) => v.id === 'moto')!; // vitesse 3

  it('stationnaire : touché automatiquement (null = pas de jet)', () => {
    expect(difficulteFrappeVehicule(moto, false)).toBeNull();
  });

  it('en mouvement : difficulté = 3 × vitesse (moto vitesse 3 → 9)', () => {
    expect(difficulteFrappeVehicule(moto, true)).toBe(9);
  });

  it('vitesse 0 : 1 réussite suffit', () => {
    const immobile = { ...moto, vitesse: 0 };
    expect(difficulteFrappeVehicule(immobile, true)).toBe(1);
  });
});

describe('Sauter sur le véhicule — p.104', () => {
  it('difficulté = 3 × la vitesse', () => {
    const moto = VEHICULES.find((v) => v.id === 'moto')!;
    expect(difficulteSautVehicule(moto)).toBe(9);
  });
});

describe('Passagers — p.104 : tranche de 5 PA perdus = 1 PS', () => {
  it('secousses : 12 PA perdus → 2 PS', () => {
    expect(psPassagersPerdus(12)).toBe(2);
  });

  it('tranche incomplète : pas de PS perdu', () => {
    expect(psPassagersPerdus(4)).toBe(0);
  });
});

describe('Poursuite — p.105', () => {
  it('−3 dés par point d\u2019écart de vitesse', () => {
    expect(malusPoursuite(3, 5)).toBe(6); // écart 2 → −6 dés
    expect(malusPoursuite(5, 3)).toBe(0); // plus rapide : pas de malus
  });
});
