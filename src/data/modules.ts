/**
 * Modules de méta-armure — annexe 2 (digest PARTIE 4, lignes 802-901).
 * Catalogue complet : 57 modules non-OD (le bilan du digest compte 72 modules
 * avec les 15 overdrives, qui vivent dans overdrives.ts et hors catalogue).
 * Slots : conversion des libellés du livre (« 1 à chaque jambe » → jambe 1/1).
 * Les zones « ou » (ex. « 1 à la tête ou 1 au torse ») renseignent les deux
 * zones à 1 — le choix reste à l'installation (voir commentaire par module).
 * Niveau de base : 1 ; etat : 'inactif'.
 */
import type { ArmorModule } from '../types/character';

export const fumigene: ArmorModule = {
  id: 'fumigene',
  nom: 'Fumigène',
  categorie: 'defense',
  accessibilite: 'standard',
  coutPG: 10,
  slots: { torse: 1 },
  activation: 'action-deplacement',
  duree: 'une scène / phase de conflit',
  coutPE: '2',
  description:
    'Porteur et alliés à portée courte : défense +2, réaction +2, malus de 3 dés aux ' +
    "attaques à distance. Annulé par Bête/Machine/Masque exceptionnels et visions alternatives.",
  effets: [
    { source: 'Fumigène', target: 'defense', valeur: 2, type: 'bonus' },
    { source: 'Fumigène', target: 'reaction', valeur: 2, type: 'bonus' },
  ],
  etat: 'inactif',
};

export const flash: ArmorModule = {
  id: 'flash',
  nom: 'Flash',
  categorie: 'defense',
  accessibilite: 'standard',
  coutPG: 15,
  slots: { tete: 1 },
  activation: 'aucune-1x-par-tour',
  duree: '1 tour / 10 s',
  coutPE: '2',
  description:
    "Éblouissement : ennemi de Chair ≤ 8 subit choc 1 (sans test d'attaque) ; effet lumière 2.",
  effets: [],
  etat: 'inactif',
};

export const blindageDrone: ArmorModule = {
  id: 'blindage-drone',
  nom: 'Blindage drone',
  categorie: 'defense',
  accessibilite: 'rare',
  coutPG: 30,
  slots: { torse: 2 },
  activation: 'action-deplacement',
  duree: 'une scène / phase de conflit',
  coutPE: '6',
  description:
    'Drone-bouclier : +2 CdF et +2 défense. Niv 2 (30 PG) : +4 CdF et +3 défense. ' +
    // FAQ p.449/455 : le blindage drone SE CUMULE avec le Shrine (exception au non-cumul).
    'Cumulable avec le Shrine (exception explicite au non-cumul du CdF, FAQ p.449).',
  effets: [
    // type 'bonus' et non 'max' : exception au non-cumul (FAQ p.449)
    { source: 'Blindage drone', target: 'cdf', valeur: 2, type: 'bonus' },
    { source: 'Blindage drone', target: 'defense', valeur: 2, type: 'bonus' },
  ],
  etat: 'inactif',
};

export const lameDeBras: ArmorModule = {
  id: 'lame-de-bras',
  nom: 'Lame de bras (niv 1)',
  categorie: 'contact',
  accessibilite: 'standard',
  coutPG: 10,
  slots: { brasGauche: 2 },
  activation: 'aucune',
  duree: "jusqu'à désactivation",
  description:
    "Arme de mêlée intégrée : 2D6 (6) + Force, violence 1, contact. " +
    'Niv 2 (10 PG) : orfèvrerie ou destructeur, +1D6. Niv 3 (rare, 30 PG) : perce armure 40 ou lumière 4.',
  effets: [],
  etat: 'inactif',
};

export const relaisTaccom: ArmorModule = {
  id: 'relais-taccom',
  nom: 'Relais TACCOM',
  categorie: 'tactique',
  accessibilite: 'standard',
  coutPG: 20,
  slots: { tete: 1 },
  activation: 'aucune',
  duree: "jusqu'à désactivation",
  coutPE: '1',
  description: 'Lien constant avec Camelot même couvert/parasité/dans l\'Anathème ; inpiratable.',
  effets: [],
  etat: 'actif',
};

// ─── Déplacement (9) ─────────────────────────────────────────────────────────

export const saut: ArmorModule = {
  id: 'saut',
  nom: 'Saut',
  categorie: 'deplacement',
  accessibilite: 'standard',
  coutPG: 10,
  slots: { jambeGauche: 1, jambeDroite: 1 },
  activation: 'action-deplacement',
  duree: 'Instantanée',
  coutPE: '3',
  description:
    'Saut hauteur courte / longueur moyenne ; action de combat possible ; saut sur ennemi = +6 dégâts au contact. ' +
    'Niv 2 (20 PG) : hauteur moyenne / longueur longue, atteinte au tour suivant, tir en l\u2019air (−2 réussites), réaction +2 en saut, +9 dégâts sur saut d\u2019attaque. ' +
    'Niv 3 (20 PG) : hauteur longue / longueur lointaine (max 1 km), atterrit au 3e tour, tir possible (−2), réaction +2, trajectoire modifiable (test Déplacement), +12 dégâts sur saut d\u2019attaque.',
  effets: [],
  etat: 'inactif',
};

