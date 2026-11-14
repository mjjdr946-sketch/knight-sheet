/**
 * Armes de l'arsenal — annexe 2 du livre (pp.414+), table ARMES complète.
 * Source de vérité : digest knight-dev-pack PARTIE 4 (lignes 670-739).
 * Chaque ligne nommée de la table = une Weapon ; les lignes « (même arme) »
 * (et les munitions alternatives du même lanceur) deviennent des WeaponMode[].
 *
 * Convention bonus : 'force' | 'force×2' | 'dexterite' | 'tir' | number,
 * composés sous forme de chaîne ('force+dexterite', '6+tir', '2+force'…).
 * moyenne = la valeur entre parenthèses du livre ; omise si absente.
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

/** Shotgun escamotable — standard, distance, deux mains. */
export const shotgunEscamotable: Weapon = {
  id: 'shotgun-escamotable',
  nom: 'Shotgun escamotable',
  type: 'distance',
  accessibilite: 'standard',
  coutPG: 20,
  degats: { nombre: 2, faces: 6, bonus: 10, moyenne: 6 },
  violence: { nombre: 2, faces: 6, bonus: 0, moyenne: 6 },
  portee: 'moyenne',
  effets: ['Meurtrier', 'Choc 1', 'Barrage 2', 'Deux mains'],
  equipee: false,
};

