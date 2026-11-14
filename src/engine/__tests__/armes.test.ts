/**
 * Tests moteur — bonus OD aux dégâts, évolutions, coûts PE, équipement multi-mains.
 */
import { describe, expect, it } from 'vitest';
import { bonusDegatsOD, degatsContactEffectifs, evolutionsAtteintes } from '../armes';
import { enMain, parseCoutPE, validerEquipement, validerSlotage } from '../equipement';
import { personnageExemple } from '../../data/character';
import type { Character, Weapon } from '../../types/character';

function clone(c: Character): Character {
  return structuredClone(c);
}

describe('Bonus OD aux dégâts — annexe arsenal', () => {
  it('OD de Force : +3 dégâts par niveau', () => {
    const c = clone(personnageExemple); // OD force niv 1
    const marteau = personnageExemple.armes.find((a) => a.id === 'marteau-epieu')!;
    expect(bonusDegatsOD(c, marteau)).toBe(3);
    // montée de l'OD de Force au niveau 3 → 3 × 3 = 9
    const odForce = c.overdrives.find((od) => od.trait === 'force')!;
    odForce.niveau = 3;
    expect(bonusDegatsOD(c, marteau)).toBe(9);
  });

  it('arme sans Force dans son bonus : pas de bonus OD de dégâts', () => {
    const c = clone(personnageExemple);
    const fusil = personnageExemple.armes.find((a) => a.id === 'fusil-assaut')!; // bonus fixe, pas de trait
    expect(bonusDegatsOD(c, fusil)).toBe(0);
  });

  it('dégâts de contact effectifs : profil + Force de base (+3/OD de Force)', () => {
    const c = clone(personnageExemple); // Force 3, OD force 1
    const marteau = personnageExemple.armes.find((a) => a.id === 'marteau-epieu')!;
    // 3D6 + Force(3) + OD(3) = 3D6+6
    expect(degatsContactEffectifs(c, marteau)).toEqual({ des: 3, fixe: 6 });
  });
});

describe('Évolutions Paladin — p.140', () => {
  it('détection automatique : gloire >= seuilPG', () => {
    const c = clone(personnageExemple); // gloire 0
    expect(evolutionsAtteintes(c)).toHaveLength(0);
    c.gloire = 200;
    const atteintes = evolutionsAtteintes(c);
    expect(atteintes.map((e) => e.seuilPG)).toEqual([150, 200]);
  });
});

describe('Coûts PE structurés — remplace le parsing naïf', () => {
  it("coût simple '2' → activation 2, pas d'usage", () => {
    expect(parseCoutPE('2')).toEqual({ activation: 2 });
  });

  it("'1/tir' → activation 0 + usage 1 par tir (fusil laser)", () => {
    expect(parseCoutPE('1/tir')).toEqual({ activation: 0, usage: { cout: 1, par: 'tir' } });
  });

  it("'2 (activation) + 1 par tir supplémentaire' → Watchtower", () => {
    const c = parseCoutPE('2 (activation) + 1 par tir supplémentaire');
    expect(c.activation).toBe(2);
    expect(c.usage).toEqual({ cout: 1, par: 'tir' });
  });

  it("'1/action' → usage 1 par action (fléau répulsif)", () => {
    expect(parseCoutPE('1/action')).toEqual({ activation: 0, usage: { cout: 1, par: 'action' } });
  });

  it('coût absent → activation 0', () => {
    expect(parseCoutPE(undefined)).toEqual({ activation: 0 });
  });
});

describe('Équipement multi-mains — p.87 + FAQ p.453', () => {
  const armeUneMain = (id: string, nom: string): Weapon => ({
    id, nom, type: 'contact', accessibilite: 'standard', coutPG: 10,
    degats: { nombre: 1, faces: 6, bonus: 'force' }, violence: { nombre: 0, faces: 6, bonus: 1 },
    portee: 'contact', effets: [], equipee: false,
  });

  it('deux mains : les autres mains doivent être libres (p.87)', () => {
    const c = clone(personnageExemple);
    const epee = { ...personnageExemple.armes.find((a) => a.id === 'fusil-assaut')!, effets: ['Deux mains'] };
    const couteau = { ...armeUneMain('couteau', 'Couteau'), equipee: true };
    c.armes.push(couteau);
    const v = validerEquipement(c, epee);
    expect(v.ok).toBe(false);
    expect(v.raison).toContain('deux mains');
  });

  it('deux mains OK si les mains sont libres', () => {
    const c = clone(personnageExemple);
    c.armes.forEach((a) => (a.equipee = false));
    const epee = { ...personnageExemple.armes.find((a) => a.id === 'fusil-assaut')!, effets: ['Deux mains'], equipee: false };
    expect(validerEquipement(c, epee).ok).toBe(true);
  });

  it('arme slotée compte comme « en main » (évolution 150 PG, FAQ p.453)', () => {
    const c = clone(personnageExemple);
    c.gloire = 150;
    const arme = { ...personnageExemple.armes[0]!, slotee: 'brasDroit' as const };
    expect(enMain(c, arme)).toBe(true);
  });

  it('slotage : réservé aux armes de tir sans lourd, après évolution 150 PG (p.140 + FAQ p.455)', () => {
    const c = clone(personnageExemple);
    c.gloire = 150;
    const fusil = { ...personnageExemple.armes.find((a) => a.id === 'fusil-assaut')! };
    expect(validerSlotage(c, fusil, 'brasDroit').ok).toBe(true);
    // lourd interdit
    const lourd = { ...fusil, effets: ['Lourd'] };
    expect(validerSlotage(c, lourd, 'brasDroit').ok).toBe(false);
    // arme de contact interdite
    const contact = { ...armeUneMain('x', 'X') };
    expect(validerSlotage(c, contact, 'brasDroit').ok).toBe(false);
    // sans l'évolution : refus
    c.gloire = 149;
    expect(validerSlotage(c, fusil, 'brasDroit').ok).toBe(false);
  });
});