export const motoSteed: ArmorModule = {
  id: 'moto-steed',
  nom: 'Moto steed',
  categorie: 'deplacement',
  accessibilite: 'standard',
  coutPG: 30,
  slots: { torse: 1 },
  activation: 'action-deplacement',
  duree: "jusqu'à désactivation",
  coutPE: '1',
  description:
    'Déploie une moto steed (voir Véhicules) en < 6 s ; reformatage à 1 km ; si la moto est détruite, le module aussi (slot libéré).',
  effets: [],
  etat: 'inactif',
};

export const wingsuit: ArmorModule = {
  id: 'wingsuit',
  nom: 'Wingsuit',
  categorie: 'deplacement',
  accessibilite: 'standard',
  coutPG: 10,
  slots: { torse: 1 },
  activation: 'action-deplacement',
  duree: "jusqu'à désactivation",
  coutPE: '3',
  description:
    'Pas de dégâts de chute ; tir 1×/tour en chute (−2 réussites) ; réaction +2 en chute.',
  effets: [],
  etat: 'inactif',
};

export const course: ArmorModule = {
  id: 'course',
  nom: 'Course',
  categorie: 'deplacement',
  accessibilite: 'standard',
  coutPG: 20,
  slots: { jambeGauche: 1, jambeDroite: 1 },
  activation: 'action-deplacement',
  duree: 'Instantanée',
  coutPE: '3',
  description:
    'Déplacement = 1 portée moyenne (vitesse 2) ; rechargeable en énergie pour continuer ; attaque au contact contre plus lent = +6 dégâts mais subit la moitié des dégâts infligés. ' +
    'Niv 2 (20 PG) : portée longue (vitesse 3), +9 dégâts (contre-coup identique). ' +
    'Niv 3 (30 PG) : portée lointaine (vitesse 4), +12 dégâts (contre-coup identique).',
  effets: [],
  etat: 'inactif',
};

export const deplacementSilencieux: ArmorModule = {
  id: 'deplacement-silencieux',
  nom: 'Déplacement silencieux',
  categorie: 'deplacement',
  accessibilite: 'avance',
  coutPG: 10,
  slots: { jambeGauche: 1, jambeDroite: 1, torse: 1 },
  activation: 'action-deplacement',
  duree: '1 tour / 6 s',
  coutPE: '2',
  description:
    'Bonus de 2 dés aux jets Discrétion combo Déplacement ou Combat. Niv 2 (20 PG) : bonus de 4 dés.',
  effets: [],
  etat: 'inactif',
};

export const adherence: ArmorModule = {
  id: 'adherence',
  nom: 'Adhérence',
  categorie: 'deplacement',
  accessibilite: 'avance',
  coutPG: 20,
  slots: { jambeGauche: 2, jambeDroite: 2, brasGauche: 2, brasDroit: 2 },
  activation: 'action-deplacement',
  duree: '3 tours / 30 s',
  coutPE: '3',
  description:
    'Adhère à toute surface (murs, plafonds de verre) ; combat = arme à une main seulement. ' +
    'Niv 2 (50 PG) : durée illimitée, énergie à l\u2019activation seulement.',
  effets: [],
  etat: 'inactif',
};

export const vol: ArmorModule = {
  id: 'vol',
  nom: 'Vol',
  categorie: 'deplacement',
  accessibilite: 'rare',
  coutPG: 30,
  slots: { jambeGauche: 2, jambeDroite: 2, brasGauche: 2, brasDroit: 2, torse: 2, tete: 1 },
  activation: 'action-deplacement',
  duree: '3 tours / 30 s',
  coutPE: '5',
  description:
    'Vol portée courte/tour (vitesse 1), stationnaire possible ; prolonger = nouvelle dépense d\u2019énergie. ' +
    'Niv 2 (30 PG) : moyenne/tour (vitesse 2), durée 5 tours / 50 s. ' +
    'Niv 3 (50 PG) : longue/tour (vitesse 3), durée 10 tours / 100 s.',
  effets: [],
  etat: 'inactif',
};

export const moduleDePhase: ArmorModule = {
  id: 'module-de-phase',
  nom: 'Module de phase',
  categorie: 'deplacement',
  accessibilite: 'rare',
  coutPG: 50,
  slots: { jambeGauche: 1, jambeDroite: 1, brasGauche: 1, brasDroit: 1, torse: 2, tete: 1 },
  activation: 'action-deplacement',
  duree: 'Spécial (1 action / 50 cm)',
  coutPE: '5',
  description:
    'Phaser : traverse 50 cm de n\u2019importe quelle matière sauf élément alpha ; 1 activation = 50 cm supplémentaires ; bloqué dans la matière = mort. ' +
    'Niv 2 (50 PG) : phaseur pour esquiver une attaque (aucun dégât) — activation « aucune », instantané, 8 PE, doit être conscient de l\u2019attaque.',
  effets: [],
  etat: 'inactif',
};

export const teleportation: ArmorModule = {
  id: 'teleportation',
  nom: 'Téléportation',
  categorie: 'deplacement',
  accessibilite: 'rare',
  coutPG: 100,
  slots: { jambeGauche: 2, jambeDroite: 2, brasGauche: 2, brasDroit: 2, torse: 3, tete: 1 },
  activation: 'action-deplacement',
  duree: 'Instantanée',
  coutPE: '10',
  description:
    'Téléportation instantanée à portée lointaine ; flash bleuté bruyant (pas de Discrétion) ; la zone de destination doit être vue.',
  effets: [],
  etat: 'inactif',
};

