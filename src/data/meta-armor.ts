/**
 * Méta-armure PALADIN — règles pp.138-141 (+ FAQ pp.449-455, 464).
 * Source unique : knight-rules-reference.md, PARTIE 3 §1.
 */
import type { MetaArmor } from '../types/character';

export const paladin: MetaArmor = {
  modele: 'paladin',
  generation: 1,
  // Slots p.138 : Tête 7 · Bras G 7 · Bras D 7 · Torse 10 · Jambe G 7 · Jambe D 7
  slots: {
    tete: 7,
    torse: 10,
    brasGauche: 7,
    brasDroit: 7,
    jambeGauche: 7,
    jambeDroite: 7,
  },
  // Profil p.138 : 120 PA (blindage ~10 cm), 20 PE, CdF 8
  paTotal: 120,
  peTotal: 20,
  cdfTotal: 8,
  // 4 OD de base (p.138) : un dans une caractéristique de 4 aspects DIFFÉRENTS,
  // au choix du joueur. TRANCHAGE v4 §0.1 : Tir = Machine, Perception = Masque
  // (l'exemple du digest « Tir/Perception (Dame) » est faux).
  // Exemple codé : force (Chair), tir (Machine), perception (Masque), sangfroid (Dame).
  overdrivesDeBase: [
    { trait: 'force', niveau: 1 },
    { trait: 'tir', niveau: 1 },
    { trait: 'perception', niveau: 1 },
    { trait: 'sangfroid', niveau: 1 },
  ],
  capacites: [
    {
      id: 'shrine',
      nom: 'Champ de force Shrine',
      description:
        "Dôme bleuté de 6 m de diamètre. Toute personne à l'intérieur possède +6 CdF " +
        "(+8 avec l'évolution 200 PG). Bonus perdu à la moindre sortie. Entrer exige " +
        'Force 5 OU Chair 10 (les bandes subissent toujours le bonus). Shrine immobile, ' +
        'non cumulable, un seul à la fois. Munitions et alliés sortent librement.',
      // p.140 : 1 PE (2 si déployé à distance) ; évolution 200 PG : 5 PE sur soi / 10 à distance
      coutPE: '1 (2 si à distance)',
      activation: 'aucune',
      duree: '1 tour, maintenable en payant les PE chaque tour (FAQ p.455)',
      effets: [
        {
          // FAQ p.449/455 : les bonus de CdF ne se cumulent pas — le plus gros gagne.
          // type 'max' : le moteur retient max(bonus actifs) en plus du CdF propre.
          source: 'Shrine',
          target: 'cdf',
          valeur: 6, // 8 avec l'évolution 200 PG
          type: 'max',
        },
      ],
      active: false,
    },
    {
      id: 'watchtower',
      nom: 'Mode Watchtower',
      description:
        "Stabilisateurs déployés sur les jambes. L'armure ne peut plus se déplacer et " +
        'sa réaction est divisée par 2 (FAQ p.455 : sur la valeur initiale, avant ' +
        'modificateurs). Dès le tour suivant : 1 action de combat supplémentaire, ' +
        'uniquement pour le tir. Chaque tir supplémentaire coûte 1 PE. Akimbo possible, ' +
        'ambidextre interdit (FAQ p.455).',
      coutPE: '2 (activation) + 1 par tir supplémentaire',
      activation: 'action-deplacement',
      duree: "jusqu'à désactivation",
      effets: [
        {
          source: 'Watchtower',
          target: 'reaction',
          valeur: 2, // diviseur encodé : reaction_effective = base / 2 (FAQ p.455)
          type: 'remplacement',
        },
      ],
      active: false,
    },
  ],
  handicaps: [
    // Handicap "Lente et lourde" p.140
    'Interdiction des modules course, déplacement silencieux et saut',
    'Le MJ peut déclarer risqué le passage sur tout sol trop fragile',
    'Tests base Discrétion et Déplacement : difficulté de base augmentée dun niveau',
  ],
  evolutions: [
    {
      seuilPG: 150,
      description:
        "Slotage d'armes de tir dans les bras : 1 arme de tir (sans attribut lourd) par bras " +
        '(2 slots pour une arme à 2 mains). Les armes slotées sont considérées "en main". ' +
        "Aisance n'a aucun effet ici (FAQ p.455).",
      effets: [],
    },
    {
      seuilPG: 200,
      description:
        'Le Shrine offre 8 CdF au lieu de 6. Activation sur soi : 6 tours pour 5 PE ; ' +
        'à portée moyenne : 10 PE.',
      effets: [
        {
          source: 'Shrine (évolution 200 PG)',
          target: 'cdf',
          valeur: 8,
          type: 'max',
        },
      ],
    },
    {
      seuilPG: 250,
      description:
        "Plaques de blindage allégées : l'effet « Lente et lourde » est annulé " +
        '(2 places de véhicule, jamais de moto steed — FAQ p.455).',
      effets: [],
    },
  ],
};
