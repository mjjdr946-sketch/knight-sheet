/**
 * Tests moteur — mécanique de dés (règles p.76-78).
 * Générateur aléatoire injecté pour des tests déterministes.
 */
import { describe, expect, it } from 'vitest';
import { compterReussites, estEchecCritique, estExploit, estReussite, jetComplet, jetDegats, lancerDes, relanceExploit, touche } from '../dice';

/** rand déterministe : séquence de faces fournie */
function seq(...faces: number[]): () => number {
  let i = 0;
  return () => {
    const f = faces[i % faces.length]!;
    i++;
    return (f - 1) / 6; // f=1 → 0.0 (→ 1), f=6 → 5/6 (→ 6)
  };
}

describe('Réussite = face paire — règle p.76-78', () => {
  it('2, 4, 6 = réussites ; 1, 3, 5 = échecs', () => {
    expect(estReussite(2)).toBe(true);
    expect(estReussite(4)).toBe(true);
    expect(estReussite(6)).toBe(true);
    expect(estReussite(1)).toBe(false);
    expect(estReussite(3)).toBe(false);
    expect(estReussite(5)).toBe(false);
  });

  it('compterReussites compte les dés pairs', () => {
    expect(compterReussites([2, 4, 1, 6, 3])).toBe(3);
    expect(compterReussites([1, 3, 5])).toBe(0);
  });
});

describe('Nombre de dés = base + combo — règle p.76-78', () => {
  it('lancerDes génère exactement n dés à 6 faces', () => {
    const des = lancerDes(7, seq(1, 2, 3, 4, 5, 6, 1));
    expect(des).toHaveLength(7);
    expect(des.every((d) => d >= 1 && d <= 6)).toBe(true);
    expect(lancerDes(0)).toHaveLength(0);
  });
});

describe('Exploit / échec critique — règle p.77', () => {
  it('exploit : tous les dés pairs', () => {
    expect(estExploit([2, 4, 6])).toBe(true);
    expect(estExploit([2, 3, 6])).toBe(false);
    expect(estExploit([])).toBe(false);
  });

  it('échec critique : tous les dés impairs', () => {
    expect(estEchecCritique([1, 3, 5])).toBe(true);
    expect(estEchecCritique([1, 3, 2])).toBe(false);
    expect(estEchecCritique([])).toBe(false);
  });

  it('relance d\u2019exploit : même nombre de dés, résultat conservé', () => {
    const r = relanceExploit([2, 4, 6], seq(1, 5, 3)); // relance tout impairs
    expect(r.des).toHaveLength(3);
    expect(r.reussites).toBe(0);
    expect(r.echecCritique).toBe(true);
  });
});

describe('Toucher = réussites strictement supérieures — règle p.86', () => {
  it('dépasser strictement (égalité = rate)', () => {
    expect(touche(5, 4)).toBe(true);
    expect(touche(4, 4)).toBe(false); // dépasser, pas égaler
    expect(touche(3, 4)).toBe(false);
  });
});

describe('jetComplet — dés + réussites auto + détections', () => {
  it('7 dés, 2 réussites auto : total = dés pairs + 2', () => {
    const j = jetComplet(7, 2, seq(2, 4, 1, 3, 6, 5, 2)); // 4 pairs (2,4,6,2)
    expect(j.reussites).toBe(4);
    expect(j.reussitesAuto).toBe(2);
    expect(j.total).toBe(6);
    expect(j.exploit).toBe(false);
  });

  it('exploit détecté sur un jet tout-pairs', () => {
    const j = jetComplet(3, 0, seq(2));
    expect(j.exploit).toBe(true);
  });
});

describe('Jet de dégâts — règle p.89', () => {
  it('n D6 + bonus fixe', () => {
    const d = jetDegats(3, 6, seq(2, 2, 2)); // 3 × 2 = 6 + 6 = 12
    expect(d.total).toBe(12);
    expect(d.des).toEqual([2, 2, 2]);
  });
});