// ─── Contact (8) ─────────────────────────────────────────────────────────────

export const griffesDeCombat: ArmorModule = {
  id: 'griffes-de-combat',
  nom: 'Griffes de combat',
  categorie: 'contact',
  accessibilite: 'standard',
  coutPG: 10,
  slots: { brasGauche: 1 }, // « 1 à un bras » : au choix
  activation: 'aucune',
  duree: "jusqu'à désactivation",
  description:
    'Arme de mêlée intégrée : 2D6 (6) + Force, violence 1, contact. ' +
    'Niv 2 (10 PG) : effet au choix meurtrier ou choc 1, +1D6 dégâts. ' +
    'Niv 3 (rare, 30 PG) : effet au choix lesté ou pénétrant 5, +1D6 dégâts.',
  effets: [],
  etat: 'inactif',
};

// attaqueSurCasque : portée contact, énergie « – » dans la table
export const attaqueSurCasque: ArmorModule = {
  id: 'attaque-sur-casque',
  nom: 'Attaque sur casque',
  categorie: 'contact',
  accessibilite: 'standard',
  coutPG: 10,
  slots: { tete: 1 },
  activation: 'aucune',
  duree: 'Instantanée',
  description:
    '+1D6 dégâts au contact, chargeur 6. Niv 2 (20 PG) : bonus permanent, plus de rechargement.',
  effets: [],
  etat: 'inactif',
};

export const dard: ArmorModule = {
  id: 'dard',
  nom: 'Dard',
  categorie: 'contact',
  accessibilite: 'avance',
  coutPG: 20,
  slots: { brasGauche: 1 }, // « 1 à un bras » : au choix
  activation: 'action-deplacement',
  duree: 'Instantanée',
  description:
    'Inocule une substance (choix à l\u2019achat) : dégâts = Force, violence 1, contact ; silencieux / chargeur 3 ; effets : neurotoxine (dégâts continus 3 / ignore armure), sédatif (choc 2 / ignore armure), nanomachines (2D6 + destructeur). ' +
    'Niv 2 (15 PG) : chargeur 6. Niv 3 (15 PG) : les 3 substances simultanément.',
  effets: [],
  etat: 'inactif',
};

export const amplificationDeFrappe: ArmorModule = {
  id: 'amplification-de-frappe',
  nom: 'Amplification de frappe',
  categorie: 'contact',
  accessibilite: 'avance',
  coutPG: 20,
  slots: { brasGauche: 2 }, // « 2 à un bras » : au choix
  activation: 'aucune',
  duree: 'Instantanée',
  coutPE: '1/dé ajouté',
  description:
    'Ajoute 1D6 dégâts à une attaque de contact, jusqu\u2019à +6D6 ; 2 dégâts sur sa propre armure par dé au-delà du premier (sans CdF, jamais sur la santé). ' +
    'Niv 2 (20 PG) : les 3 premiers 1D6 sans contrecoup. Niv 3 (30 PG) : plus de contrecoup.',
  effets: [],
  etat: 'inactif',
};

export const decoupeur: ArmorModule = {
  id: 'decoupeur',
  nom: 'Découpeur',
  categorie: 'contact',
  accessibilite: 'avance',
  coutPG: 50,
  slots: { brasGauche: 2 }, // « 2 à un bras » : au choix
  activation: 'action-deplacement',
  duree: "jusqu'à désactivation",
  coutPE: '1',
  description:
    'Découpe presque tout (10 cm/tour sur matériaux résistants, sauf élément alpha) ; au combat : 3D6 (9) + Force, violence 1, ignore armure / anti-véhicule, malus de 3 dés pour toucher.',
  effets: [],
  etat: 'inactif',
};

export const attaquePortee: ArmorModule = {
  id: 'attaque-portee',
  nom: 'Attaque portée',
  categorie: 'contact',
  accessibilite: 'rare',
  coutPG: 30,
  slots: { brasGauche: 1, brasDroit: 1 },
  activation: 'action-deplacement',
  duree: 'Instantanée',
  coutPE: '5',
  description:
    'Frappes au corps à corps à distance via trous de ver (cible visible à portée longue) ; Perception ou Dextérité ≥ 5 requis, sinon 1 dé d\u2019aléa (1 = bras tranché, blessure grave, 0 PA, 0 PS). ' +
    'Niv 2 (40 PG) : surprise — cible à 0 en défense (ignoré par Bête/Machine/Masque exceptionnels).',
  effets: [],
  etat: 'inactif',
};

export const nova: ArmorModule = {
  id: 'nova',
  nom: 'Nova',
  categorie: 'contact',
  accessibilite: 'rare',
  coutPG: 20,
  slots: { torse: 2 },
  activation: 'action-combat',
  duree: 'Instantanée',
  coutPE: '6',
  description:
    'Onde de choc : ennemis (pas les bandes) à contact avec Chair < 10 subissent choc 1 automatiquement. ' +
    'Niv 2 (20 PG) : seuil Chair < 14. Niv 3 (20 PG) : portée courte, seuil Chair < 18 ; bandes de Chair < 18 aussi touchées (débordement annulé).',
  effets: [],
  etat: 'inactif',
};

