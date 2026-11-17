/**
 * Capacités des 6 classes restantes (prompt v10, digest PARTIE 6 pp.141-170).
 * Fonctions PURES : coût + effet calculés ici, le store débite et applique.
 * Chaque règle cite sa page. Sources : Warrior p.136, Warmaster p.148,
 * Rogue p.152, Ranger p.156-157, Bard p.160, Wizard p.164-165.
 */
import type { Character, AspectId, TraitId } from '../types/character';

// ─── WARRIOR — Les « Types » (p.136) ────────────────────────────────────────

export const TYPES_WARRIOR: { id: string; nom: string; aspect: AspectId; traits: TraitId[] }[] = [
  { id: 'soldier', nom: 'Soldier', aspect: 'chair', traits: ['deplacement', 'force', 'endurance'] },
  { id: 'hunter', nom: 'Hunter', aspect: 'bete', traits: ['hargne', 'combat', 'instinct'] },
  { id: 'scholar', nom: 'Scholar', aspect: 'machine', traits: ['tir', 'savoir', 'technique'] },
  { id: 'herald', nom: 'Herald', aspect: 'dame', traits: ['aura', 'parole', 'sangfroid'] },
  { id: 'scout', nom: 'Scout', aspect: 'masque', traits: ['discretion', 'dexterite', 'perception'] },
];

/** Coût d'activation d'un type : 1 PE/tour en conflit, 6 PE par scène hors conflit (p.136) */
export function coutTypeWarrior(enConflit: boolean): number {
  return enConflit ? 1 : 6;
}

/** OD fournies par le type actif : 1 niveau dans les 3 caractéristiques de l'aspect (p.136).
 * Hors limite de 5 — utilisables même au-delà (Warrior seul, p.130). */
export function odDuType(typeId: string): { trait: TraitId; niveau: number; origine: string }[] {
  const type = TYPES_WARRIOR.find((t) => t.id === typeId);
  if (!type) return [];
  return type.traits.map((trait) => ({ trait, niveau: 1, origine: 'type-warrior' }));
}

// ─── WARMASTER — Impulsions de Warlord (p.148) ──────────────────────────────

export interface Impulsion {
  id: string;
  nom: string;
  coutParAllie: number;
  coutPorteur?: number; // surcoût si le porteur s'inclut (impulsion Action uniquement, p.148)
  effet: string;
}

export const IMPULSIONS_WARLORD: Impulsion[] = [
  { id: 'action', nom: 'Action', coutParAllie: 4, coutPorteur: 10, effet: '1 action de combat OU de déplacement supplémentaire au prochain tour' },
  { id: 'esquive', nom: 'Esquive', coutParAllie: 3, effet: 'Défense et réaction +2 au prochain tour' },
  { id: 'force', nom: 'Force', coutParAllie: 2, effet: 'CdF +2 au prochain tour' },
  { id: 'guerre', nom: 'Guerre', coutParAllie: 1, effet: 'Dégâts et violence +1D6 au prochain tour' },
  { id: 'energie', nom: 'Énergie', coutParAllie: 0, effet: 'Transfert de 1 à 5 PE à un allié (pas à soi-même)' },
];

/** Coût total d'une impulsion (porteur inclus ou non, p.148) */
export function coutImpulsion(impulsionId: string, nbAllies: number, inclutPorteur: boolean): number {
  const imp = IMPULSIONS_WARLORD.find((i) => i.id === impulsionId);
  if (!imp) return 0;
  if (impulsionId === 'energie') return 0; // coût = PE transférés (1-5), géré par l'appelant
  return imp.coutParAllie * nbAllies + (inclutPorteur ? imp.coutPorteur ?? 0 : 0);
}

/** Impulsion sur SOI : condition temporaire générée (prochain tour) */
export function conditionImpulsion(impulsionId: string): { id: string; nom: string; effets: { cible: string; valeur: number; type: string }[] } | null {
  switch (impulsionId) {
    case 'esquive':
      return { id: 'impulsion-esquive', nom: 'Impulsion Esquive (1 tour)', effets: [
        { cible: 'defense', valeur: 2, type: 'bonus' },
        { cible: 'reaction', valeur: 2, type: 'bonus' },
      ] };
    case 'force':
      return { id: 'impulsion-force', nom: 'Impulsion Force (1 tour)', effets: [{ cible: 'cdf', valeur: 2, type: 'bonus' }] };
    case 'guerre':
      return { id: 'impulsion-guerre', nom: 'Impulsion Guerre (1 tour)', effets: [{ cible: 'degats', valeur: 1, type: 'bonus' }] };
    default:
      return null; // Action/Énergie : pas d'effet auto sur soi
  }
}

// ─── ROGUE — Mode Ghost (p.152) ─────────────────────────────────────────────

/** Coût Ghost : 2 PE/tour en conflit, 6 PE/minute hors conflit (p.152) */
export function coutGhost(enConflit: boolean): number {
  return enConflit ? 2 : 6;
}

/** Attaque qui brise l'invisibilité (1re attaque du tour, p.152) :
 * bonus en dés + bonus fixe aux dégâts = Discrétion du porteur (OD inclus). */
