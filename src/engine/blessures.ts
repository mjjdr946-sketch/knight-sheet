/**
 * Moteur — blessures et agonie (règles p.90-91).
 * Les dés sont injectés par l'appelant : le moteur reste déterministe/testable.
 */
import type { Character } from '../types/character';
import { blessureVersCondition, tirerBlessure } from '../data/blessures';
import type { Condition } from '../types/character';

/** Génère un id unique de blessure (les doublons sont possibles : 2ᵉ mise à l'agonie) */
let compteurBlessures = 0;
export function idBlessure(nom: string): string {
  compteurBlessures += 1;
  return `blessure-${nom.toLowerCase().replace(/[^a-z]+/g, '-')}-${compteurBlessures}`;
}

/**
 * Suite d'agonie — règle p.90 : à 0 PS le PJ est à l'agonie et tire une
 * blessure aléatoire. Attaqué une 2ᵉ fois à l'agonie → nouvelle blessure.
 * Attaqué une 3ᵉ fois → MORT.
 * @param coupsALAgonie nombre de fois où le personnage a été touché alors
 * qu'il était déjà à 0 PS (1 = première mise à l'agonie)
 */
export function suiteAgonie(coupsALAgonie: number): 'blessure' | 'mort' {
  if (coupsALAgonie < 3) return 'blessure'; // p.90 : 1re et 2e fois = blessure
  return 'mort'; // p.90 : 3e fois = mort
}

/**
 * Tire une blessure (2D6 injectés : ligne et colonne) et la transforme en
 * `Condition` avec ses `Modifier` — prête pour le store.
 * TRANCHAGE v4 §0.3 : la table est codée telle quelle (cas douteux marqués
 * dans src/data/blessures.ts) ; « mort » immédiat / hémorragie sont signalés
 * dans le résultat et NON ajoutés comme condition de stats.
 */
export function appliquerBlessure(
  deLigne: number,
  deColonne: number,
): { condition: Condition | null; mort: boolean; nom: string; description: string } {
  const blessure = tirerBlessure(deLigne, deColonne);
  if (blessure.mort === 'immediate') {
    return { condition: null, mort: true, nom: blessure.nom, description: blessure.description };
  }
  if (blessure.effets.length === 0 && blessure.mort !== 'hemorragie') {
    // Blessure sans malus de stats (colonne vertébrale, bras mutilé…) :
    // condition créée pour l'information, sans Modifier.
    return {
      condition: blessureVersCondition(blessure, idBlessure(blessure.nom)),
      mort: false,
      nom: blessure.nom,
      description: blessure.description,
    };
  }
  return {
    condition: blessureVersCondition(blessure, idBlessure(blessure.nom)),
    mort: blessure.mort !== undefined, // hémorragie : mort signalée, gestion MJ (p.91)
    nom: blessure.nom,
    description: blessure.description,
  };
}

/** Les caractéristiques ne descendent jamais sous 0 (règle p.91) */
export function appliquerMalusTrait(base: number, malusCumules: number): number {
  return Math.max(0, base + malusCumules);
}

/** Vérifie si un personnage est à l'agonie et retourne le nombre de coups subis à 0 PS (state externe au store) */
export function estALAgonie(character: Character): boolean {
  return character.jauges.ps.current <= 0; // règle p.90
}
