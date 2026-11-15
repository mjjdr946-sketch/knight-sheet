/**
 * Tests du store — chaque action doit passer par le moteur (aucun calcul UI).
 * Les jauges sont toujours bornées par les max calculés par computeDerived.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useCharacterStore } from '../characterStore';
import { personnageExemple } from '../../data/character';
import { computeDerived } from '../../engine/stats';
import type { Condition } from '../../types/character';

// Réinitialise le store avec un clone SAIN du personnage d'exemple avant chaque test
beforeEach(() => {
  const character = structuredClone(personnageExemple);
  useCharacterStore.setState({ character, derived: computeDerived(character) });
});

const S = () => useCharacterStore.getState();

describe('ajusterJauge — bornes par le moteur', () => {
  it('+1 sur PS : borne au max calculé (39, avec Dur à cuir)', () => {
    S().reglerJauge('ps', 35);
    S().ajusterJauge('ps', 10); // dépasse volontairement
    expect(S().character.jauges.ps.current).toBe(39);
  });

  it('−5 sur PS : ne passe pas sous 0', () => {
    S().reglerJauge('ps', 2);
    S().ajusterJauge('ps', -5);
    expect(S().character.jauges.ps.current).toBe(0);
    expect(S().derived.etatAgonie).toBe(true); // règle p.90 : 0 PS = agonie
  });

  it("l'héroïsme est borné à 6 (règle p.96)", () => {
    S().ajusterJauge('heroisme', 9);
    expect(S().character.jauges.heroisme.current).toBe(6);
  });

  it('les dérivées sont recalculées après mutation', () => {
    S().reglerJauge('pes', 5); // sous 10 → malus désespoir 5 (règle p.96)
    expect(S().derived.malusDesespoir).toBe(5);
  });
});

describe('activerModule — slots, interdits Paladin, PE', () => {
  it("refuse les modules interdits « Lente et lourde » (p.140)", () => {
    // le module interdit est ajouté à l'état pour tester la garde
    useCharacterStore.setState((state) => ({
      character: {
        ...state.character,
        modules: [...state.character.modules, {
          id: 'course',
          nom: 'Course',
          categorie: 'deplacement',
          accessibilite: 'standard',
          coutPG: 20,
          slots: { jambeGauche: 1, jambeDroite: 1 },
          activation: 'action-deplacement',
          duree: '',
          description: '',
          effets: [],
          etat: 'inactif' as const,
        }],
      },
    }));
    expect(S().activerModule('course', true)).toBe(false);
  });

  it('refuse si les slots ne suffisent pas (p.130)', () => {
    // 2 modules de 2 slots torse chacun : torse Paladin = 10, suffisant.
    // On saturé avec un module de 10 slots puis on tente le blindage drone (2 torse).
    useCharacterStore.setState((state) => ({
      character: {
        ...state.character,
        modules: [...state.character.modules, {
          id: 'gros-module',
          nom: 'Gros module',
          categorie: 'utilitaire',
          accessibilite: 'standard',
          coutPG: 0,
          slots: { torse: 9 },
          activation: 'aucune',
          duree: '',
          description: '',
          effets: [],
          etat: 'actif' as const,
        }],
      },
    }));
    expect(S().activerModule('blindage-drone', true)).toBe(false); // 9 + 2 > 10
  });

  it('activation réussie : état actif + coût PE déduit', () => {
    const peAvant = S().character.jauges.pe.current; // 20
    expect(S().activerModule('fumigene', true)).toBe(true);
    expect(S().character.modules.find((m) => m.id === 'fumigene')?.etat).toBe('actif');
    expect(S().character.jauges.pe.current).toBe(peAvant - 2); // fumigène : 2 PE (p.430)
    // le bonus de défense s'applique via le moteur
    expect(S().derived.defense).toBe(7); // Hargne 5 + fumigène +2
  });
});

describe('activerCapacite — Shrine / Watchtower', () => {
  it('Shrine : +6 CdF non-cumulable (p.140) — 14 = 8 + 6', () => {
    expect(S().activerCapacite('shrine', true)).toBe(true);
    expect(S().derived.cdf).toBe(14);
  });

  it('PE insuffisant : la capacité est refusée (règle p.130 : à 0 PE plus rien)', () => {
    S().reglerJauge('pe', 1);
    expect(S().activerCapacite('watchtower', true)).toBe(false); // coûte 2
  });

  it('Watchtower : réaction ÷2 sur la valeur initiale (FAQ p.455)', () => {
    expect(S().activerCapacite('watchtower', true)).toBe(true);
    // réaction 5 (Tir 4 + OD 1) → 5÷2 arrondi inférieur = 2
    expect(S().derived.reaction).toBe(2);
  });
});

describe('subirDegats — applique le moteur et fold auto', () => {
  it('applique les nouvelles jauges du résultat', () => {
    const r = S().subirDegats({ degats: 7, ignoreCdF: true });
    expect(S().character.jauges.pa.current).toBe(113); // 120 − 7
    expect(S().character.jauges.ps.current).toBe(38);  // 39 − 1 (secousse, p.130)
    expect(r.armureFoldedAuto).toBe(false);
  });

  it("fold automatique à 0 PA (p.130) : l'état passe en Guardian", () => {
    S().reglerJauge('pa', 6);
    S().subirDegats({ degats: 6, ignoreCdF: true });
    expect(S().character.armureDeployee).toBe(false);
    expect(S().derived.pa.max).toBe(5); // Guardian
    expect(S().derived.cdf).toBe(5);    // Guardian
  });
});

describe('resetCombat — Camelot (p.90/130/96)', () => {
  it('jauges au max, modules temporaires désactivés, héroïsme conservé', () => {
    S().reglerJauge('ps', 5);
    S().reglerJauge('pa', 12);
    S().reglerJauge('pe', 3);
    S().ajusterJauge('heroisme', 3);
    S().activerModule('fumigene', true);
    S().activerCapacite('shrine', true);

    S().resetCombat();

    expect(S().character.jauges.ps.current).toBe(39);
    expect(S().character.jauges.pa.current).toBe(120);
    expect(S().character.jauges.pe.current).toBe(20);
    expect(S().character.jauges.heroisme.current).toBe(3); // se conserve entre parties (p.96)
    expect(S().character.modules.find((m) => m.id === 'fumigene')?.etat).toBe('inactif');
    expect(S().character.metaArmor.capacites.find((c) => c.id === 'shrine')?.active).toBe(false);
    expect(S().character.armureDeployee).toBe(true);
  });
});

describe('conditions — blessures et modificateurs', () => {
  const blessure: Condition = {
    id: 'pied-brise',
    nom: 'Pied brisé',
    categorie: 'blessure',
    description: '−1 en Combat, Déplacement, Discrétion, Force (tableau p.91)',
    effets: [
      { source: 'Pied brisé', target: 'trait:combat', valeur: -1, type: 'malus' },
      { source: 'Pied brisé', target: 'trait:force', valeur: -1, type: 'malus' },
    ],
    permanente: true, // jusqu'à implant/thérapie (p.91)
  };

  it('la blessure ajoute ses modificateurs via le moteur', () => {
    S().ajouterBlessure(blessure);
    expect(S().character.conditions).toHaveLength(1);
  });

  it('retrait de condition (implant cybernétique / thérapie — p.91)', () => {
    S().ajouterBlessure(blessure);
    S().retirerCondition('pied-brise');
    expect(S().character.conditions).toHaveLength(0);
  });
});

describe('persistance — clé versionnée knight-sheet-v1', () => {
  it('la clé de stockage est knight-sheet-v1 (SCHEMA_VERSION 3)', () => {
    expect(useCharacterStore.persist.getOptions().name).toBe('knight-sheet-v1');
    expect(useCharacterStore.persist.getOptions().version).toBe(3);
  });
});
