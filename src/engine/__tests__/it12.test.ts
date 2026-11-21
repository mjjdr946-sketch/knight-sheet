import { describe, it, expect } from 'vitest';
import { valeurChevalier, palierPuissance } from '../../engine/stats';
import { personnageExemple } from '../../data/character';

/** Itération 12 — recette de table (prompt v14). 1 test par correctif. */
describe('§0/§1 — wizard : champ nom présent + bouton au-dessus de la TabBar', () => {
  it('garde de layout : la barre d\u2019action du wizard est au-dessus de la TabBar (bottom 76px)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = require('fs').readFileSync('app/personnage/creation/page.tsx', 'utf8');
    expect(src).toContain('bottom-[76px]'); // au-dessus de la TabBar (~64px)
    expect(src).toContain('pb-44'); // conteneur scrollable dégagé
    expect(src).not.toContain('fixed inset-x-0 bottom-0'); // plus d'occlusion
    // le champ nom est rendu à l'étape 1 (Champ « Nom du chevalier »)
    expect(src).toContain('Nom du chevalier');
  });
});

describe('§3 — valeurChevalier : postes chiffrés (armes/modules/OD)', () => {
  it('armes + modules + OD (grille cumulée 10/30/50/70/100)', () => {
    const v = valeurChevalier({
      armes: [{ coutPG: 30 }, { coutPG: 40 }],
      modules: [{ coutPG: 10 }, { coutPG: 30 }],
      overdrives: [
        { trait: 'force', niveau: 2 }, // cumul 2 → 40 PG
        { trait: 'tir', niveau: 1 },   // cumul 1 → 10 PG
        { trait: 'combat', niveau: 1, origine: 'type-warrior' }, // hors limite → gratuit
      ],
    });
    expect(v.armes).toBe(70);
    expect(v.modules).toBe(40);
    expect(v.overdrives).toBe(50); // 40 + 10 (OD type exclue)
    expect(v.total).toBe(160);
  });

  it('personnageExemple : valeur cohérente (tous postes > 0)', () => {
    const v = valeurChevalier(personnageExemple);
    expect(v.total).toBeGreaterThan(0);
    expect(palierPuissance(personnageExemple.gloire).rang).toBe('Écuyer');
  });
});
