/**
 * Tests de décompte de l'arsenal (annexe 2).
 * Bilan du digest : 40 armes (dont 17 profils secondaires annoncés),
 * 18 améliorations, 72 modules dont 15 overdrives → 57 modules hors OD.
 * RÈGLES: le bilan du digest annonce 17 profils de tir secondaires, mais la
 * table contient 19 modes réels (les grenades du lance-grenade léger répètent
 * le PG au lieu du marqueur « (même arme) ») — l'assertion suit la table.
 */
import { describe, expect, it } from 'vitest';
import { armesArsenal } from '../../data/weapons';
import { catalogueAmeliorationsArmes } from '../../data/upgrades';
import { catalogueModules } from '../../data/modules';
import { catalogueOverdrives } from '../../data/overdrives';
import { NODS } from '../../data/nods';

describe('Arsenal — décomptes', () => {
  it('contient les 40 armes de la table', () => {
    expect(armesArsenal).toHaveLength(40);
  });

  it('total des profils d\u2019armes (armes + modes) = 59 (40 armes + 19 modes secondaires)', () => {
    const profils = armesArsenal.reduce(
      (total, arme) => total + 1 + (arme.modes?.length ?? 0),
      0,
    );
    expect(profils).toBe(59);
  });

  it('contient les 18 améliorations d\u2019armes à distance', () => {
    expect(catalogueAmeliorationsArmes).toHaveLength(18);
  });

  it('contient les 57 modules du catalogue (72 − 15 overdrives)', () => {
    expect(catalogueModules).toHaveLength(57);
  });

  it('contient les 15 overdrives (3 par aspect)', () => {
    expect(catalogueOverdrives).toHaveLength(15);
    for (const aspect of ['Chair', 'Machine', 'Bête', 'Dame', 'Masque']) {
      expect(
        catalogueOverdrives.filter((od) => od.aspect === aspect),
      ).toHaveLength(3);
    }
  });

  it('dégâts et violence non négatifs pour chaque arme', () => {
    for (const arme of armesArsenal) {
      for (const profil of [arme.degats, arme.violence]) {
        expect(profil.nombre).toBeGreaterThanOrEqual(0);
        if (typeof profil.bonus === 'number') {
          expect(profil.bonus).toBeGreaterThanOrEqual(0);
        }
      }
      for (const mode of arme.modes ?? []) {
        for (const profil of [mode.degats, mode.violence]) {
          expect(profil.nombre).toBeGreaterThanOrEqual(0);
          if (typeof profil.bonus === 'number') {
            expect(profil.bonus).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }
  });

  it('chaque module a au moins 1 slot OU une catégorie sans slot', () => {
    for (const module of catalogueModules) {
      const slots = Object.values(module.slots).reduce((t, v) => t + (v ?? 0), 0);
      expect(slots >= 1 || ['amelioration', 'utilitaire'].includes(module.categorie)).toBe(
        true,
      );
    }
  });

  it('overdrives : grille de prix 10/30/50/70/100 et niveaux croissants', () => {
    for (const od of catalogueOverdrives) {
      expect(od.paliers.length).toBeGreaterThanOrEqual(1);
      for (const palier of od.paliers) {
        expect(palier.niveau).toBeGreaterThanOrEqual(1);
        expect(palier.niveau).toBeLessThanOrEqual(5);
        expect([10, 30, 50, 70, 100]).toContain(palier.coutPG);
      }
      for (let i = 1; i < od.paliers.length; i++) {
        expect(od.paliers[i]!.niveau).toBeGreaterThan(od.paliers[i - 1]!.niveau);
      }
    }
  });

  it('les 3 nods sont définis (3D6 restaurés)', () => {
    expect(NODS.soin.restaure).toBe('3D6 PS');
    expect(NODS.armure.restaure).toBe('3D6 PA');
    expect(NODS.energie.restaure).toBe('3D6 PE');
  });
});