// ─── Distance (9) ────────────────────────────────────────────────────────────

export const attaqueNonLetale: ArmorModule = {
  id: 'attaque-non-letale',
  nom: 'Attaque non létale',
  categorie: 'distance',
  accessibilite: 'standard',
  coutPG: 10,
  slots: { brasGauche: 1 }, // « 1 à un bras » : au choix
  activation: 'action-combat',
  duree: 'Instantanée',
  coutPE: '1',
  description:
    'Taser : 1D6 (3) + 6 dégâts, violence 1, choc 1 / chargeur 6 ; cible à 0 PS = inconscient 1D6 h (1 PS au réveil). ' +
    'Niv 2 (10 PG) : choc 2. Niv 3 (10 PG) : plus de chargeur.',
  effets: [],
  etat: 'inactif',
};

export const canonBalder: ArmorModule = {
  id: 'canon-balder',
  nom: 'Canon Balder',
  categorie: 'distance',
  accessibilite: 'standard',
  coutPG: 30,
  slots: { brasGauche: 2 }, // « 2 à un bras » : au choix
  activation: 'action-deplacement',
  duree: 'Instantanée',
  coutPE: '1',
  description:
    'Laser : 1D6 (3), violence 1D6 (3), +1D6 par 2 PE dépensés (max +3D6), dégâts comme violence ; anti-Anathème.',
  effets: [],
  etat: 'inactif',
};

export const grappin: ArmorModule = {
  id: 'grappin',
  nom: 'Grappin',
  categorie: 'distance',
  accessibilite: 'standard',
  coutPG: 20,
  slots: { brasGauche: 1 }, // « 1 à un bras » : au choix
  activation: 'action-combat',
  duree: 'Instantanée',
  coutPE: '1',
  description:
    '1 réussite auto pour escalader (≤ 50 m), empêche les échecs critiques en escalade ; rapproche un ennemi de Chair < 8 d\u2019un rang de portée (si Chair ≥ 14, c\u2019est le héros qui se rapproche).',
  effets: [],
  etat: 'inactif',
};

export const canonDeBras: ArmorModule = {
  id: 'canon-de-bras',
  nom: 'Canon de bras',
  categorie: 'distance',
  accessibilite: 'avance',
  coutPG: 30,
  slots: { brasGauche: 2 }, // « 2 à un bras » : au choix
  activation: 'action-combat',
  duree: 'Instantanée',
  coutPE: '1',
  description:
    'Canon léger : 3D6 (9) + 3 dégâts et violence ; 1 effet au choix à l\u2019achat (meurtrier, destructeur, ultraviolence). ' +
    'Niv 2 (30 PG) : effet supplémentaire parmi dispersion 3, lumière 2, assistance à l\u2019attaque ; +1D6 violence ou dégâts. ' +
    'Niv 3 (rare, 30 PG) : effet supplémentaire parmi ignore armure, ignore CdF, anti-véhicule ; +1D6 violence ou dégâts.',
  effets: [],
  etat: 'inactif',
};

export const armeDeTorse: ArmorModule = {
  id: 'arme-de-torse',
  nom: 'Arme de torse',
  categorie: 'distance',
  accessibilite: 'avance',
  coutPG: 20,
  slots: { torse: 2 },
  activation: 'action-combat',
  duree: 'Instantanée',
  coutPE: '8',
  description:
    'Arme de tir unique au torse : 7D6 (21) + 6 dégâts et violence ; ultraviolence / dispersion 6 / chargeur 1. Niv 2 (30 PG) : chargeur 3.',
  effets: [],
  etat: 'inactif',
};

export const podMissile: ArmorModule = {
  id: 'pod-missile',
  nom: 'Pod missile',
  categorie: 'distance',
  accessibilite: 'avance',
  coutPG: 30,
  // « 2 au torse ou 2 au bras » : les trois zones listées, choix à l'installation
  slots: { torse: 2, brasGauche: 2, brasDroit: 2 },
  activation: 'action-deplacement',
  duree: 'Instantanée',
  coutPE: '1',
  description:
    'Lance-missile guidé : 6D6 (18) + 3 dégâts, 1D6 (3) + 6 violence ; artillerie / anti-véhicule / chargeur 3 ; nécessite une cible désignée.',
  effets: [],
  etat: 'inactif',
};

export const canonDefensif: ArmorModule = {
  id: 'canon-defensif',
  nom: 'Canon défensif',
  categorie: 'distance',
  accessibilite: 'avance',
  coutPG: 30,
  slots: { torse: 2 },
  activation: 'aucune',
  duree: 'Instantanée',
  description:
    'IA défensive : 1×/tour, un hostile/salopard/patron attaquant le PJ au contact ou < 3 m subit automatiquement 2D6 dégâts ; +1D6 violence aux armes de tir du PJ à portée courte−. ' +
    'Niv 2 (20 PG) : porte à portée courte, 3D6 dégâts. Niv 3 (20 PG) : porte à portée moyenne, 4D6 dégâts.',
  effets: [],
  etat: 'inactif',
};

