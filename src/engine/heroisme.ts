/**
 * Moteur — points d'héroïsme (règle p.96-97) et test d'espoir (p.96).
 * Fonctions pures : elles retournent les nouvelles jauges / effets,
 * les dés sont injectés par l'appelant.
 */
import type { Character } from '../types/character';
import { HEROISME_MAX } from './stats';

/** Les 5 usages d'un point d'héroïsme (p.96-97) */
export type UsageHeroisme =
  | 'ignorer-agonie'       // 1. conserve 1 PS exactement
  | 'garder-espoir'        // 2. conserve 1 PEs exactement
  | 'relancer-jet'         // 3. relancer un jet raté (pas d'effet de jauge)
  | 'degats-maximum'       // 4. dégâts/violence max de l'arme (pas d'effet de jauge)
  | 'combo-supplementaire' // 5. caractéristique supplémentaire en combo (pas d'effet de jauge)
  | 'carte-destin';        // Cartes du Destin (optionnel) : 3 points pour tirer une carte

export interface ResultatHeroisme {
  ok: boolean;
  /** Raison du refus si ok = false */
  raison?: string;
  /** Nouvelle valeur de la jauge d'héroïsme */
  heroisme: number;
  /** Nouvelles jauges PS/PEs si l'usage les modifie */
  ps?: number;
  pes?: number;
  /** Description de l'effet pour l'UI */
  effet: string;
}

/**
 * Dépense un point d'héroïsme pour un usage donné.
 * Usages 3/4/5 ne modifient pas les jauges (résolution de jet côté MJ/app).
 */
export function depenserHeroisme(character: Character, usage: UsageHeroisme): ResultatHeroisme {
  const cout = usage === 'carte-destin' ? 3 : 1; // Cartes du Destin : 3 points (p.97)
  const actuel = character.jauges.heroisme.current;
  if (actuel < cout) {
    return { ok: false, raison: `Héroïsme insuffisant (${actuel} < ${cout})`, heroisme: actuel, effet: '' };
  }

  switch (usage) {
    case 'ignorer-agonie': {
      // p.96 : conserve 1 PS exactement (la mise à l'agonie est annulée)
      return { ok: true, heroisme: actuel - cout, ps: 1, effet: "Mise à l'agonie ignorée : conserve 1 PS exactement" };
    }
    case 'garder-espoir': {
      // p.96 : conserve 1 PEs exactement
      return { ok: true, heroisme: actuel - cout, pes: 1, effet: 'Perte du dernier point d\u2019espoir ignorée : conserve 1 PEs' };
    }
    case 'relancer-jet':
      return { ok: true, heroisme: actuel - cout, effet: 'Jet raté relancé sur l\u2019instant' };
    case 'degats-maximum':
      return { ok: true, heroisme: actuel - cout, effet: 'Dégâts/violence maximum de l\u2019arme' };
    case 'combo-supplementaire':
      return { ok: true, heroisme: actuel - cout, effet: 'Caractéristique supplémentaire en combo (à déclarer avant le jet)' };
    case 'carte-destin':
      return { ok: true, heroisme: actuel - cout, effet: 'Carte du Destin tirée (3 points d\u2019héroïsme)' };
  }
}

/** Gain d'héroïsme par acte de bravoure accordé par le MJ (borné à 6, p.96) */
export function gagnerHeroisme(character: Character, points: number): number {
  return Math.min(HEROISME_MAX, character.jauges.heroisme.current + points);
}

/**
 * Test d'espoir — règle p.96 : échec → −1D6 PEs (ou plus à la volonté du MJ).
 * Jet Sang-Froid combo Hargne (le jet lui-même est hors moteur) ;
 * le résultat (réussite + dé de perte) est injecté.
 */
export function appliquerTestEspoir(character: Character, reussi: boolean, de6: number): { pes: number; perte: number } {
  const perte = reussi ? 0 : Math.max(1, de6); // réussite : aucune perte
  return {
    pes: Math.max(0, character.jauges.pes.current - perte),
    perte,
  };
}

/** À 0 PEs : dépenser 1 point d'héroïsme pour revenir à 1 PEs sans action (p.96) */
export function revenirDuDesespoir(character: Character): ResultatHeroisme {
  return depenserHeroisme({ ...character, jauges: { ...character.jauges } }, 'garder-espoir');
}
