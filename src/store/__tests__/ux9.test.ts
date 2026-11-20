import { describe, it, expect, beforeEach } from 'vitest';
import { useCharacterStore } from '../characterStore';
import { personnageExemple } from '../../data/character';
import { computeDerived, palierPuissance } from '../../engine/stats';

/**
 * Itération 9 — tests de non-régression UX (prompt v11). 1 test par correction.
 */
const S = () => useCharacterStore.getState();
const reset = () => {
  const character = structuredClone(personnageExemple);
  useCharacterStore.setState({
    character,
    derived: computeDerived(character),
    actifId: character.id,
    autresFiches: {},
  } as never);
};

describe('Livrable 1 — header : 5 jauges sans scroll horizontal (desktop)', () => {
  it('GaugeBar déclare max-w-4xl + overflow visible sur lg (garde de style)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    const src = fs.readFileSync('components/header/GaugeBar.tsx', 'utf8');
    expect(src).toContain('lg:max-w-4xl');
    expect(src).toContain('lg:overflow-visible');
  });
});

describe('Livrable 5 — modale de changement d’armure : liste des resets (p.130)', () => {
  beforeEach(reset);

  it('changerArmure remet OD de base, déséquipe les modules, désactive Ghost/Goliath', () => {
    // fiche avec modules + Ghost actif + Goliath 2 m
    const p = structuredClone(personnageExemple);
    p.modules = [{ ...p.modules[0]!, niveau: 1 } as never];
    p.ghostActif = true;
    p.goliathMetres = 2;
    S().remplacerPersonnage(p);

    S().changerArmure('wizard'); // 40 PA / 80 PE / CdF 14 (p.165)
    const fin = S().character;

    // OD remplacées par les OD de base de la nouvelle armure (p.165 : Sang-Froid, Instinct, Combat, Aura)
    expect(fin.overdrives.map((o) => o.trait).sort()).toEqual(['aura', 'combat', 'instinct', 'sangfroid']);
    // modules déséquipés
    expect(fin.modules).toHaveLength(0);
    // capacités désactivées
    expect(fin.ghostActif).toBe(false);
    expect(fin.goliathMetres ?? 0).toBe(0);
    // CdF recalculé (14 Wizard)
    expect(S().derived.cdf).toBe(14);
  });

  it('PG cumulés et xpJournal NE SONT PAS touchés (conservés, prompt v11 §4)', () => {
    const p = structuredClone(personnageExemple);
    p.gloire = 300;
    p.xpJournal = [{ quand: 'x', points: 300, note: 'test', paliers: [150, 200, 250] }];
    S().remplacerPersonnage(p);
    S().changerArmure('wizard');
    expect(S().character.gloire).toBe(300); // conservé
    expect(S().character.xpJournal).toHaveLength(1); // conservé
  });
});

describe('Livrable 6 — badge de palier de puissance (PARTIE 7)', () => {
  it('Écuyer < 100 · Chevalier 100+ · Champion 300+ · Table Ronde 500+', () => {
    expect(palierPuissance(0).rang).toBe('Écuyer');
    expect(palierPuissance(99).rang).toBe('Écuyer');
    expect(palierPuissance(100).rang).toBe('Chevalier');
    expect(palierPuissance(299).rang).toBe('Chevalier');
    expect(palierPuissance(300).rang).toBe('Champion');
    expect(palierPuissance(499).rang).toBe('Champion');
    expect(palierPuissance(500).rang).toBe('Table Ronde');
  });
});
