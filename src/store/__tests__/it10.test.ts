import { describe, it, expect, beforeEach } from 'vitest';
import { useCharacterStore } from '../characterStore';
import { personnageExemple } from '../../data/character';
import { computeDerived } from '../../engine/stats';
import { META_ARMURES, NOMS_ARMURES } from '../../data/meta-armures';
import { ARMES_PRESTIGE, RELIQUES_ESPOIR, EFFETS_2038 } from '../../data/arsenal-2038';

/** Itération 10 — correctifs reportés §0 + contenu 2038 (PARTIE 7). */
const S = () => useCharacterStore.getState();
const reset = () => {
  const c = structuredClone(personnageExemple);
  useCharacterStore.setState({ character: c, derived: computeDerived(c), actifId: c.id, autresFiches: {} } as never);
};

describe('§0.2 — remplacement des OD au changement d\u2019armure (point non conclusif devops)', () => {
  beforeEach(reset);
  it('Paladin (force/endurance/tir/perception) → Wizard (sangfroid/instinct/combat/aura)', () => {
    expect(S().character.overdrives.map((o) => o.trait).sort()).toEqual(['force', 'perception', 'sangfroid', 'tir']);
    S().changerArmure('wizard');
    expect(S().character.overdrives.map((o) => o.trait).sort()).toEqual(['aura', 'combat', 'instinct', 'sangfroid']);
    expect(S().character.overdrives.every((o) => o.niveau === 1)).toBe(true); // niv 1 de base
  });
  it('OD de type Warrior (origine type-warrior) sont PURGÉES au changement (hors limite 5 propres à Warrior)', () => {
    S().changerArmure('warrior');
    S().activerTypeWarrior('hunter', true); // +3 OD de type (hargne/combat/instinct)
    expect(S().character.overdrives.some((o) => (o as { origine?: string }).origine === 'type-warrior')).toBe(true);
    S().changerArmure('rogue'); // les types ne s'appliquent plus
    expect(S().character.overdrives.some((o) => (o as { origine?: string }).origine === 'type-warrior')).toBe(false);
  });
});

describe('§0.4 — pas de fiche anonyme', () => {
  beforeEach(reset);
  it('creerFiche avec nom vide → « Nouveau chevalier » (jamais vide)', () => {
    S().creerFiche('   ');
    const derniere = Object.values(S().autresFiches).at(-1)!;
    expect(derniere.nom.trim().length).toBeGreaterThan(0);
  });
});

describe('§3 — contenu 2038 (PARTIE 7)', () => {
  it('3 nouvelles méta-armures avec profils complets', () => {
    for (const [id, profil] of [['psion', { pa: 50, pe: 60, cdf: 14 }], ['monk', { pa: 60, pe: 50, cdf: 14 }], ['sorcerer', { pa: 60, pe: 80, cdf: 14 }]] as const) {
      const m = META_ARMURES[id];
      if (!m) { expect.unreachable(id); return; }
      expect(m, id).toBeDefined();
      expect(m.paTotal).toBe(profil.pa);
      expect(m.peTotal).toBe(profil.pe);
      expect(m.cdfTotal).toBe(profil.cdf);
      expect(m.capacites.length).toBeGreaterThan(0);
    }
    // Psion : 4 modes (Flux/Puppet Master/Discord/Windtalker) ; Monk : Céa+Zen ; Sorcerer : Morph+spécial
    expect(META_ARMURES['psion']!.capacites).toHaveLength(4);
    expect(META_ARMURES['monk']!.capacites).toHaveLength(2);
    expect(META_ARMURES['sorcerer']!.capacites).toHaveLength(2);
    // OD de base conformes PARTIE 7
    expect(META_ARMURES['psion']!.overdrivesDeBase.map((o) => o.trait).sort()).toEqual(['instinct', 'perception', 'sangfroid', 'savoir']);
  });

  it('13 armures listées (9 + 4, Necromancer en placeholder) dans le sélecteur', () => {
    expect(NOMS_ARMURES.map((n) => n.id)).toContain('psion');
    expect(NOMS_ARMURES.map((n) => n.id)).toContain('monk');
    expect(NOMS_ARMURES.map((n) => n.id)).toContain('sorcerer');
    expect(NOMS_ARMURES.length).toBe(13); // 9 + 3 armures 2038 + Necromancer/Sarcophage (it. 11)
  });

  it('7 armes de prestige + 3 reliques + 3 effets exclusifs', () => {
    expect(ARMES_PRESTIGE).toHaveLength(7);
    expect(RELIQUES_ESPOIR).toHaveLength(3);
    expect(Object.keys(EFFETS_2038)).toEqual(['tenebricide', 'esperance', 'obliteration']);
    // profils cités par le digest
    const typhon = ARMES_PRESTIGE.find((a) => a.id === 'marteau-typhon')!;
    expect(typhon.degats.nombre).toBe(12); // 12D6 + Force ×2 (2038 p.34)
  });
});