/** Pistolet mitrailleur — standard, jumelé (akimbo). */
export const pistoletMitrailleur: Weapon = {
  id: 'pistolet-mitrailleur',
  nom: 'Pistolet mitrailleur',
  type: 'distance',
  accessibilite: 'standard',
  coutPG: 25,
  degats: { nombre: 3, faces: 6, bonus: 0, moyenne: 9 },
  violence: { nombre: 4, faces: 6, bonus: 0, moyenne: 12 },
  portee: 'moyenne',
  effets: ['Meurtrier', 'Ultraviolence', 'Jumelé (akimbo)'],
  equipee: false,
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

/** Fusil de précision — standard, lointaine, ajoute le Tir aux dégâts (précision). */
export const fusilPrecision: Weapon = {
  id: 'fusil-precision',
  nom: 'Fusil de précision',
  type: 'distance',
  accessibilite: 'standard',
  coutPG: 40,
  degats: { nombre: 4, faces: 6, bonus: '6+tir', moyenne: 12 },
  violence: { nombre: 1, faces: 6, bonus: 0, moyenne: 3 },
  portee: 'lointaine',
  effets: [
    'Tir en sécurité',
    'Précision',
    "Assistance à l'attaque",
    'Désignation',
    'Deux mains',
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

/** Morgenstern — standard, contact, lesté (Force ×2). */
export const morgenstern: Weapon = {
  id: 'morgenstern',
  nom: 'Morgenstern',
  type: 'contact',
  accessibilite: 'standard',
  coutPG: 15,
  degats: { nombre: 3, faces: 6, bonus: 'force×2', moyenne: 9 },
  violence: { nombre: 1, faces: 6, bonus: 0, moyenne: 3 },
  portee: 'contact',
  effets: ['Lesté'],
  equipee: false,
};

/** Couteau de combat — standard, orfèvrerie (Force + Dextérité). */
export const couteauCombat: Weapon = {
  id: 'couteau-combat',
  nom: 'Couteau de combat',
  type: 'contact',
  accessibilite: 'standard',
  coutPG: 15,
  degats: { nombre: 3, faces: 6, bonus: 'force+dexterite', moyenne: 9 },
  violence: { nombre: 1, faces: 6, bonus: 0, moyenne: 3 },
  portee: 'contact',
  effets: ['Orfèvrerie', 'Silencieux', 'Jumelé (ambidextrie)'],
  equipee: false,
};

/** Bouclier amovible — standard, défense 2 ; mode charge explosive. */
export const bouclierAmovible: Weapon = {
  id: 'bouclier-amovible',
  nom: 'Bouclier amovible',
  type: 'contact',
  accessibilite: 'standard',
  coutPG: 20,
  degats: { nombre: 0, faces: 6, bonus: '1+force' },
  violence: { nombre: 0, faces: 6, bonus: 1 },
  portee: 'contact',
  effets: ['Défense 2', 'Jumelé (ambidextrie)'],
  modes: [
    {
      nom: 'Charge explosive (déployée)',
      degats: { nombre: 2, faces: 6, bonus: 6, moyenne: 6 },
      violence: { nombre: 2, faces: 6, bonus: 6, moyenne: 6 },
      portee: 'courte',
      effets: ['Lumière 4', 'Anti-Anathème', 'Chargeur 1'],
    },
  ],
  equipee: false,
};

/** Ceste lourd — standard, lesté, jumelé (akimbo). */
export const cesteLourd: Weapon = {
  id: 'ceste-lourd',
  nom: 'Ceste lourd',
  type: 'contact',
  accessibilite: 'standard',
  coutPG: 20,
  degats: { nombre: 3, faces: 6, bonus: 'force×2', moyenne: 9 },
  violence: { nombre: 1, faces: 6, bonus: 0, moyenne: 3 },
  portee: 'contact',
  effets: ['Lesté', 'Jumelé (akimbo)'],
  equipee: false,
};

/** Épée bâtarde — standard ; mode deux mains (Force ×2, lesté). */
export const epeeBatarde: Weapon = {
  id: 'epee-batarde',
  nom: 'Épée bâtarde — une main',
  type: 'contact',
  accessibilite: 'standard',
  coutPG: 30,
  degats: { nombre: 4, faces: 6, bonus: 'force+dexterite', moyenne: 12 },
  violence: { nombre: 2, faces: 6, bonus: 0, moyenne: 6 },
  portee: 'contact',
  effets: ['Orfèvrerie'],
  modes: [
    {
      nom: 'Deux mains',
      degats: { nombre: 4, faces: 6, bonus: 'force×2', moyenne: 12 },
      violence: { nombre: 3, faces: 6, bonus: 0, moyenne: 9 },
      portee: 'contact',
      effets: ['Lesté', 'Deux mains'],
    },
  ],
  equipee: false,
};

/** Lance-missile — avancé ; mode roquettes. Munitions : 10 PG le lot de 5 (module rack). */
export const lanceMissile: Weapon = {
  id: 'lance-missile',
  nom: 'Lance-missile — missiles',
  type: 'distance',
  accessibilite: 'avance',
  coutPG: 15,
  degats: { nombre: 7, faces: 6, bonus: 10, moyenne: 21 },
  violence: { nombre: 3, faces: 6, bonus: 0, moyenne: 9 },
  portee: 'lointaine',
  effets: [
    'Artillerie',
    'Anti-véhicule',
    "Assistance à l'attaque",
    'Lourd',
    'Deux mains',
  ],
  modes: [
    {
      nom: 'Roquettes',
      degats: { nombre: 3, faces: 6, bonus: 0, moyenne: 9 },
      violence: { nombre: 7, faces: 6, bonus: 10, moyenne: 21 },
      portee: 'lointaine',
      effets: ['Dispersion 6', 'Fureur', "Assistance à l'attaque", 'Lourd', 'Deux mains'],
    },
  ],
  equipee: false,
};

/** Mitrailleuse lourde — avancé, perce armure 20, destructeur. */
export const mitrailleuseLourde: Weapon = {
  id: 'mitrailleuse-lourde',
  nom: 'Mitrailleuse lourde',
  type: 'distance',
  accessibilite: 'avance',
  coutPG: 45,
  degats: { nombre: 5, faces: 6, bonus: 10, moyenne: 15 },
  violence: { nombre: 4, faces: 6, bonus: 0, moyenne: 12 },
  portee: 'moyenne',
  effets: ['Perce armure 20', 'Destructeur', 'Lourd', 'Deux mains'],
  equipee: false,
};

/** Pistolet d'infiltration — avancé ; 3 munitions (neurotoxine / choc / nanomachines). */
export const pistoletInfiltration: Weapon = {
  id: 'pistolet-infiltration',
  nom: 'Pistolet d\u2019infiltration — fléchettes à neurotoxine',
  type: 'distance',
  accessibilite: 'avance',
  coutPG: 50,
  degats: { nombre: 4, faces: 6, bonus: 0, moyenne: 12 },
  violence: { nombre: 0, faces: 6, bonus: 1 },
  portee: 'moyenne',
  effets: ['Ignore armure', 'Dégâts continus 3', 'Silencieux', 'Jumelé (ambidextrie)'],
  modes: [
    {
      nom: 'Fléchettes choc',
      degats: { nombre: 3, faces: 6, bonus: 0, moyenne: 9 },
      violence: { nombre: 0, faces: 6, bonus: 1 },
      portee: 'moyenne',
      effets: ['Ignore armure', 'Choc 2', 'Silencieux', 'Jumelé (ambidextrie)'],
    },
    {
      nom: 'Fléchettes à nanomachines',
      degats: { nombre: 4, faces: 6, bonus: 6, moyenne: 12 },
      violence: { nombre: 0, faces: 6, bonus: 1 },
      portee: 'moyenne',
      effets: ['Destructeur', 'Silencieux', 'Jumelé (ambidextrie)'],
    },
  ],
  equipee: false,
};

/** Lance-grenade lourd — avancé ; 4 munitions (changement par commande vocale). */
export const lanceGrenadeLourd: Weapon = {
  id: 'lance-grenade-lourd',
  nom: 'Lance-grenade lourd — grenade explosive',
  type: 'distance',
  accessibilite: 'avance',
  coutPG: 60,
  degats: { nombre: 5, faces: 6, bonus: 0, moyenne: 15 },
  violence: { nombre: 3, faces: 6, bonus: 6, moyenne: 9 },
  portee: 'moyenne',
  effets: ['Dispersion 3', "Assistance à l'attaque", 'Lourd', 'Deux mains'],
  modes: [
    {
      nom: 'Grenade anti-blindage',
      degats: { nombre: 5, faces: 6, bonus: 6, moyenne: 15 },
      violence: { nombre: 1, faces: 6, bonus: 0, moyenne: 3 },
      portee: 'moyenne',
      effets: ['Destructeur', "Assistance à l'attaque", 'Lourd', 'Deux mains'],
    },
    {
      nom: 'Grenade incendiaire',
      degats: { nombre: 2, faces: 6, bonus: 0, moyenne: 6 },
      violence: { nombre: 6, faces: 6, bonus: 6, moyenne: 18 },
      portee: 'moyenne',
      effets: ['Dégâts continus 3', "Assistance à l'attaque", 'Lourd', 'Deux mains'],
    },
    {
      nom: 'Grenade adhésive',
      degats: { nombre: 6, faces: 6, bonus: 0, moyenne: 18 },
      violence: { nombre: 3, faces: 6, bonus: 0, moyenne: 9 },
      portee: 'moyenne',
      effets: ['Dispersion 3', "Assistance à l'attaque", 'Lourd', 'Deux mains'],
    },
  ],
  equipee: false,
};

/** Fusil anti-matériel — avancé, lointaine, destructeur + perce armure 40. */
export const fusilAntiMateriel: Weapon = {
  id: 'fusil-anti-materiel',
  nom: 'Fusil anti-matériel',
  type: 'distance',
  accessibilite: 'avance',
  coutPG: 60,
  degats: { nombre: 5, faces: 6, bonus: '6+tir', moyenne: 15 },
  violence: { nombre: 2, faces: 6, bonus: 0, moyenne: 6 },
  portee: 'lointaine',
  effets: [
    'Destructeur',
    'Perce armure 40',
    'Précision',
    "Assistance à l'attaque",
    'Tir en sécurité',
    'Désignation',
    'Lourd',
    'Deux mains',
  ],
  equipee: false,
};

/** Shotgun automatique — avancé, barrage 4, ultraviolence. */
export const shotgunAutomatique: Weapon = {
  id: 'shotgun-automatique',
  nom: 'Shotgun automatique',
  type: 'distance',
  accessibilite: 'avance',
  coutPG: 70,
  degats: { nombre: 4, faces: 6, bonus: 10, moyenne: 12 },
  violence: { nombre: 6, faces: 6, bonus: 10, moyenne: 18 },
  portee: 'moyenne',
  effets: [
    'Dispersion 3',
    'Démoralisant',
    'Ultraviolence',
    'Barrage 4',
    'Lourd',
    'Deux mains',
  ],
  equipee: false,
};

/** Ceste répulsif — avancé, défense 2 (1 PE/tour). */
export const cesteRepulsif: Weapon = {
  id: 'ceste-repulsif',
  nom: 'Ceste répulsif',
  type: 'contact',
  accessibilite: 'avance',
  coutPG: 30,
  degats: { nombre: 5, faces: 6, bonus: 'force', moyenne: 15 },
  violence: { nombre: 2, faces: 6, bonus: 0, moyenne: 6 },
  portee: 'contact',
  coutPE: '1/tour pour défense 2',
  effets: ['Défense 2', 'Choc 2', 'Jumelé (akimbo)'],
  equipee: false,
};

/** Épée longue — avancé, lesté, deux mains, choc 1, défense 1. */
export const epeeLongue: Weapon = {
  id: 'epee-longue',
  nom: 'Épée longue',
  type: 'contact',
  accessibilite: 'avance',
  coutPG: 35,
  degats: { nombre: 5, faces: 6, bonus: 'force×2', moyenne: 15 },
  violence: { nombre: 5, faces: 6, bonus: 0, moyenne: 15 },
  portee: 'contact',
  effets: ['Lesté', 'Deux mains', 'Choc 1', 'Défense 1'],
  equipee: false,
};

/** Dague — avancé, ignore armure, orfèvrerie. */
export const dague: Weapon = {
  id: 'dague',
  nom: 'Dague',
  type: 'contact',
  accessibilite: 'avance',
  coutPG: 40,
  degats: { nombre: 3, faces: 6, bonus: 'force+dexterite', moyenne: 9 },
  violence: { nombre: 0, faces: 6, bonus: 1 },
  portee: 'contact',
  effets: [
    'Ignore armure',
    'Silencieux',
    'Orfèvrerie',
    "Assistance à l'attaque",
    'Jumelé (ambidextrie)',
  ],
  equipee: false,
};

/** Bélier à piston — avancé, destructeur, lesté, choc 1. */
export const belierPiston: Weapon = {
  id: 'belier-a-piston',
  nom: 'Bélier à piston',
  type: 'contact',
  accessibilite: 'avance',
  coutPG: 40,
  degats: { nombre: 6, faces: 6, bonus: 'force×2', moyenne: 18 },
  violence: { nombre: 1, faces: 6, bonus: 0, moyenne: 3 },
  portee: 'contact',
  effets: ['Destructeur', 'Lesté', 'Choc 1', "Assistance à l'attaque"],
  equipee: false,
};

/** Matraques électriques (par paire) — avancé, en chaîne, choc 4. */
export const matraquesElectriques: Weapon = {
  id: 'matraques-electriques',
  nom: 'Matraques électriques (par paire)',
  type: 'contact',
  accessibilite: 'avance',
  coutPG: 40,
  degats: { nombre: 5, faces: 6, bonus: 'force', moyenne: 15 },
  violence: { nombre: 5, faces: 6, bonus: 0, moyenne: 15 },
  portee: 'contact',
  effets: ['En chaîne', 'Choc 4', 'Meurtrier', 'Barrage 4', 'Deux mains'],
  equipee: false,
};

/** Sabre brûlant — avancé, orfèvrerie, lumière 4, anti-Anathème. */
export const sabreBrulant: Weapon = {
  id: 'sabre-brulant',
  nom: 'Sabre brûlant',
  type: 'contact',
  accessibilite: 'avance',
  coutPG: 40,
  degats: { nombre: 5, faces: 6, bonus: 'force+dexterite', moyenne: 15 },
  violence: { nombre: 3, faces: 6, bonus: 0, moyenne: 9 },
  portee: 'contact',
  effets: [
    'Orfèvrerie',
    'Lumière 4',
    'Anti-Anathème',
    'Meurtrier',
    'Jumelé (ambidextrie)',
  ],
  equipee: false,
};

/** Targe amovible — avancé ; mode dépliée (défense 3, réaction 3). */
export const targeAmovible: Weapon = {
  id: 'targe-amovible',
  nom: 'Targe amovible — pliée',
  type: 'contact',
  accessibilite: 'avance',
  coutPG: 45,
  degats: { nombre: 0, faces: 6, bonus: '2+force' },
  violence: { nombre: 0, faces: 6, bonus: 2 },
  portee: 'contact',
  effets: ['Défense 2', 'Main libre'],
  modes: [
    {
      nom: 'Dépliée',
      degats: { nombre: 0, faces: 6, bonus: '2+force' },
      violence: { nombre: 0, faces: 6, bonus: 2 },
      portee: 'contact',
      effets: ['Défense 3', 'Réaction 3', 'Choc 1', 'Jumelé (ambidextrie)'],
    },
  ],
  equipee: false,
};

/** Fléau répulsif — avancé ; sans réussite au jet d'attaque, l'utilisateur subit les dégâts. */
export const fleauRepulsif: Weapon = {
  id: 'fleau-repulsif',
  nom: 'Fléau répulsif',
  type: 'contact',
  accessibilite: 'avance',
  coutPG: 55,
  degats: { nombre: 7, faces: 6, bonus: 'force', moyenne: 21 },
  violence: { nombre: 4, faces: 6, bonus: 0, moyenne: 12 },
  portee: 'contact',
  coutPE: '1/action',
  effets: [
    'Choc 2',
    'Dispersion 3',
    'En chaîne',
    'Barrage 3',
    "Aucune réussite au jet d'attaque = l'utilisateur subit les dégâts à la place de la cible",
  ],
  equipee: false,
};

/** Torche plasma — avancé, perce armure 60, fureur, lumière 4. */
export const torchePlasma: Weapon = {
  id: 'torche-plasma',
  nom: 'Torche plasma',
  type: 'contact',
  accessibilite: 'avance',
  coutPG: 50,
  degats: { nombre: 6, faces: 6, bonus: 'force', moyenne: 18 },
  violence: { nombre: 4, faces: 6, bonus: 0, moyenne: 12 },
  portee: 'contact',
  effets: [
    'Perce armure 60',
    'Fureur',
    'Lumière 4',
    'Destructeur',
    'Défense 2',
    'Deux mains',
  ],
  equipee: false,
};

/** Revolver lourd — rare ; mode T-800 (5 PG/unité). */
export const revolverLourd: Weapon = {
  id: 'revolver-lourd',
  nom: 'Revolver lourd — 600 NE',
  type: 'distance',
  accessibilite: 'rare',
  coutPG: 70,
  degats: { nombre: 6, faces: 6, bonus: 10, moyenne: 18 },
  violence: { nombre: 1, faces: 6, bonus: 0, moyenne: 3 },
  portee: 'moyenne',
  effets: ['Meurtrier', 'Perce armure 40', 'Pénétrant 10'],
  modes: [
    {
      nom: 'T-800 (5 PG/unité)',
      degats: { nombre: 6, faces: 6, bonus: 20, moyenne: 18 },
      violence: { nombre: 2, faces: 6, bonus: 0, moyenne: 6 },
      portee: 'moyenne',
      effets: ['Ignore armure', 'Anti-véhicule', 'Ignore CdF'],
    },
  ],
  equipee: false,
};

/** Fusil laser — rare, alimenté en PE (+1D6 par 1 PE, 7D6 max). */
export const fusilLaser: Weapon = {
  id: 'fusil-laser',
  nom: 'Fusil laser',
  type: 'distance',
  accessibilite: 'rare',
  coutPG: 70,
  degats: {
    nombre: 4,
    faces: 6,
    bonus: '6 (+1D6 par 1 PE, 7D6 max)',
    moyenne: 12,
  },
  violence: {
    nombre: 3,
    faces: 6,
    bonus: '(+1D6 par 1 PE, 7D6 max)',
    moyenne: 9,
  },
  portee: 'moyenne',
  coutPE: '1/tir',
  effets: ['Ignore CdF', 'Anti-Anathème', 'Lumière 4', 'Deux mains'],
  equipee: false,
};

/** Arbalète magnétique — rare ; 4 carreaux, ajoute le Tir aux dégâts. */
export const arbaleteMagnetique: Weapon = {
  id: 'arbalete-magnetique',
  nom: 'Arbalète magnétique — carreau barbelé',
  type: 'distance',
  accessibilite: 'rare',
  coutPG: 70,
  degats: { nombre: 6, faces: 6, bonus: 'tir' },
  violence: { nombre: 0, faces: 6, bonus: 1 },
  portee: 'longue',
  effets: ['Ignore armure', 'Silencieux', 'Deux mains', 'Précision'],
  modes: [
    {
      nom: 'Carreau à neurotoxine',
      degats: { nombre: 5, faces: 6, bonus: 'tir' },
      violence: { nombre: 0, faces: 6, bonus: 1 },
      portee: 'longue',
      effets: ['Ignore armure', 'Dégâts continus 9', 'Silencieux', 'Deux mains', 'Précision'],
    },
    {
      nom: 'Carreau choc',
      degats: { nombre: 4, faces: 6, bonus: 'tir' },
      violence: { nombre: 0, faces: 6, bonus: 1 },
      portee: 'longue',
      effets: ['Ignore armure', 'Choc 4', 'Silencieux', 'Deux mains', 'Précision'],
    },
    {
      nom: 'Carreau à nanomachines',
      degats: { nombre: 6, faces: 6, bonus: '6+tir' },
      violence: { nombre: 0, faces: 6, bonus: 1 },
      portee: 'longue',
      effets: [
        'Destructeur',
        'Anti-véhicule',
        'Lumière 4',
        'Silencieux',
        'Deux mains',
        'Précision',
      ],
    },
  ],
  equipee: false,
};

/** Shotgun automatique lourd — rare, dispersion 6, fureur. */
export const shotgunAutomatiqueLourd: Weapon = {
  id: 'shotgun-automatique-lourd',
  nom: 'Shotgun automatique lourd',
  type: 'distance',
  accessibilite: 'rare',
  coutPG: 80,
  degats: { nombre: 6, faces: 6, bonus: 12, moyenne: 18 },
  violence: { nombre: 6, faces: 6, bonus: 12, moyenne: 18 },
  portee: 'moyenne',
  effets: ['Dispersion 6', 'Fureur', 'Démoralisant', 'Lourd', 'Deux mains'],
  equipee: false,
};

/** Railgun — rare, lointaine, précision, ignore armure. */
export const railgun: Weapon = {
  id: 'railgun',
  nom: 'Railgun',
  type: 'distance',
  accessibilite: 'rare',
  coutPG: 90,
  degats: { nombre: 5, faces: 6, bonus: '10+tir', moyenne: 15 },
  violence: { nombre: 1, faces: 6, bonus: 0, moyenne: 3 },
  portee: 'lointaine',
  effets: [
    'Précision',
    'Ignore armure',
    'Anti-véhicule',
    'Désignation',
    'Artillerie',
    "Assistance à l'attaque",
    'Deux mains',
  ],
  equipee: false,
};

/** Lance-flammes — rare, dégâts continus 6, barrage 5. */
export const lanceFlammes: Weapon = {
  id: 'lance-flammes',
  nom: 'Lance-flammes',
  type: 'distance',
  accessibilite: 'rare',
  coutPG: 100,
  degats: { nombre: 4, faces: 6, bonus: 0, moyenne: 12 },
  violence: { nombre: 8, faces: 6, bonus: 12, moyenne: 24 },
  portee: 'moyenne',
  effets: [
    'Dégâts continus 6',
    'Démoralisant',
    'Dispersion 6',
    'Fureur',
    'Barrage 5',
    'Lumière 2',
    'Lourd',
    'Deux mains',
  ],
  equipee: false,
};

/** Hache à réaction — rare, ignore CdF, orfèvrerie, lesté, en chaîne. */
export const hacheReaction: Weapon = {
  id: 'hache-a-reaction',
  nom: 'Hache à réaction',
  type: 'contact',
  accessibilite: 'rare',
  coutPG: 60,
  degats: { nombre: 6, faces: 6, bonus: 'force×2+dexterite', moyenne: 18 },
  violence: { nombre: 4, faces: 6, bonus: 0, moyenne: 12 },
  portee: 'contact',
  effets: [
    'Ignore CdF',
    'Orfèvrerie',
    'Lesté',
    'En chaîne',
    "Assistance à l'attaque",
  ],
  equipee: false,
};

/** Pavois — rare ; mode charge (action de déplacement). */
export const pavois: Weapon = {
  id: 'pavois',
  nom: 'Pavois',
  type: 'contact',
  accessibilite: 'rare',
  coutPG: 60,
  degats: { nombre: 0, faces: 6, bonus: '2+force' },
  violence: { nombre: 0, faces: 6, bonus: 2 },
  portee: 'contact',
  effets: ['Défense 4', 'Réaction 4', 'Jumelé (ambidextrie)'],
  modes: [
    {
      nom: 'Charge',
      degats: { nombre: 0, faces: 6, bonus: '10+force×2' },
      violence: { nombre: 1, faces: 6, bonus: 0, moyenne: 3 },
      portee: 'courte',
      effets: ['Choc 2', 'Lesté', 'Action de déplacement, impossible si déjà au contact'],
    },
  ],
  equipee: false,
};

/** Épée cinétique — rare ; ignore armure activable pour 1 PE. */
export const epeeCinetique: Weapon = {
  id: 'epee-cinetique',
  nom: 'Épée cinétique',
  type: 'contact',
  accessibilite: 'rare',
  coutPG: 70,
  degats: { nombre: 6, faces: 6, bonus: 'force+dexterite', moyenne: 18 },
  violence: { nombre: 3, faces: 6, bonus: 0, moyenne: 9 },
  portee: 'contact',
  coutPE: '1 pour activer ignore armure',
  effets: [
    'Orfèvrerie',
    'Défense 2',
    "Assistance à l'attaque",
    'Jumelé (ambidextrie)',
    'Ignore armure (activable)',
  ],
  equipee: false,
};

/** Épée lumière — rare ; modes une main / deux mains. */
export const epeeLumiere: Weapon = {
  id: 'epee-lumiere',
  nom: 'Épée lumière — une main',
  type: 'contact',
  accessibilite: 'rare',
  coutPG: 70,
  degats: { nombre: 6, faces: 6, bonus: 'force+dexterite', moyenne: 18 },
  violence: { nombre: 3, faces: 6, bonus: 0, moyenne: 9 },
  portee: 'contact',
  effets: ['Orfèvrerie', 'Lumière 6', 'Anti-Anathème', "Assistance à l'attaque"],
  modes: [
    {
      nom: 'Deux mains',
      degats: { nombre: 6, faces: 6, bonus: 'force×2', moyenne: 18 },
      violence: { nombre: 6, faces: 6, bonus: 0, moyenne: 18 },
      portee: 'contact',
      effets: ['Lesté', 'Lumière 6', 'Anti-Anathème', "Assistance à l'attaque"],
    },
  ],
  equipee: false,
};

/** Ceste de fracture — rare, ignore armure, anti-véhicule, destructeur. */
export const cesteFracture: Weapon = {
  id: 'ceste-de-fracture',
  nom: 'Ceste de fracture',
  type: 'contact',
  accessibilite: 'rare',
  coutPG: 80,
  degats: { nombre: 6, faces: 6, bonus: 'force', moyenne: 18 },
  violence: { nombre: 3, faces: 6, bonus: 0, moyenne: 9 },
  portee: 'contact',
  coutPE: "1/action d'attaque",
  effets: [
    'Défense 2',
    'Ignore armure',
    'Anti-véhicule',
    'Destructeur',
    'Choc 2',
    'Jumelé (akimbo)',
  ],
  equipee: false,
};

/** Masse magnétique — rare, ignore CdF, choc 2, lesté, lourd. */
export const masseMagnetique: Weapon = {
  id: 'masse-magnetique',
  nom: 'Masse magnétique',
  type: 'contact',
  accessibilite: 'rare',
  coutPG: 90,
  degats: { nombre: 8, faces: 6, bonus: 'force×2', moyenne: 24 },
  violence: { nombre: 6, faces: 6, bonus: 0, moyenne: 18 },
  portee: 'contact',
  effets: [
    'Ignore CdF',
    'Choc 2',
    'Dispersion 3',
    'Lesté',
    'Lumière 2',
    'Lourd',
    'Deux mains',
  ],
  equipee: false,
};

/** Épée sonique — rare, +1D6 par 1 PE (10D6 max), alimentée par attaque. */
export const epeeSonique: Weapon = {
  id: 'epee-sonique',
  nom: 'Épée sonique',
  type: 'contact',
  accessibilite: 'rare',
  coutPG: 100,
  degats: {
    nombre: 4,
    faces: 6,
    bonus: 'force (+1D6 par 1 PE, 10D6 max)',
    moyenne: 12,
  },
  violence: {
    nombre: 4,
    faces: 6,
    bonus: '(+1D6 par 1 PE, 10D6 max)',
    moyenne: 12,
  },
  portee: 'contact',
  coutPE: '1/attaque',
  effets: [
    'Ignore armure',
    'Anti-véhicule',
    'Fureur',
    'Lourd',
    'Deux mains',
    "Assistance à l'attaque",
  ],
  equipee: false,
};

/**
 * Catalogue des armes de la table ARMES (annexe 2) — 40 armes nommées.
 * Les profils secondaires (munitions/modes alternatifs) sont portés par
 * leurs `modes` : 19 profils supplémentaires (le digest annonce 17 en
 * comptant seulement les lignes « (même arme) » ; les grenades du
 * lance-grenade léger répètent le PG au lieu du marqueur).
 */
export const armesArsenal: Weapon[] = [
  pistoletDeService,
  shotgunEscamotable,
  pistoletMitrailleur,
  fusilAssaut,
  lanceGrenadeLeger,
  fusilPrecision,
  marteauEpieu,
  morgenstern,
  couteauCombat,
  bouclierAmovible,
  cesteLourd,
  epeeBatarde,
  lanceMissile,
  mitrailleuseLourde,
  pistoletInfiltration,
  lanceGrenadeLourd,
  fusilAntiMateriel,
  shotgunAutomatique,
  cesteRepulsif,
  epeeLongue,
  dague,
  belierPiston,
  matraquesElectriques,
  sabreBrulant,
  targeAmovible,
  fleauRepulsif,
  torchePlasma,
  revolverLourd,
  fusilLaser,
  arbaleteMagnetique,
  shotgunAutomatiqueLourd,
  railgun,
  lanceFlammes,
  hacheReaction,
  pavois,
  epeeCinetique,
  epeeLumiere,
  cesteFracture,
  masseMagnetique,
  epeeSonique,
];

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

/** Grenades intelligentes — les 4 autres types à la commande (mêmes slots que shrapnel). */
export const grenadesIntelligentesAutres: Weapon[] = [
  {
    id: 'grenade-flashbang',
    nom: 'Grenade intelligente — flashbang',
    type: 'distance',
    accessibilite: 'standard',
    coutPG: 0,
    degats: { nombre: 0, faces: 6, bonus: 0 },
    violence: { nombre: 0, faces: 6, bonus: 0 },
    portee: 'courte',
    effets: [
      'Choc 1 automatique (sauf cibles en méta-armure, non cumulable)',
      'Barrage 2',
      'Lumière 2',
      'Dispersion 6',
      'Ni dégâts ni violence',
      'Chargeur 5',
      'Ignore les bonus de réaction des couverts',
    ],
    equipee: false,
  },
  {
    id: 'grenade-anti-blindage',
    nom: 'Grenade intelligente — anti-blindage',
    type: 'distance',
    accessibilite: 'standard',
    coutPG: 0,
    degats: { nombre: 3, faces: 6, bonus: 0, moyenne: 9 },
    violence: { nombre: 3, faces: 6, bonus: 0, moyenne: 9 },
    portee: 'courte',
    effets: [
      'Destructeur',
      'Perce armure 20',
      'Pénétrant 6',
      'Dispersion 6',
      'Chargeur 5',
      'Ignore les bonus de réaction des couverts',
    ],
    equipee: false,
  },
  {
    id: 'grenade-iem',
    nom: 'Grenade intelligente — IEM',
    type: 'distance',
    accessibilite: 'standard',
    coutPG: 0,
    degats: { nombre: 0, faces: 6, bonus: 0 },
    violence: { nombre: 0, faces: 6, bonus: 0 },
    portee: 'courte',
    effets: [
      'Parasitage 2',
      'Dispersion 6',
      'Ni dégâts ni violence',
      'Chargeur 5',
      'Ignore les bonus de réaction des couverts',
    ],
    equipee: false,
  },
  {
    id: 'grenade-explosive',
    nom: 'Grenade intelligente — explosive',
    type: 'distance',
    accessibilite: 'standard',
    coutPG: 0,
    degats: { nombre: 3, faces: 6, bonus: 0, moyenne: 9 },
    violence: { nombre: 3, faces: 6, bonus: 0, moyenne: 9 },
    portee: 'courte',
    effets: [
      'Anti-véhicule',
      'Dégâts +3D6 contre objets inanimés et véhicules',
      'Dispersion 3',
      'Choc 1',
      'Chargeur 5',
      'Ignore les bonus de réaction des couverts',
    ],
    equipee: false,
  },
];