export const podRoquette: ArmorModule = {
  id: 'pod-roquette',
  nom: 'Pod roquette',
  categorie: 'distance',
  accessibilite: 'avance',
  coutPG: 30,
  // « 2 au torse ou 2 au bras » : les trois zones listées, choix à l'installation
  slots: { torse: 2, brasGauche: 2, brasDroit: 2 },
  activation: 'action-deplacement',
  duree: 'Instantanée',
  coutPE: '1',
  description:
    'Salve antipersonnel : 1D6 (3) + 6 dégâts, 6D6 (18) + 12 violence ; ultraviolence / chargeur 3. ' +
    'Niv 2 (20 PG) : ultraviolence remplacée par +2D6 violence. Niv 3 (rare, 30 PG) : démoralisant, chargeur 6.',
  effets: [],
  etat: 'inactif',
};

export const canonSolInvictus: ArmorModule = {
  id: 'canon-sol-invictus',
  nom: 'Canon Sol Invictus',
  categorie: 'distance',
  accessibilite: 'rare',
  coutPG: 80,
  // « 3 à un bras et 1 au torse, ou 4 au torse » : les deux configurations listées
  slots: { torse: 4, brasGauche: 3, brasDroit: 3 },
  activation: 'action-combat',
  duree: 'Instantanée',
  coutPE: '1',
  description:
    'Version lourde du Balder, tubes multiples : 3D6 (9) dégâts et violence, +1D6 par 1 PE (max +8D6) ; ignore CdF / anti-Anathème / lumière 6.',
  effets: [],
  etat: 'inactif',
};

// ─── Visée (2) ───────────────────────────────────────────────────────────────

export const vueAlternative: ArmorModule = {
  id: 'vue-alternative',
  nom: 'Vue alternative',
  categorie: 'visee',
  accessibilite: 'standard',
  coutPG: 10,
  slots: { tete: 1 },
  activation: 'aucune',
  duree: 'une scène / phase de conflit',
  coutPE: '2',
  description:
    'Ajoute 1 type de vision au choix : thermique (chaleur à travers obstacles peu épais, annule malus environnementaux), magnétique (métal à travers obstacles), heartbeat (battements de cœur via sonar), prédatrice (suit un ennemi désigné à travers obstacles jusqu\u2019à 2 km). ' +
    'Niv 2 (10 PG) : 2e vision. Niv 3 (20 PG) : 3e vision.',
  effets: [],
  etat: 'inactif',
};

export const designation: ArmorModule = {
  id: 'designation',
  nom: 'Désignation',
  categorie: 'visee',
  accessibilite: 'standard',
  coutPG: 10,
  slots: { tete: 1 },
  activation: 'aucune',
  duree: 'une scène / phase de conflit',
  coutPE: '2',
  description:
    'Désigne une cible à portée longue ou moins (effet désignation). ' +
    'Niv 2 (20 PG) : désigne une bande + 2 ennemis supplémentaires. Niv 3 (30 PG) : une bande + 3 ennemis supplémentaires.',
  effets: [],
  etat: 'inactif',
};

// ─── Défense (7) ─────────────────────────────────────────────────────────────

export const canonTnl: ArmorModule = {
  id: 'canon-tnl',
  nom: 'Canon TNL',
  categorie: 'defense',
  accessibilite: 'avance',
  coutPG: 10,
  slots: { brasGauche: 2 }, // « 2 à un bras » : au choix
  activation: 'action-deplacement',
  duree: 'Instantanée',
  coutPE: '1',
  description:
    'Tirs non létaux automatiques : 1 ennemi/tour à portée courte, Chair ≤ 10 subit choc 1. ' +
    'Niv 2 (10 PG) : Chair ≤ 12. Niv 3 (10 PG) : Chair ≤ 14.',
  effets: [],
  etat: 'inactif',
};

export const contreMesures: ArmorModule = {
  id: 'contre-mesures',
  nom: 'Contre-mesures',
  categorie: 'defense',
  accessibilite: 'avance',
  coutPG: 20,
  slots: { torse: 2 },
  activation: 'aucune',
  duree: 'Instantanée',
  coutPE: '2',
  description:
    'Annule dégâts et effets d\u2019un missile ou d\u2019une roquette ; chargeur 3. ' +
    'Niv 2 (10 PG) : chargeur 6. Niv 3 (10 PG) : chargeur 10.',
  effets: [],
  etat: 'inactif',
};

export const interception: ArmorModule = {
  id: 'interception',
  nom: 'Interception',
  categorie: 'defense',
  accessibilite: 'rare',
  coutPG: 50,
  slots: { brasGauche: 1, brasDroit: 1, jambeGauche: 1, jambeDroite: 1, torse: 1 },
  activation: 'aucune',
  duree: 'Instantanée',
  coutPE: '4',
  description:
    'Utiliser une action de déplacement à tout moment du tour (immédiat). ' +
    'Niv 2 (50 PG) : pour 8 PE, utiliser une action de combat à tout moment du tour.',
  effets: [],
  etat: 'inactif',
};

