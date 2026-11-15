/**
 * Moteur — PNJ / adversaires (digest PARTIE 2, règles pp.100-104).
 * Types : hostile, salopard, patron, colosse, bande, allié.
 * Règles clés :
 * - Colosses (p.103) : tranches complètes de 10 dégâts = 1 PS ou 1 PA ;
 *   l'effet anti-véhicule compense. Tous les véhicules sont colosses (p.104).
 * - Points faibles (p.103) : attaquer avec la caractéristique (ou combo)
 *   indiquée → défense/réaction du PNJ DIVISÉE PAR 2 (arrondi inférieur,
 *   une seule fois même si plusieurs points faibles cumulés).
 * - Bandes (p.100) : cohésion (seule la VIOLENCE la fait baisser),
 *   débordement cumulé chaque tour, initiative 1, ni PS ni PEs ni PE.
 * - Le MJ ne révèle pas défense/réaction (p.86) — le panneau UI gère le
 *   mode MJ (valeurs masquées, seul TOUCHE/RATE affiché).
 */
import type { TraitId } from '../types/character';

export type TypePNJ = 'hostile' | 'salopard' | 'patron' | 'colosse' | 'bande' | 'allie';

export interface Adversaire {
  id: string;
  nom: string;
  type: TypePNJ;
  /** Seuil au contact (à dépasser strictement) — valeur MJ */
  defense: number;
  /** Seuil au tir/lancer */
  reaction: number;
  pa: number;
  /** undefined = n'a pas de PS (certains PNJ n'ont que des PA, p.100) */
  ps?: number;
  /** Bouclier/cdF des créatures de l'Anathème (p.103) — se soustrait comme un CdF */
  cdf?: number;
  /** Points faibles : défense/réaction ÷2 si attaquée avec ce trait (p.103) */
  pointsFaibles: TraitId[];
  /** Bande uniquement : cohésion (baissee par la violence) */
  cohesion?: number;
  /** Bande uniquement : débordement infligé automatiquement, cumulé par tour */
  debordement?: number;
  /** Mode MJ : les valeurs défensives ne sont pas affichées à l'écran */
  modeMj?: boolean;
}

/**
 * Défense/réaction effective contre une attaque portée avec `traitAttaque`.
 * Point faible (p.103) : division par 2, arrondi inférieur, UNE SEULE FOIS
 * même si plusieurs points faibles correspondent.
 */
export function seuilEffectif(adv: Adversaire, traitAttaque: TraitId, auTir: boolean): number {
  const base = auTir ? adv.reaction : adv.defense;
  const pointFaible = adv.pointsFaibles.includes(traitAttaque);
  return pointFaible ? Math.floor(base / 2) : base;
}

export interface ResultatDegatsPNJ {
  /** dégâts restants après bouclier/CdF */
  apresCdf: number;
  degatsSurPA: number;
  degatsSurPS: number;
  /** colosse : tranches de 10 — dégâts ignorés par la règle des tranches */
  degatsIgnoresTranche: number;
  /** cohésion perdue par la violence (bande uniquement) */
  cohésionPerdue: number;
  /** nouveaux scores */
  pa: number;
  ps?: number;
  cohesion?: number;
  /** 0 PA/PS → détruit/à l'agonie (règles par type) */
  detruit: boolean;
  /** cohésion à 0 → bande en fuite ou anéantie (p.100) */
  bandeDefaite: boolean;
}

/**
 * Applique un paquet de dégâts à un adversaire.
 * - p.130/§1.9 : bouclier/CdF retranché d'abord (sauf effet ignore CdF).
 * - p.100 : PA touchés avant PS ; certains PNJ n'ont QUE des PA.
 * - p.103 colosse : tranches complètes de 10 → 1 point (25 dégâts → 2 perdus,
 *   5 ignorés). Anti-véhicule : dégâts normaux SANS tranches (compense).
 * - p.100 bande : les dégâts normaux ne peuvent PAS baisser la cohésion —
 *   seule la violence le peut.
 */
export function subirDegatsPNJ(
  adv: Adversaire,
  degats: number,
  options: { violence?: number; ignoreCdf?: boolean; antiVehicule?: boolean } = {},
): ResultatDegatsPNJ {
  const colosse = adv.type === 'colosse' || adv.type === 'bande'; // véhicules = colosses ; bandes : voir cohésion
  let cdf = adv.cdf ?? 0;
  if (options.ignoreCdf) cdf = 0;

  const apresCdf = Math.max(0, degats - cdf);

  // Bande : les dégâts normaux ne touchent pas la cohésion (p.100)
  const cohésionPerdue = options.violence ?? 0;
  const estBande = adv.type === 'bande';
  if (estBande) {
    const nouvelleCohesion = Math.max(0, (adv.cohesion ?? 0) - cohésionPerdue);
    return {
      apresCdf,
      degatsSurPA: 0,
      degatsSurPS: 0,
      degatsIgnoresTranche: 0,
      cohésionPerdue,
      pa: adv.pa,
      ps: adv.ps,
      cohesion: nouvelleCohesion,
      detruit: false,
      bandeDefaite: nouvelleCohesion <= 0,
    };
  }

  // Tranches colosses : 25 dégâts → 2 perdus, 5 ignorés (p.103)
  let effectifs = apresCdf;
  let degatsIgnoresTranche = 0;
  if (colosse && !options.antiVehicule && adv.type === 'colosse') {
    const perdus = Math.floor(effectifs / 10);
    degatsIgnoresTranche = effectifs - perdus * 10;
    effectifs = perdus;
  }

  // PA d'abord, puis PS (les colosses "perdus" sont des POINTS, pas des dégâts)
  const surPA = Math.min(effectifs, adv.pa);
  const restant = effectifs - surPA;
  const psInitial = adv.ps ?? 0;
  const surPS = Math.min(restant, psInitial);
  const nouveauPA = Math.max(0, adv.pa - surPA);
  const nouveauPS = (adv.ps ?? 0) - surPS;

  return {
    apresCdf,
    degatsSurPA: surPA,
    degatsSurPS: surPS,
    degatsIgnoresTranche,
    cohésionPerdue: 0,
    pa: nouveauPA,
    ps: adv.ps !== undefined ? Math.max(0, nouveauPS) : undefined,
    cohesion: adv.cohesion,
    detruit: nouveauPA <= 0 && (adv.ps === undefined || nouveauPS <= 0),
    bandeDefaite: false,
  };
}

/**
 * Débordement d'une bande (p.100) : infligé automatiquement à tous les
 * ennemis à portée, et SE CUMULE chaque tour (ex. débordement 8 :
 * 8, puis 16, puis 24…). @param tour numéro du tour (1-based).
 */
export function debordementCumule(adv: Adversaire, tour: number): number {
  if (adv.type !== 'bande') return 0;
  return (adv.debordement ?? 0) * Math.max(1, tour);
}

/** Initiative des PNJ — les bandes jouent toujours à initiative 1 (p.100) */
export function initiativePNJ(adv: Adversaire, jet3d6: number): number {
  if (adv.type === 'bande') return 1; // règle p.100
  return jet3d6 + 0; // les scores PNJ fonctionnent comme les PJ (p.100) — saisis dans le panneau
}

/** Transformation d'un adversaire en version MJ (valeurs masquées) */
export function masquerValeurs(adv: Adversaire): Adversaire {
  return { ...adv, modeMj: true };
}
