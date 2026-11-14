/**
 * Armes de l'arsenal — annexe 2 du livre (pp.414+).
 * Données issues de knight-rules-reference.md, PARTIE 4.
 * Itération 1 : armes de départ de la Paladin + grenades intelligentes + nods.
 * Le catalogue complet (40 armes) est intégré progressivement — voir TODO-RULES.md.
 */
import type { Weapon } from '../types/character';

/**
 * Pistolet de service — arme de base (section, étape 8).
 * Deux modes : contact (1D6+Force, silencieux) et tir (2D6+6, moyenne).
 */
export const pistoletDeService: Weapon = {
  id: 'pistolet-service',
  nom: 'Pistolet de service',
  type: 'contact',
  accessibilite: 'standard',
  coutPG: 15,
  degats: { nombre: 1, faces: 6, bonus: 'force', moyenne: 3 },
  violence: { nombre: 0, faces: 6, bonus: 1 },
  portee: 'contact',
  effets: ['Silencieux'],
  modes: [
    {
      nom: 'Tir',
      degats: { nombre: 2, faces: 6, bonus: 6, moyenne: 6 },
      violence: { nombre: 1, faces: 6, bonus: 0, moyenne: 3 },
      portee: 'moyenne',
      effets: ['Silencieux'],
    },
  ],
  equipee: false,
};

/**
 * Marteau-épieu — arme de base (section, étape 8).
 * Deux modes : contact (3D6+Force, perce armure 40) et chevrotine (3D6+12).
 */
export const marteauEpieu: Weapon = {
  id: 'marteau-epieu',
  nom: 'Marteau-épieu',
  type: 'contact',
  accessibilite: 'standard',
  coutPG: 10,
  degats: { nombre: 3, faces: 6, bonus: 'force', moyenne: 9 },
  violence: { nombre: 1, faces: 6, bonus: 0, moyenne: 3 },
  portee: 'contact',
  effets: ['Perce armure 40'],
  modes: [
    {
      nom: 'Tir — chevrotine incendiaire-lumineuse',
      degats: { nombre: 3, faces: 6, bonus: 12, moyenne: 9 },
      violence: { nombre: 3, faces: 6, bonus: 12, moyenne: 9 },
      portee: 'courte',
      effets: ['Dégâts continus 3', 'Dispersion 3', 'Lumière 2', 'Chargeur 1'],
    },
  ],
  equipee: true,
};

/**
 * Fusil d'assaut — standard, longue portée, deux mains.
 */
export const fusilAssaut: Weapon = {
  id: 'fusil-assaut',
  nom: "Fusil d'assaut",
  type: 'distance',
  accessibilite: 'standard',
  coutPG: 30,
  degats: { nombre: 2, faces: 6, bonus: 6, moyenne: 6 },
  violence: { nombre: 3, faces: 6, bonus: 9, moyenne: 9 },
  portee: 'longue',
  effets: ['Ultraviolence', 'Barrage 2', 'Deux mains'],
  equipee: true,
};

/**
 * Lance-grenade léger (grenade explosive) — standard, dispersion 3.
 */
export const lanceGrenadeLeger: Weapon = {
  id: 'lance-grenade-leger',
  nom: 'Lance-grenade léger — grenade explosive',
  type: 'distance',
  accessibilite: 'standard',
  coutPG: 40,
  degats: { nombre: 4, faces: 6, bonus: 0, moyenne: 12 },
  violence: { nombre: 3, faces: 6, bonus: 0, moyenne: 9 },
  portee: 'moyenne',
  effets: ['Dispersion 3'],
  modes: [
    {
      nom: 'Grenade anti-blindage',
      degats: { nombre: 3, faces: 6, bonus: 10, moyenne: 9 },
      violence: { nombre: 0, faces: 6, bonus: 1 },
      portee: 'moyenne',
      effets: ['Destructeur'],
    },
    {
      nom: 'Grenade incendiaire',
      degats: { nombre: 2, faces: 6, bonus: 0, moyenne: 6 },
      violence: { nombre: 3, faces: 6, bonus: 10, moyenne: 9 },
      portee: 'moyenne',
      effets: ['Dégâts continus 3'],
    },
  ],
  equipee: false,
};

/** Équipement de départ par mission (étape 10, p.174) : 3 nods d'énergie, 3 nods d'armure, 3 nods de soin, 5 grenades intelligentes. */
export const equipementMissionDepart = {
  nodsEnergie: 3,
  nodsArmure: 3,
  nodsSoin: 3,
  grenadesIntelligentes: 5,
};

/**
 * Grenades intelligentes (annexe 2) : pack de 5/mission, type choisi à la commande.
 * Profil commun : 3D6 (9) dégâts, 3D6 (9) violence, portée courte (moyenne avec 1 OD
 * Force, longue avec 2, lointaine avec 3), chargeur 5, ignore les bonus de réaction
 * des couverts.
 */
export const grenadeShrapnel: Weapon = {
  id: 'grenade-shrapnel',
  nom: 'Grenade intelligente — shrapnel',
  type: 'distance',
  accessibilite: 'standard',
  coutPG: 0, // pack de 5 offert par mission
  degats: { nombre: 3, faces: 6, bonus: 0, moyenne: 9 },
  violence: { nombre: 3, faces: 6, bonus: 0, moyenne: 9 },
  portee: 'courte',
  effets: ['Ultraviolence', 'Meurtrier', 'Dispersion 6', 'Chargeur 5'],
  equipee: false,
};
