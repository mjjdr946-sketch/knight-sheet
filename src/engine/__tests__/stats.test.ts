/**
 * Tests du moteur — une règle du digest = un test, page citée.
 * Le personnage d'exemple sert de référence (valeurs calculées à la main
 * dans le commentaire d'en-tête de src/data/character.ts).
 */
import { describe, expect, it } from 'vitest';
import { personnageExemple } from '../../data/character';
import type { Character } from '../../types/character';
import {
  computeCdF,
  computeContacts,
  computeDefense,
  computeInitiative,
  computeMalusDesespoir,
  computePAMax,
  computePEMax,
  computePESMax,
  computePSMax,
  computeReaction,
  overdriveNiveau,
} from '../stats';

// Clone profond utilitaire pour tester sans polluer l'exemple
function clone(character: Character): Character {
  return structuredClone(character);
}

describe('PS — règle p.90 / p.172', () => {
  it('PS = 10 + 6 × meilleure Chair sans OD ; Endurance 4 → 34 PS de base', () => {
    // p.172 : "Ex. Endurance 4 → 34 PS"
    const perso = clone(personnageExemple);
    perso.identite.cartes = []; // sans les avantages de cartes
    expect(computePSMax(perso)).toBe(34);
  });

  it("l'overdrive de Chair n'augmente PAS le PS (sans overdrive — p.172)", () => {
    const perso = clone(personnageExemple);
    perso.identite.cartes = [];
    perso.overdrives.push({ trait: 'endurance', niveau: 3 });
    expect(computePSMax(perso)).toBe(34); // inchangé
  });

  it('avantage Dur à cuir (lame XI) : +5 PS total', () => {
    // p.120 : "Dur à cuir : +5 points de santé (total)"
    expect(computePSMax(personnageExemple)).toBe(39); // 34 + 5
  });
});

describe('Défense — règle p.88 / p.172', () => {
  it('Hargne 5 sans OD Hargne → défense 5', () => {
    // les 4 OD de base de l'exemple sont en force/endurance/tir/perception
    expect(computeDefense(personnageExemple)).toBe(5);
  });

  it('caractéristique Bête + 1 par OD de cette caractéristique (règle p.88)', () => {
    const perso = clone(personnageExemple);
    perso.overdrives.push({ trait: 'hargne', niveau: 2 });
    expect(computeDefense(perso)).toBe(7); // 5 + 2 OD
  });

  it('sans armure déployée, les OD ne comptent plus (règle p.130)', () => {
    const perso = clone(personnageExemple);
    perso.overdrives.push({ trait: 'hargne', niveau: 2 });
    perso.armureDeployee = false;
    expect(computeDefense(perso)).toBe(5); // Hargne seul
  });

  it("condition active : le malus s'applique (style agressif −2 défense, p.87)", () => {
    const perso = clone(personnageExemple);
    perso.conditions.push({
      id: 'style-agressif',
      nom: 'Style agressif',
      categorie: 'autre',
      description: 'Test',
      effets: [{ source: 'Agressif', target: 'defense', valeur: -2, type: 'malus' }],
      permanente: false,
    });
    expect(computeDefense(perso)).toBe(3);
  });
});

describe('Réaction — règle p.88 / p.172', () => {
  it('Tir 4 + 1 OD Tir = 5', () => {
    expect(computeReaction(personnageExemple)).toBe(5);
  });

  it('Watchtower : réaction divisée par 2 sur la valeur initiale (FAQ p.455 : 6÷2+4=7)', () => {
    // Exemple du livre : réaction 5 avec OD + pavois +4 → 6÷2+4 = 7
    const perso = clone(personnageExemple);
    perso.identite.cartes = [];
    perso.traits.tir = 6;
    perso.overdrives = [{ trait: 'tir', niveau: 1 }]; // réaction 5 → base 6 avec OD
    const watchtower = perso.metaArmor.capacites.find((c) => c.id === 'watchtower')!;
    watchtower.active = true;
    // 6 ÷ 2 = 3, puis modificateurs (aucun ici) → 3
    expect(computeReaction(perso)).toBe(3);
  });

  it('FAQ p.455 : modificateurs appliqués APRÈS la division (6÷2+4=7)', () => {
    const perso = clone(personnageExemple);
    perso.identite.cartes = [];
    perso.traits.tir = 6;
    perso.overdrives = [{ trait: 'tir', niveau: 1 }];
    const watchtower = perso.metaArmor.capacites.find((c) => c.id === 'watchtower')!;
    watchtower.active = true;
    perso.modules.push({
      id: 'pavois',
      nom: 'Pavois',
      categorie: 'defense',
      accessibilite: 'rare',
      coutPG: 60,
      slots: {},
      activation: 'aucune',
      duree: '',
      description: '',
      effets: [{ source: 'Pavois', target: 'reaction', valeur: 4, type: 'bonus' }],
      etat: 'actif',
    });
    // p.455 : réaction 5 avec OD → valeur initiale 6 ; 6 ÷ 2 + 4 = 7
    expect(computeReaction(perso)).toBe(7);
  });
});

