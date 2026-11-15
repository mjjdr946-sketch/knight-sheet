/**
 * Moteur — attaque du Paladin, règles p.76-89.
 * Fonction PURE : prépare le jet (nombre de dés, réussites automatiques,
 * modificateurs de style, dés sacrifiés) SANS lancer les dés — le lancer
 * passe par engine/dice (injectable).
 */
import type { Character, TraitId, Weapon } from '../types/character';
import { overdriveNiveau } from './stats';

export interface OptionsAttaque {
  /** Combo : caractéristique ajoutée aux dés (défaut selon le type d'arme) */
  comboTrait?: TraitId;
  /** Style Précis : 3ᵉ caractéristique ajoutée (réussites auto ignorées — p.88) */
  troisiemeTrait?: TraitId;
  /** Style Puissant : dés de toucher sacrifiés → dégâts (max 6, p.89) */
  sacrificeDes?: number;
  /** Style Pilonnage : dés de dégâts cumulés des tours précédents (max 6, p.89) */
  pileDegats?: number;
}
export interface PreparationAttaque {
  /** Caractéristique de base du jet */
  base: TraitId;
  /** Caractéristique de combo */
  combo: TraitId | null;
  /** Nombre de dés = base + combo (+ style − sacrifices) */
  nbDes: number;
  /** Réussites automatiques des OD de base et combo (+1 par niveau, p.130) */
  reussitesAuto: number;
  /** Malus de dés du style (agressif +3 = bonus, affiché à part) */
  bonusDesStyle: number;
  malusDesStyle: number;
  /** Dés de toucher sacrifiés (style Puissant) — à convertir en dégâts */
  desSacrifies: number;
  /** Dés de dégâts supplémentaires (style Pilonnage, max +6) */
  desDegatsPile: number;
  /** Mode de tir (akimbo/ambidextre gérés côté UI selon les armes en main) */
  detail: string[];
}

/** Trait de base et combo par défaut selon le type d'arme (annexe + p.76-78) */
function traitsParDefaut(arme: Weapon): { base: TraitId; combo: TraitId | null } {
  if (arme.type === 'contact') {
    // contact : base Combat, combo Force (la Force s'ajoute aussi aux dégâts)
    return { base: 'combat', combo: 'force' };
  }
  // tir : base Tir ; combo pertinent fourni en option (sinon aucun)
  return { base: 'tir', combo: null };
}

/**
 * Prépare une attaque — règle p.76-89 :
 * - dés = base + combo (+ 3ᵉ carac du style Précis, + bonus du style Agressif)
 * - OD : +1 réussite auto par niveau sur base et combo (p.130)
 * - styles : Agressif +3 dés / Défensif-Couvert-Ambidextre-Akimbo −3 /
 *   Pilonnage −2 / Puissant sacrifice jusqu'à 6 (p.87-89)
 */
export function computeAttack(character: Character, arme: Weapon, styleId: string, options: OptionsAttaque = {}): PreparationAttaque {
  const defauts = traitsParDefaut(arme);
  const base = defauts.base;
  const combo = options.comboTrait ?? defauts.combo;

  const detail: string[] = [];
  let nbDes = character.traits[base] + (combo ? character.traits[combo] : 0);
  detail.push(`Base ${base} ${character.traits[base]} + combo ${combo ?? '—'} ${combo ? character.traits[combo] : 0} = ${nbDes} dés`);

  // Réussites automatiques : OD de base + combo (+1 par niveau, p.130)
  let reussitesAuto = overdriveNiveau(character, base) + (combo ? overdriveNiveau(character, combo) : 0);
  if (reussitesAuto > 0) detail.push(`Overdrives : +${reussitesAuto} réussites auto`);

  // Style Précis (p.88) : 3ᵉ caractéristique au combo, réussites auto ignorées
  if (styleId === 'precis' && options.troisiemeTrait) {
    const t3 = options.troisiemeTrait;
    nbDes += character.traits[t3];
    detail.push(`Style Précis : +${character.traits[t3]} (${t3}, OD ignorées pour ce trait)`);
  }

  // Akimbo (p.87-88) : 2 armes IDENTIQUES en main → cumul des dés de dégâts,
  // bonus fixe compté 1 FOIS. Détection automatique : une autre arme équipée
  // avec le même id que l'arme attaquante.
  const jumelle = styleId === 'akimbo'
    ? character.armes.find((a) => a.id === arme.id && a !== arme && a.equipee)
    : undefined;
  if (jumelle) {
    nbDes += jumelle.degats.nombre;
    detail.push(`Akimbo : +${jumelle.degats.nombre} dés de la 2ᵉ ${arme.nom} (bonus fixe compté 1 fois, p.87)`);
  }

  // Modificateurs de style sur les dés d'attaque (p.87-89)
  let bonusDesStyle = 0;
  let malusDesStyle = 0;
  switch (styleId) {
    case 'agressif':
      bonusDesStyle = 3;
      detail.push('Style Agressif : +3 dés d\u2019attaque');
      break;
    case 'defensif':
    case 'couvert':
      malusDesStyle = 3;
      detail.push('Style : −3 dés d\u2019attaque');
      break;
    case 'ambidextre':
      malusDesStyle = 3; // ambidextre (2 armes NON identiques) : −3 dés (p.87)
      detail.push('Style Ambidextre : −3 dés');
      break;
    case 'akimbo':
      malusDesStyle = jumelle ? 1 : 0; // jumelé : malus réduit à 1 dé (annexe)
      if (jumelle) detail.push('Armes jumelées : −1 dé');
      break;
    case 'pilonnage':
      malusDesStyle = 2;
      detail.push('Style Pilonnage : −2 dés');
      break;
    case 'puissant':
      malusDesStyle = 0;
      break;
    default:
      break;
  }

  // Style Puissant (p.89) : sacrifice de dés de toucher → dégâts (max 6)
  const desSacrifies = Math.min(6, Math.max(0, options.sacrificeDes ?? 0));
  if (desSacrifies > 0) {
    detail.push(`Style Puissant : ${desSacrifies} dés de toucher → dégâts`);
  }

  // Style Pilonnage (p.89) : +1 dé de dégâts par tour précédé de tir (max +6)
  const desDegatsPile = Math.min(6, Math.max(0, options.pileDegats ?? 0));
  if (desDegatsPile > 0) {
    detail.push(`Pilonnage cumulé : +${desDegatsPile} dés de dégâts`);
  }

  const effectif = Math.max(0, nbDes + bonusDesStyle - malusDesStyle - desSacrifies);

  return {
    base,
    combo,
    nbDes: effectif,
    reussitesAuto,
    bonusDesStyle,
    malusDesStyle,
    desSacrifies,
    desDegatsPile,
    detail,
  };
}

/**
 * Dés de dégâts pour une touche : profil de l'arme (+ pile Pilonnage,
 * + dés sacrifiés du style Puissant). Akimbo (cumul des 2 armes) géré
 * côté UI — le style passe les deux profils.
 */
export function desDegatsTouche(arme: Weapon, prep: PreparationAttaque): { nombreDes: number; fixe: number } {
  // bonus fixe numérique du profil (les traits Force/Dextérité passent par
  // degatsContactEffectifs côté affichage)
  const fixe = typeof arme.degats.bonus === 'number' ? arme.degats.bonus : 0;
  return {
    nombreDes: arme.degats.nombre + prep.desDegatsPile + prep.desSacrifies,
    fixe,
  };
}
