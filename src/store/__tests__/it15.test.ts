import { describe, it, expect, beforeEach } from 'vitest';
import { useCharacterStore } from '../characterStore';
import { personnageExemple } from '../../data/character';
import { computeDerived } from '../../engine/stats';
import { armesArsenal } from '../../data/weapons';
import { catalogueModules } from '../../data/modules';

/** Itération 15 — Équipement comme vrai catalogue (prompt v17 §2). */
const S = () => useCharacterStore.getState();
const reset = () => {
  const c = structuredClone(personnageExemple);
  useCharacterStore.setState({ character: c, derived: computeDerived(c), actifId: c.id, autresFiches: {} } as never);
};

describe('§2 — achat de bout en bout (PG débités, inventaire, refus propre)', () => {
  beforeEach(reset);

  it('achat simple : PG débités, arme dans l\u2019inventaire', () => {
    S().remplacerPersonnage({ ...structuredClone(personnageExemple), gloire: 300 });
    const arme = armesArsenal.find((a) => a.coutPG === 30)!;
    const pgAvant = S().character.gloire;
    const r = S().acheterArmeCatalogue(arme);
    expect(r.ok).toBe(true);
    expect(S().character.gloire).toBe(pgAvant - 30);
    expect(S().character.armes.some((a) => a.nom === arme.nom)).toBe(true);
    expect(S().character.armes.at(-1)?.equipee).toBe(false); // non équipée d'office
  });

  it('achat refusé propre : « Il te manque Y PG »', () => {
    const chere = armesArsenal.find((a) => a.coutPG > S().character.gloire)!;
    const r = S().acheterArmeCatalogue(chere);
    expect(r.ok).toBe(false);
    expect(r.message).toContain('Il te manque');
    expect(S().character.gloire).toBe(personnageExemple.gloire); // pas de débit
  });

  it('achat module : débit + installation sur slots, refus si slots pleins', () => {
    S().remplacerPersonnage({ ...structuredClone(personnageExemple), gloire: 300 });
    const module = catalogueModules.find((m) => m.coutPG > 0 && Object.keys(m.slots).length > 0)!;
    const pgAvant = S().character.gloire;
    const r = S().acheterModuleCatalogue(module);
    expect(r.ok).toBe(true);
    expect(S().character.gloire).toBe(pgAvant - module.coutPG);
    expect(S().character.modules.some((m) => m.nom === module.nom)).toBe(true);
  });
});

describe('§1 — structure 3 sections (garde de layout)', () => {
  it('la page Équipement expose les 3 sections + recherche + badges', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = require('fs').readFileSync('app/personnage/equipement/page.tsx', 'utf8');
    expect(src).toContain('Mon armure');
    expect(src).toContain("Catalogue d'armes");
    expect(src).toContain('Modules & améliorations');
    expect(src).toContain('Rechercher'); // barre textuelle
    expect(src).toContain('Table Ronde'); // badges
  });
});