describe('Initiative — règle p.86 / p.172', () => {
  it('Perception 4 + 1 OD = 5', () => {
    expect(computeInitiative(personnageExemple)).toBe(5);
  });
});

describe('Points de contact — règle p.95 / p.172-173', () => {
  it('meilleure Dame SANS OD → Parole 6', () => {
    // Parole 6 ; l'OD éventuel ne compte pas (sans overdrive)
    expect(computeContacts(personnageExemple)).toBe(6);
  });
});

describe('PEs — règle p.96 / p.172', () => {
  it('total de départ = 50', () => {
    const perso = clone(personnageExemple);
    perso.identite.cartes = [];
    expect(computePESMax(perso)).toBe(50);
  });

  it('Forteresse spirituelle (lame V) : +5 PEs total → 55', () => {
    // p.119 : "+5 points d'espoir (total)"
    expect(computePESMax(personnageExemple)).toBe(55);
  });
});

describe('PA / PE — règle p.130 / p.138', () => {
  it('Paladin déployée : 120 PA, 20 PE (p.138)', () => {
    expect(computePAMax(personnageExemple)).toBe(120);
    expect(computePEMax(personnageExemple)).toBe(20);
  });

  it('armure foldée : Guardian 5 PA (p.130)', () => {
    const perso = clone(personnageExemple);
    perso.armureDeployee = false;
    expect(computePAMax(perso)).toBe(5);
    expect(computePEMax(perso)).toBe(0); // plus de réacteur
  });

  it('Blindage amélioré : +10 PA permanents (annexe arsenal)', () => {
    const perso = clone(personnageExemple);
    perso.modules.push({
      id: 'blindage-ameliore',
      nom: 'Blindage amélioré',
      categorie: 'amelioration',
      accessibilite: 'avance',
      coutPG: 30,
      slots: {},
      activation: 'aucune',
      duree: '',
      description: '',
      effets: [{ source: 'Blindage amélioré', target: 'pa', valeur: 10, type: 'bonus' }],
      etat: 'actif',
    });
    expect(computePAMax(perso)).toBe(130);
  });
});

describe('Champ de force — règle p.130 + FAQ p.449/455', () => {
  it('Paladin déployée : CdF 8 (p.138)', () => {
    expect(computeCdF(personnageExemple)).toBe(8);
  });

  it('armure foldée : Guardian CdF 5 ; le CdF de l\'armure foldée ne s\'applique plus (p.131)', () => {
    const perso = clone(personnageExemple);
    perso.armureDeployee = false;
    expect(computeCdF(perso)).toBe(5);
  });

  it('Shrine actif : +6 CdF via bonus non-cumulable (p.140)', () => {
    const perso = clone(personnageExemple);
    perso.metaArmor.capacites.find((c) => c.id === 'shrine')!.active = true;
    expect(computeCdF(perso)).toBe(14); // 8 + 6
  });

  it('deux bonus de CdF ne se cumulent PAS : le plus gros gagne (FAQ p.449)', () => {
    // Shrine (+6) + CdF portatif (+4) → 8 + 6, pas 8 + 10
    const perso = clone(personnageExemple);
    perso.metaArmor.capacites.find((c) => c.id === 'shrine')!.active = true;
    perso.conditions.push({
      id: 'cdf-portatif',
      nom: 'CdF portatif',
      categorie: 'autre',
      description: '',
      effets: [{ source: 'CdF portatif', target: 'cdf', valeur: 4, type: 'max' }],
      permanente: false,
    });
    expect(computeCdF(perso)).toBe(14);
  });

  it('exception : le blindage drone SE CUMULE avec le Shrine (FAQ p.449)', () => {
    const perso = clone(personnageExemple);
    perso.metaArmor.capacites.find((c) => c.id === 'shrine')!.active = true;
    perso.modules.find((m) => m.id === 'blindage-drone')!.etat = 'actif'; // +2 bonus
    expect(computeCdF(perso)).toBe(16); // 8 + 6 (Shrine) + 2 (drone, cumul explicite)
  });
});

describe('Désespoir — règle p.96', () => {
  it('sous 10 PEs : −1 dé par point en dessous de 10', () => {
    expect(computeMalusDesespoir(7)).toBe(3);
    expect(computeMalusDesespoir(10)).toBe(0);
    expect(computeMalusDesespoir(12)).toBe(0);
  });
});

describe('Overdrives — règle p.130', () => {
  it('niveau d\'OD nul si armure foldée (OD uniquement armure déployée)', () => {
    const perso = clone(personnageExemple);
    perso.armureDeployee = false;
    expect(overdriveNiveau(perso, 'tir')).toBe(0);
  });
});