export const accumulationDeForce: ArmorModule = {
  id: 'accumulation-de-force',
  nom: 'Accumulation de force',
  categorie: 'defense',
  accessibilite: 'rare',
  coutPG: 50,
  slots: { brasGauche: 1, brasDroit: 1, jambeGauche: 1, jambeDroite: 1, torse: 1 },
  activation: 'aucune',
  duree: 'une scène / phase de conflit',
  coutPE: '8',
  description:
    'Conserve 1 dé par tranche de 6 dégâts encaissés par le CdF (max 8 dés) ; relâchement en action de déplacement : dés convertis en dégâts (ou violence) à portée contact, choc 1 si Chair < 14, effet ignore CdF ; ensuite CdF = 0 pendant 1D6 tours (module inutilisable). ' +
    'Niv 2 (50 PG) : cumul max 12 dés ; 1 seul tour sans CdF.',
  effets: [],
  etat: 'inactif',
};

// ─── Tactique (9) ────────────────────────────────────────────────────────────

export const relaisSatellite: ArmorModule = {
  id: 'relais-satellite',
  nom: 'Relais satellite',
  categorie: 'tactique',
  accessibilite: 'standard',
  coutPG: 10,
  slots: { tete: 1, torse: 1 }, // « 1 à la tête ou 1 au torse » : au choix
  activation: 'aucune',
  duree: 'Aucune',
  coutPE: '4',
  description:
    'Accès aux satellites du Knight : relevés topographiques, images récentes. ' +
    'Niv 2 (10 PG) : relevés thermiques et magnétiques. Niv 3 (10 PG) : haute définition, repérage précis des troupes ennemies.',
  effets: [],
  etat: 'inactif',
};

export const moduleCameraman: ArmorModule = {
  id: 'module-cameraman',
  nom: 'Module caméraman',
  categorie: 'tactique',
  accessibilite: 'standard',
  coutPG: 10,
  slots: { tete: 1 },
  activation: 'aucune',
  duree: "jusqu'à désactivation",
  description: 'Caméra HD + micro HF sur le casque, activation gratuite.',
  effets: [],
  etat: 'inactif',
};

export const banner: ArmorModule = {
  id: 'banner',
  nom: 'Banner',
  categorie: 'tactique',
  accessibilite: 'avance',
  coutPG: 10,
  slots: { tete: 1, torse: 1 }, // « 1 à la tête ou 1 au torse » : au choix
  activation: 'action-deplacement',
  duree: "Spécial (jusqu'à distraction des ennemis)",
  coutPE: '3',
  description:
    'Attire les ennemis à Machine < 8 dans un rayon de portée longue : ils n\u2019attaquent que lui. Plusieurs Banner actifs : les ennemis se séparent en groupes égaux.',
  effets: [],
  etat: 'inactif',
};

export const billesSonar: ArmorModule = {
  id: 'billes-sonar',
  nom: 'Billes sonar',
  categorie: 'tactique',
  accessibilite: 'avance',
  coutPG: 20,
  slots: { brasGauche: 2 }, // « 2 au bras » : au choix
  activation: 'action-deplacement',
  duree: 'une scène / phase de conflit',
  description:
    'Bille-sonar (lancement à portée moyenne max) : repère les êtres vivants (même invisibles) dans un rayon de portée courte ; considérés comme désignés pour les tirs ; chargeur 9.',
  effets: [],
  etat: 'inactif',
};

export const droneEspionnage: ArmorModule = {
  id: 'drone-espionnage',
  nom: 'Drone d\u2019espionnage',
  categorie: 'tactique',
  accessibilite: 'avance',
  coutPG: 20,
  slots: { torse: 1 },
  activation: 'action-deplacement',
  duree: 'une scène / phase de conflit',
  description:
    'Quadriptère espion : caméra + micro reliés au casque ; autonomie 2 h, portée 20 km ; roues optionnelles. Profil : Défense 5, Réaction 5, Armure 20, CdF 10, Vitesse 3 ; Discrétion 10D6 + 2 OD ; Déplacement 8D6.',
  effets: [],
  etat: 'inactif',
};

export const diffuseurNanoM: ArmorModule = {
  id: 'diffuseur-nanom',
  nom: 'Diffuseur de nanoM',
  categorie: 'tactique',
  accessibilite: 'avance',
  coutPG: 20,
  slots: { torse: 1 },
  activation: 'aucune',
  duree: 'Instantanée',
  coutPE: '5',
  description:
    'NanoM médicales : récupère 1D6 PS ; automatique à 0 PS. Niv 2 (10 PG) : 2D6 PS.',
  effets: [],
  etat: 'inactif',
};

export const wolfpack: ArmorModule = {
  id: 'wolfpack',
  nom: 'Wolfpack',
  categorie: 'tactique',
  accessibilite: 'rare',
  coutPG: 10,
  slots: { tete: 1, torse: 1 }, // « 1 à la tête ou 1 au torse » : au choix
  activation: 'aucune',
  duree: "jusqu'à désactivation",
  description:
    'Sait toujours où sont les membres de son équipe dans un rayon de 80 km.',
  effets: [],
  etat: 'inactif',
};

export const couvertPortatif: ArmorModule = {
  id: 'couvert-portatif',
  nom: 'Couvert portatif',
  categorie: 'tactique',
  accessibilite: 'rare',
  coutPG: 20,
  slots: { torse: 2 },
  activation: 'action-deplacement',
  duree: 'une scène / phase de conflit',
  description:
    'Crée un couvert standard (balle à nanoM) ; chargeur 3. ' +
    'Niv 2 (10 PG) : chargeur 6, couvert amélioré (+1 réaction). Niv 3 (10 PG) : chargeur 9, +1 réaction supplémentaire.',
  effets: [],
  etat: 'inactif',
};

