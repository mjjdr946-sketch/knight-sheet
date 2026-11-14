/**
 * Moteur de calcul — résolution des dégâts.
 * Ordre de protection (règle p.130/§1.9) : CdF d'abord, puis PA, puis PS.
 * Toutes les fonctions sont pures : elles retournent les nouvelles jauges,
 * sans jamais muter le personnage d'entrée.
 */
import type { Character } from '../types/character';
import { computeCdF } from './stats';

export interface DamageInput {
  /** Score de dégâts subis (un jet ou la moyenne basse du livre, règle p.89) */
  degats: number;
  /** Effet 'ignore CdF' : le champ de force est ignoré (règle p.130) */
  ignoreCdF?: boolean;
  /** Effet 'ignore armure' : les PA sont ignorés, santé touchée directement (p.130) */
  ignoreArmure?: boolean;
  /** Effet 'perce armure X' : X points de PA ignorés (total si X ≥ PA — annexe) */
  perceArmure?: number;
  /** Effet 'pénétrant X' : X points de CdF ignorés (total si X ≥ CdF — annexe) */
  penetrant?: number;
  /**
   * Cible de type 'colosse' (PNJ/véhicule) : tranches complètes de 10 dégâts
   * au lieu de 5 pour la contre-choc des PA — règle p.103/104. Pour un PJ ce
   * flag n'est pas utilisé ; il sert si l'app gère des PNJ un jour.
   */
  colosse?: boolean;
}

export interface DamageResult {
  /** Dégâts restants après CdF (0 si le CdF a tout absorbé) */
  degatsApresCdF: number;
  /** Dégâts effectivement absorbés par les PA */
  degatsSurPA: number;
  /** Dégâts restants touchant les PS après les PA */
  degatsSurPS: number;
  /** PS perdus par « secousse dans l'armure » (1 par tranche complète de 5 PA encaissés — p.130) */
  psPerdusTranche: number;
  nouvellesJauges: {
    pa: number;
    ps: number;
  };
  /** L'armure se folde automatiquement à 0 PA (règle p.130) */
  armureFoldedAuto: boolean;
}

/**
 * Résout un paquet de dégâts contre le personnage.
 * Règles appliquées :
 * - p.130 : CdF retranché de chaque score de dégâts ; total à 0 → aucun dégât.
 * - p.130 : PA touchés avant PS ; chaque tranche complète de 5 dégâts sur les
 *   PA inflige 1 PS (« secoué dans son armure »). Ex. du livre : 7 dégâts sur
 *   les PA → 1 PS perdu + 2 restants sur l'armure.
 * - p.130 : à 0 PA, la méta-armure se folde automatiquement (Guardian).
 * - Avantage Infatigable (lame I, p.122) : pas de PS perdus pour dégâts à l'armure.
 * - Colosse (p.103) : tranches de 10 au lieu de 5.
 */
export function applyDamage(character: Character, input: DamageInput): DamageResult {
  let cdf = computeCdF(character);
  const paJauge = character.jauges.pa.current;
  const psActuels = character.jauges.ps.current;

  // PA effectifs pour l'absorption :
  // - ignore armure (p.130) : PA ignorés, la jauge PA reste intouchée
  // - perce armure X (annexe) : X de PA ignorés (total si X ≥ PA)
  const paIgnores = !!input.ignoreArmure;
  const paAbsorption = paIgnores
    ? 0
    : input.perceArmure
      ? Math.max(0, paJauge - input.perceArmure)
      : paJauge;

  // pénétrant X (annexe) : X de CdF ignorés (total si X ≥ CdF)
  if (input.penetrant) {
    cdf = Math.max(0, cdf - input.penetrant);
  }

  // p.130 : le CdF se retranche de chaque score de dégâts (sauf ignore CdF)
  const apresCdF = input.ignoreCdF ? input.degats : Math.max(0, input.degats - cdf);
  if (apresCdF === 0) {
    // total ramené à 0 → aucun dégât (ni PA ni PS)
    return {
      degatsApresCdF: 0,
      degatsSurPA: 0,
      degatsSurPS: 0,
      psPerdusTranche: 0,
      nouvellesJauges: { pa: paJauge, ps: psActuels },
      armureFoldedAuto: false,
    };
  }

  return resoudre(character, apresCdF, paAbsorption, paJauge, psActuels, input.colosse ?? false, paIgnores);
}

function resoudre(
  character: Character,
  degatsApresCdF: number,
  paAbsorption: number,
  paJauge: number,
  psActuels: number,
  colosse: boolean,
  paIgnores: boolean,
): DamageResult {
  // Infatigable (lame I) : pas de PS perdus pour dégâts à l'armure
  const infatigable = character.identite.cartes.some((c) =>
    c.avantagesRetenus.some((a) => a.startsWith('Infatigable')),
  );

  const tranche = colosse ? 10 : 5; // colosse p.103 : tranches de 10

  // ignore armure : les PA ne jouent pas du tout — la jauge PA reste intouchée
  const degatsSurPA = paIgnores ? 0 : Math.min(degatsApresCdF, paAbsorption);
  const restantSurPS = degatsApresCdF - degatsSurPA;

  // « secousse » : 1 PS par tranche complète de 5 (ou 10) dégâts ABSORBÉS par les PA
  // Ex. du livre p.130 : 7 dégâts sur les PA → 1 PS perdu.
  const psPerdusTranche = infatigable ? 0 : Math.floor(degatsSurPA / tranche);

  // perce armure : les PA "ignorés" ne partagent pas des dégâts — le retrait
  // des X points ignorés n'est qu'une limite d'absorption, pas une perte de jauge
  const nouveauPA = paIgnores ? paJauge : Math.max(0, paJauge - degatsSurPA);
  const nouveauPS = Math.max(0, psActuels - restantSurPS - psPerdusTranche);

  return {
    degatsApresCdF,
    degatsSurPA,
    degatsSurPS: restantSurPS,
    psPerdusTranche,
    nouvellesJauges: { pa: nouveauPA, ps: nouveauPS },
    // règle p.130 : à 0 PA, l'armure se folde automatiquement
    armureFoldedAuto: !paIgnores && nouveauPA <= 0,
  };
}
