/**
 * Moteur — dégâts environnementaux (règle p.92).
 * Toutes les fonctions sont pures, dés injectés. Les totaux retournés sont
 * ensuite passés à applyDamage (ordre CdF → PA → PS) par l'UI/store.
 */
import type { Character } from '../types/character';

export interface PaquetDegats {
  des: number[];
  total: number;
  /** notes de règle pour l'UI (agonie automatique, blessure spécifique…) */
  notes: string[];
}

/**
 * Chute (p.92) :
 * - en méta-armure : ≤ 10 m rien ; > 10 m : 1D6 par tranche complète de 3 m
 *   supplémentaires (aux PA d'abord).
 * - sans méta-armure (ni Chair exceptionnelle) : 1D6 par tranche de 3 m ;
 *   au-delà de 20 m : agonie automatique + blessure aléatoire.
 */
export function degatsChute(hauteurM: number, armureDeployee: boolean, rand: () => number = Math.random): PaquetDegats {
  const notes: string[] = [];
  if (armureDeployee && hauteurM <= 10) {
    return { des: [], total: 0, notes: ['≤ 10 m en méta-armure : rien (p.92)'] };
  }
  const tranches = armureDeployee
    ? Math.floor((hauteurM - 10) / 3)
    : Math.floor(hauteurM / 3);
  if (tranches <= 0) {
    return { des: [], total: 0, notes: ['Hauteur sans dégâts (p.92)'] };
  }
  if (!armureDeployee && hauteurM > 20) {
    notes.push('Chute > 20 m sans méta-armure : agonie automatique + blessure aléatoire (p.92)');
  }
  const des = Array.from({ length: tranches }, () => 1 + Math.floor(rand() * 6));
  return {
    des,
    total: des.reduce((a, b) => a + b, 0),
    notes,
  };
}

/**
 * Feu (p.92) : 1D6 dégâts par tour de jeu. Agonie par le feu → blessure
 * « brûlé vif » (−1 à TOUTES les caractéristiques) au lieu d'une aléatoire.
 * En méta-armure : immunisé aux incendies (mais PAS aux lance-flammes/
 * grenades incendiaires = effets dégâts continus des armes).
 */
export function degatsFeu(enMetaArmure: boolean, rand: () => number = Math.random): PaquetDegats {
  if (enMetaArmure) {
    return { des: [], total: 0, notes: ['Méta-armure : immunisée aux incendies (p.92) — les lance-flammes restent des dégâts continus d\u2019arme'] };
  }
  const de = 1 + Math.floor(rand() * 6);
  return {
    des: [de],
    total: de,
    notes: ['Agonie par le feu → blessure « brûlé vif » : −1 à toutes les caractéristiques (p.92)'],
  };
}

/** Apnée possible = 20 × Endurance secondes (p.92) */
export function apneeSecondes(endurance: number): number {
  return 20 * endurance;
}

/**
 * Noyade (p.92) : après l'apnée, 1D6 toutes les 10 s/tour. Agonie par
 * noyade : 1 minute avant de succomber ; premiers secours (base Savoir,
 * difficulté délicate 4) → retour à 1 PS sans blessure. Méta-armure :
 * réserve d'oxygène de 6 h (pas de noyade pendant ce délai).
 */
export function degatsNoyade(dureeS: number, endurance: number, rand: () => number = Math.random): PaquetDegats {
  const apnee = apneeSecondes(endurance);
  if (dureeS <= apnee) {
    return { des: [], total: 0, notes: [`Apnée suffisante (${apnee} s = 20 × Endurance ${endurance}, p.92)`] };
  }
  const tours = Math.floor((dureeS - apnee) / 10);
  if (tours <= 0) {
    return { des: [], total: 0, notes: ['Dans la fenêtre apnée (p.92)'] };
  }
  const des = Array.from({ length: tours }, () => 1 + Math.floor(rand() * 6));
  return {
    des,
    total: des.reduce((a, b) => a + b, 0),
    notes: [
      'Agonie par noyade : 1 minute avant de succomber (p.92)',
      'Premiers secours (base Savoir, difficulté délicate 4) → retour à 1 PS sans blessure (p.92)',
    ],
  };
}

export type Virulence = 'faible' | 'moyenne' | 'forte';

/**
 * Gaz / poisons / maladies (p.92) :
 * - faible : 1D6 à 3D6 toutes les 6 h/jours (+1 effet)
 * - moyenne : 4D6 à 6D6 toutes les heures/jours (+2-3 effets)
 * - forte : 7D6 à 9D6 toutes les minutes/30 min (+4-6 effets)
 * Agonie par poison/gaz : PAS de blessure aléatoire — le MJ choisit.
 */
export function degatsToxique(virulence: Virulence, rand: () => number = Math.random): PaquetDegats {
  const bornes: Record<Virulence, [number, number]> = {
    faible: [1, 3],
    moyenne: [4, 6],
    forte: [7, 9],
  };
  const [min, max] = bornes[virulence];
  // nombre de dés déterminé par un D(max-min+1) borné — injection déterministe
  const bonusDes = Math.floor(rand() * (max - min + 1));
  const n = min + bonusDes;
  const des = Array.from({ length: n }, () => 1 + Math.floor(rand() * 6));
  return {
    des,
    total: des.reduce((a, b) => a + b, 0),
    notes: [
      'Agonie par poison/gaz : pas de tirage aléatoire — le MJ choisit la blessure (p.92)',
      virulence === 'faible' ? 'Faible : toutes les 6 h/jours, +1 effet (p.92)'
      : virulence === 'moyenne' ? 'Moyenne : toutes les heures/jours, +2-3 effets (p.92)'
      : 'Forte : toutes les minutes/30 min, +4-6 effets (p.92)',
    ],
  };
}

/**
 * Accident de véhicule (p.92) : 1 à 5D6 dégâts, multipliés par le score de
 * vitesse du véhicule s'il est en mouvement.
 */
export function degatsAccident(vitesse: number, enMouvement: boolean, rand: () => number = Math.random): PaquetDegats {
  const nombreDes = 1 + Math.floor(rand() * 5); // 1 à 5D6
  const des = Array.from({ length: nombreDes }, () => 1 + Math.floor(rand() * 6));
  const brut = des.reduce((a, b) => a + b, 0);
  const total = enMouvement ? brut * Math.max(0, vitesse) : brut;
  return {
    des,
    total,
    notes: enMouvement ? [`Multiplié par la vitesse ${vitesse} (p.92)`] : ['Véhicule immobile : pas de multiplication (p.92)'],
  };
}

/** Rappel : les blessures de la table ne se retirent que par implant/thérapie (p.91) */
export function resumeConditionsAgonie(character: Character): string[] {
  const notes: string[] = [];
  if (character.jauges.ps.current <= 0) notes.push('À 0 PS : agonie (p.90)');
  return notes;
}
