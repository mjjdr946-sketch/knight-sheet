/**
 * Moteur — combat contre les véhicules (livre pp.104-106).
 * Tous les véhicules sont des colosses (tranches de 10 — géré par
 * subirDegatsPNJ avec type 'colosse').
 */
import type { Vehicule } from '../data/vehicules';

/**
 * Tir sur le véhicule (p.104) : test base Tir opposé à la réaction du
 * pilote + manœuvrabilité (si le véhicule en dispose et est en mouvement).
 * Sans pilote et à portée : touché automatiquement.
 */
export function reactionVehicule(vehicule: Vehicule, reactionPilote: number, enMouvement: boolean, avecPilote: boolean): number {
  if (!avecPilote) return 0; // touché automatiquement
  return reactionPilote + (enMouvement ? vehicule.manoeuvrabilite : 0);
}

/**
 * Frapper le véhicule au contact (p.104) :
 * - stationnaire à portée : touché automatiquement
 * - en mouvement : difficulté = 3 × la vitesse du véhicule (vitesse 0 :
 *   1 réussite suffit)
 */
export function difficulteFrappeVehicule(vehicule: Vehicule, enMouvement: boolean): number | null {
  if (!enMouvement) return null; // touché automatiquement
  return vehicule.vitesse === 0 ? 1 : 3 * vehicule.vitesse;
}

/**
 * Sauter sur le véhicule (p.104) : test base Déplacement, difficulté =
 * 3 × la vitesse. Une fois dessus : attaques touchent automatiquement,
 mais équilibre à chaque tour (1 action de déplacement, base Dextérité).
 */
export function difficulteSautVehicule(vehicule: Vehicule): number {
  return 3 * vehicule.vitesse;
}

/**
 * Passagers (p.104) : par tranche complète de 5 PA perdus par le véhicule,
 * les passagers subissent 1 point de perte de santé (secousses), sans CdF
 * ni prise en compte de leurs PA.
 */
export function psPassagersPerdus(paPerdus: number): number {
  return Math.floor(Math.max(0, paPerdus) / 5);
}

/** Poursuite (p.105) : −3 dés au test semer/rattraper par point d'écart de vitesse */
export function malusPoursuite(maVitesse: number, vitesseAdversaire: number): number {
  const ecart = vitesseAdversaire - maVitesse;
  return ecart > 0 ? ecart * 3 : 0;
}