// ─── Utilitaire (8) ──────────────────────────────────────────────────────────

export const podFuseesEclairantes: ArmorModule = {
  id: 'pod-fusees-eclairantes',
  nom: 'Pod fusées éclairantes',
  categorie: 'utilitaire',
  accessibilite: 'standard',
  coutPG: 10,
  slots: { torse: 1, brasGauche: 1 }, // « 1 au torse ou 1 à un bras » : au choix
  activation: 'action-deplacement',
  duree: '1D6 tours',
  coutPE: '2',
  description:
    'Fusée blanche éblouissante : humains sans protection oculaire ni méta-armure subissent −1 dé ; Anathème : −2 dés et lumière 2 ; chargeur 3 ; aucun dégât. ' +
    'Niv 2 (30 PG) : lumière 4, chargeur 6. Niv 3 (50 PG) : anti-Anathème, chargeur 9.',
  effets: [],
  etat: 'inactif',
};

export const voyager: ArmorModule = {
  id: 'voyager',
  nom: 'Voyager',
  categorie: 'utilitaire',
  accessibilite: 'standard',
  coutPG: 10,
  slots: { torse: 1 },
  activation: 'aucune',
  duree: '—', // pas d'activation ni de durée dans la table
  description:
    'Plus besoin de manger ni boire pendant la mission (max 30 jours).',
  effets: [],
  etat: 'inactif',
};

export const interfaceSensitiveRigg: ArmorModule = {
  id: 'interface-sensitive-rigg',
  nom: 'Interface sensitive RIGG',
  categorie: 'utilitaire',
  accessibilite: 'standard',
  coutPG: 30,
  slots: { tete: 2 },
  activation: 'aucune',
  duree: '—', // pas d'activation ni de durée dans la table
  description:
    'Contrôle par la pensée des drones, véhicules et systèmes à portée moyenne max ; démarrage à distance possible (test Technique si mot de passe/clé) ; ne prend pas le contrôle des systèmes déjà utilisés.',
  effets: [],
  etat: 'inactif',
};

export const miniaturisation: ArmorModule = {
  id: 'miniaturisation',
  nom: 'Miniaturisation',
  categorie: 'utilitaire',
  accessibilite: 'avance',
  coutPG: 20,
  slots: {}, // « – » : n'occupe aucun slot
  activation: 'aucune',
  duree: '—', // pas d'activation ni de durée dans la table
  description:
    'Un module occupe un slot de moins (minimum 0), quelles que soient ses localisations.',
  effets: [],
  etat: 'inactif',
};

export const thunderSecurity: ArmorModule = {
  id: 'thunder-security',
  nom: 'Thunder security',
  categorie: 'utilitaire',
  accessibilite: 'avance',
  coutPG: 50,
  slots: { tete: 1, brasGauche: 1, brasDroit: 1, jambeGauche: 1, jambeDroite: 1, torse: 1 },
  activation: 'aucune',
  duree: '—', // pas d'activation ni de durée dans la table
  description: 'Ignore la capacité drain d\u2019énergie, l\u2019effet parasitage X et les IEM.',
  effets: [],
  etat: 'inactif',
};

export const masseDeControle: ArmorModule = {
  id: 'masse-de-controle',
  nom: 'Masse de contrôle',
  categorie: 'utilitaire',
  accessibilite: 'rare',
  coutPG: 50,
  slots: {}, // « – » : n'occupe aucun slot
  activation: 'aucune',
  duree: '—', // pas d'activation ni de durée dans la table
  description:
    'Accorde 1 slot supplémentaire sur toutes les localisations. ' +
    'Niv 2 (30 PG) : +1 slot. Niv 3 (30 PG) : +1 slot.',
  effets: [],
  etat: 'inactif',
};

export const accelerateur: ArmorModule = {
  id: 'accelerateur',
  nom: 'Accélérateur',
  categorie: 'utilitaire',
  accessibilite: 'rare',
  coutPG: 50,
  slots: { torse: 1, brasGauche: 1, brasDroit: 1, jambeGauche: 1, jambeDroite: 1 },
  activation: 'aucune',
  duree: 'Instantanée',
  coutPE: '5',
  description:
    'Action de déplacement supplémentaire (1×/tour). ' +
    'Niv 2 (100 PG) : ajoute aussi 1 action de combat supplémentaire par tour (1×/tour).',
  effets: [],
  etat: 'inactif',
};

export const interfaceBabel: ArmorModule = {
  id: 'interface-babel',
  nom: 'Interface Babel',
  categorie: 'utilitaire',
  accessibilite: 'rare',
  coutPG: 50,
  slots: { tete: 1 },
  activation: 'aucune',
  duree: '—', // pas d'activation ni de durée dans la table
  description:
    'Traduction automatique de toutes les langues dans/depuis le casque (choix automatique par interlocuteur).',
  effets: [],
  etat: 'inactif',
};

// ─── Amélioration (armure) (3) — pas de slots/activation dans la table ───────

