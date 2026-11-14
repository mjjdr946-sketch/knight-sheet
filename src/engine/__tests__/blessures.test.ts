/**
 * Tests moteur — blessures/agonie (p.90-91).
 */
import { describe, expect, it } from 'vitest';
import { appliquerBlessure, appliquerMalusTrait, estALAgonie, suiteAgonie } from '../blessures';
import { personnageExemple } from '../../data/character';
import type { Character } from '../../types/character';

function clone(c: Character): Character {
  return structuredClone(c);
}

describe('Suite d\u2019agonie — règle p.90', () => {
  it('1re et 2e mise à l\u2019agonie = blessure ; 3e = mort', () => {
    expect(suiteAgonie(1)).toBe('blessure');
    expect(suiteAgonie(2)).toBe('blessure');
    expect(suiteAgonie(3)).toBe('mort');
  });
});

describe('Tirage de blessure — tableau p.91', () => {
  it('dé injecté : ligne 3, colonne 2-3 → Dos brisé (−1 aux 6 caract. Chair et Bête)', () => {
    const r = appliquerBlessure(3, 2);
    expect(r.nom).toBe('Dos brisé');
    expect(r.condition?.effets).toHaveLength(6);
  });

  it('dé injecté : ligne 3, colonne 4-5 → Pied brisé (−1 Combat/Déplacement/Discrétion/Force)', () => {
    const r = appliquerBlessure(3, 4);
    expect(r.nom).toBe('Pied brisé');
    expect(r.condition?.effets).toHaveLength(4);
  });

  it('ligne 1 colonne 1 = mort immédiate : pas de condition, flag mort', () => {
    // TODO-RULES: vérifier p.91 — cas marqué douteux dans la table
    const r = appliquerBlessure(1, 1);
    expect(r.nom).toBe('Mort');
    expect(r.mort).toBe(true);
    expect(r.condition).toBeNull();
  });

  it('hémorragie interne : flag mort sans condition de stats (gestion MJ)', () => {
    const r = appliquerBlessure(5, 1);
    expect(r.nom).toBe('Hémorragie interne');
    expect(r.mort).toBe(true);
  });

  it('la blessure est permanente (retrait uniquement implant/thérapie, p.91)', () => {
    const r = appliquerBlessure(6, 2); // Côtes brisées
    expect(r.condition?.permanente).toBe(true);
  });

  it('les blessures successives ont des ids uniques', () => {
    const a = appliquerBlessure(6, 2);
    const b = appliquerBlessure(6, 2);
    expect(a.condition?.id).not.toBe(b.condition?.id);
  });
});

describe('Caractéristiques jamais sous 0 — règle p.91', () => {
  it('un malus cumulé ne descend jamais la caractéristique sous 0', () => {
    expect(appliquerMalusTrait(2, -5)).toBe(0);
    expect(appliquerMalusTrait(3, -1)).toBe(2);
  });
});

describe('État agonie — règle p.90', () => {
  it('0 PS = agonie', () => {
    const c = clone(personnageExemple);
    c.jauges.ps.current = 0;
    expect(estALAgonie(c)).toBe(true);
    c.jauges.ps.current = 1;
    expect(estALAgonie(c)).toBe(false);
  });
});
