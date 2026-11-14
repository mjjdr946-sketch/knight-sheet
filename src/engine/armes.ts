/**
 * Moteur — dégâts d'armes de contact avec overdrives, bonus OD, évolutions.
 * Annexe arsenal : « Aux armes de contact s'ajoute la Force. Les OD de Force
 * ajoutent +3 dégâts chacun ; les autres OD comptés dans les dégâts
 * n'ajoutent que +1. »
 */
import type { Character, Weapon } from '../types/character';
import { overdriveNiveau } from './stats';

/** Les bonus de traits qui « comptent dans les dégâts » selon les effets d'armes */
const TRAITS_DEGATS = ['force', 'dexterite', 'tir'] as const;
type TraitDegats = (typeof TRAITS_DEGATS)[number];

/**
 * Bonus de dégâts apportés par les overdrives pour une arme de contact.
 * RÈGLES (annexe) :
 * - Force : +3 dégâts PAR NIVEAU d'OD de Force
 * - autres traits comptés (Dextérité via Orfèvrerie, Tir via Précision) : +1 par niveau
 * Interprétation : seuls les traits présents dans le bonus du profil d'arme
 * « comptent dans les dégâts » (ex. Morgenstern lesté = Force ; Dague
 * orfèvrerie = Dextérité ; Railgun précision = Tir).
 */
export function bonusDegatsOD(character: Character, arme: Weapon): number {
  let bonus = 0;
  for (const trait of TRAITS_DEGATS) {
    const present = typeof arme.degats.bonus === 'string' && arme.degats.bonus.includes(trait);
    if (!present) continue;
    const niveau = overdriveNiveau(character, trait);
    bonus += trait === 'force' ? niveau * 3 : niveau;
  }
  return bonus;
}

/**
 * Dégâts de contact effectifs : profil de l'arme + Force (OD inclus ×3).
 * Règle annexe : « aux armes de contact s'ajoute la Force » (base, pas l'OD).
 * Les OD de Force ajoutent leurs +3 séparément (bonusDegatsOD).
 */
export function degatsContactEffectifs(character: Character, arme: Weapon): { des: number; fixe: number } {
  if (arme.type !== 'contact') return { des: arme.degats.nombre, fixe: bonusNumerique(arme.degats.bonus) };
  const force = character.traits.force; // Force de base (sans OD — l'OD passe par bonusDegatsOD)
  const fixe = bonusNumerique(arme.degats.bonus) + force;
  return { des: arme.degats.nombre, fixe: fixe + bonusDegatsOD(character, arme) };
}

/** Extrait la part numérique d'un bonus (ignore les parts de trait) */
function bonusNumerique(bonus: number | string): number {
  if (typeof bonus === 'number') return bonus;
  // ex. '10+force×2' → 10 ; 'force×2' → 0
  const match = bonus.match(/^\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/** Évolutions de la méta-armure atteintes : gloire >= seuilPG (p.140) */
export function evolutionsAtteintes(character: Character) {
  return character.metaArmor.evolutions.filter((evo) => character.gloire >= evo.seuilPG);
}