export const blindageAmeliore: ArmorModule = {
  id: 'blindage-ameliore',
  nom: 'Blindage amélioré',
  categorie: 'amelioration',
  accessibilite: 'avance',
  coutPG: 30,
  slots: {},
  activation: 'aucune',
  duree: '—', // permanent
  description:
    '+10 PA permanents (tous modèles). Niv 2 (30 PG) : +10 PA supplémentaires. Niv 3 (rare, 30 PG) : +10 PA supplémentaires.',
  effets: [{ source: 'Blindage amélioré', target: 'pa', valeur: 10, type: 'bonus' }],
  etat: 'inactif',
};

export const champDeForceAmeliore: ArmorModule = {
  id: 'champ-de-force-ameliore',
  nom: 'Champ de force amélioré',
  categorie: 'amelioration',
  accessibilite: 'avance',
  coutPG: 40,
  slots: {},
  activation: 'aucune',
  duree: '—', // permanent
  description:
    '+3 CdF permanents (tous modèles). Niv 2 (40 PG) : +3 CdF. Niv 3 (rare, 40 PG) : +3 CdF.',
  effets: [{ source: 'Champ de force amélioré', target: 'cdf', valeur: 3, type: 'bonus' }],
  etat: 'inactif',
};

export const energieAmelioree: ArmorModule = {
  id: 'energie-amelioree',
  nom: 'Énergie améliorée',
  categorie: 'amelioration',
  accessibilite: 'avance',
  coutPG: 30,
  slots: {},
  activation: 'aucune',
  duree: '—', // permanent
  description:
    '+10 PE permanents (tous modèles). Niv 2 (30 PG) : +10 PE. Niv 3 (rare, 30 PG) : +10 PE.',
  effets: [{ source: 'Énergie améliorée', target: 'pe', valeur: 10, type: 'bonus' }],
  etat: 'inactif',
};

// ─── Automatisé (2) ──────────────────────────────────────────────────────────

export const tourelleAutomatisee: ArmorModule = {
  id: 'tourelle-automatisee',
  nom: 'Tourelle automatisée',
  categorie: 'automatise',
  accessibilite: 'standard',
  coutPG: 10,
  slots: { torse: 2 }, // plus rien une fois déployée
  activation: 'action-deplacement',
  duree: 'une scène / phase de conflit',
  description:
    'Petite tourelle avec une arme de tir au choix (payer le coût de l\u2019arme) ; sonar, tire sur les cibles désignées, mode sécurité possible ; 1 action de combat/tour. Profil : Défense 0, Réaction 0, Armure 50, CdF 6 ; jet pour toucher 8D6 + 2 OD ; dégâts de l\u2019arme achetée.',
  effets: [],
  etat: 'inactif',
};

export const tourelleEpaule: ArmorModule = {
  id: 'tourelle-epaule',
  nom: 'Tourelle d\u2019épaule',
  categorie: 'automatise',
  accessibilite: 'avance',
  coutPG: 30,
  slots: { torse: 2, brasGauche: 1 }, // « 2 au torse, 1 à un bras » : bras au choix
  activation: 'action-deplacement',
  duree: 'Instantanée',
  coutPE: '2',
  description:
    'Arme de tir de l\u2019arsenal (sans effet lourd) compactée sur l\u2019épaule ; payer le coût de l\u2019arme ; changement seulement entre missions ; tire via 1 action de déplacement.',
  effets: [],
  etat: 'inactif',
};

/** Modules interdits à la Paladin (« Lente et lourde », p.140) — références pour le moteur */
export const MODULES_INTERDITS_PALADIN = ['course', 'deplacement-silencieux', 'saut'];

/**
 * Catalogue complet des modules de méta-armure (hors overdrives) : 57 modules.
 * Les 15 overdrives sont catalogués dans src/data/overdrives.ts.
 */
export const catalogueModules: ArmorModule[] = [
  // Déplacement
  saut,
  motoSteed,
  wingsuit,
  course,
  deplacementSilencieux,
  adherence,
  vol,
  moduleDePhase,
  teleportation,
  // Contact
  griffesDeCombat,
  lameDeBras,
  attaqueSurCasque,
  dard,
  amplificationDeFrappe,
  decoupeur,
  attaquePortee,
  nova,
  // Distance
  attaqueNonLetale,
  canonBalder,
  grappin,
  canonDeBras,
  armeDeTorse,
  podMissile,
  canonDefensif,
  podRoquette,
  canonSolInvictus,
  // Visée
  vueAlternative,
  designation,
  // Défense
  fumigene,
  flash,
  canonTnl,
  contreMesures,
  blindageDrone,
  interception,
  accumulationDeForce,
  // Tactique
  relaisSatellite,
  relaisTaccom,
  moduleCameraman,
  banner,
  billesSonar,
  droneEspionnage,
  diffuseurNanoM,
  wolfpack,
  couvertPortatif,
  // Utilitaire
  podFuseesEclairantes,
  voyager,
  interfaceSensitiveRigg,
  miniaturisation,
  thunderSecurity,
  masseDeControle,
  accelerateur,
  interfaceBabel,
  // Amélioration
  blindageAmeliore,
  champDeForceAmeliore,
  energieAmelioree,
  // Automatisé
  tourelleAutomatisee,
  tourelleEpaule,
];