export function bonusAttaqueSurpriseGhost(character: Character): { desSupplementaires: number; bonusFixe: number } {
  const od = character.overdrives.filter((o) => o.trait === 'discretion').reduce((a, o) => a + o.niveau, 0);
  const discretion = character.traits['discretion'] + od;
  return { desSupplementaires: discretion, bonusFixe: discretion };
}

// ─── RANGER — Fusil Longbow (p.156) + Vision (p.157) ────────────────────────

export const EFFETS_LONGBOW_2PE = ['dégâts continus 3', 'silencieux', 'choc 1', 'perce armure 40', 'ultraviolence', 'désignation'];
export const EFFETS_LONGBOW_3PE = ['lumière 4', 'dispersion 3', 'artillerie', 'pénétrant 6', 'perce armure 60', 'anti-véhicule'];

export interface ConfigLongbow {
  /** +1D6 par point (dégâts OU violence, max 6D6 générés) */
  desDegats: number;
  desViolence: number;
  /** portée +1 par point (moyenne → longue → lointaine, p.156) */
  porteePlus: number;
  effets2PE: string[]; // max 3
  effets3PE: string[]; // max 3
}

/** Coût total d'une configuration de tir Longbow (p.156) */
export function coutLongbow(cfg: ConfigLongbow): number {
  const base = 3; // 3D6 de base : chaque +1D6 coûte 1 PE
  const cout = cfg.desDegats + cfg.desViolence + cfg.porteePlus
    + cfg.effets2PE.length * 2 + cfg.effets3PE.length * 3;
  void base;
  return cout;
}

/** Valide et applique la config : bornes p.156 (max 6D6 générés, 3 effets max par palier) */
export function profilLongbow(cfg: ConfigLongbow): { degats: number; violence: number; portee: 2 | 3 | 4; effets: string[]; valide: boolean; erreur?: string } {
  const generes = 3 + cfg.desDegats; // D6 générés (base 3D6)
  if (generes > 6) return { degats: 0, violence: 0, portee: 2, effets: [], valide: false, erreur: 'Max 6D6 générés (9D6 lancés avec assistance, p.156)' };
  if (cfg.effets2PE.length > 3 || cfg.effets3PE.length > 3) return { degats: 0, violence: 0, portee: 2, effets: [], valide: false, erreur: '3 effets max par palier (p.156)' };
  const portee = Math.min(4, 2 + cfg.porteePlus) as 2 | 3 | 4; // 2=moyenne, 3=longue, 4=lointaine
  return {
    degats: generes,
    violence: 1 + cfg.desViolence,
    portee,
    effets: [...cfg.effets2PE, ...cfg.effets3PE],
    valide: true,
  };
}

/** Vision : coût 5 à 10 PE (au MJ), durée 6 s (p.157) */
export function coutVision(niveau: number): number {
  return Math.max(5, Math.min(10, niveau));
}

// ─── BARD — Changeling (p.160) ──────────────────────────────────────────────

export function coutChangeling(transformation: boolean, tailleEtendue: boolean, fauxEtres: number): number {
  return (transformation ? 6 : 0) + (tailleEtendue ? 8 : 0) + fauxEtres * 3;
}

/** Percer l'illusion (p.160) : PNJ Machine difficulté 6, PJ Perception difficulté 3 */
export const DIFFICULTE_PERCER_CHANGELING = { pnj: 6, pj: 3 };

// ─── WIZARD — Borealis (p.164) + Oriflamme (p.165) ──────────────────────────

/** Borealis bénédiction d'armes : 6 PE (+2 PE par allié supplémentaire ou soi-même, p.164) */
export function coutBenedictionArmes(nbAllies: number): number {
  return 6 + Math.max(0, nbAllies) * 2;
}

/** Attaque plasma : 4D6 / 4D6 / courte / anti-Anathème + dégâts continus 3 — 2 PE (p.164) */
export const ATTAQUE_PLASMA = { degats: 4, violence: 4, portee: 'courte', coutPE: 2, effets: ['anti-Anathème', 'dégâts continus 3'] };

/** Utilitaire plasma : 6 PE, 6 tours/1 minute (p.164) */
export const UTILITAIRE_PLASMA = { coutPE: 6, duree: '6 tours / 1 minute' };

/** Oriflamme : 6D6+6 dégâts / 6D6+12 violence / courte / anti-Anathème + lumière 2 — 12 PE (p.165) */
export const ORIFLAMME = { degatsDes: 6, degatsFixe: 6, violenceDes: 6, violenceFixe: 12, coutPE: 12, portee: 'courte', effets: ['anti-Anathème', 'lumière 2'] };

// ─── TRANCHAGE it. 8 §0 : relance d'exploit SANS cascade (p.78) ─────────────

/** Une seule relance par jet, même si la relance est elle-même un exploit.
 * Fige la tranchage validé par NunnuN : le livre ne prévoit pas de cascade. */
export function relancesAutorisees(niveau: number): number {
  void niveau;
  return 1; // règle : une seule relance, jamais de cascade (tranchage it. 8 §0)
}
