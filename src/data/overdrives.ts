/**
 * Overdrives de méta-armure — annexe 2 (digest PARTIE 4, lignes 903-923).
 * 15 overdrives (3 Chair, 3 Machine, 3 Bête, 3 Dame, 3 Masque).
 * Règles communes : +1 réussite automatique par niveau sur les combos de la
 * caractéristique ; 0 slot (intégrés à l'armure) ; coûts identiques —
 * niv 1 = 10 PG, niv 2 = 30 PG, niv 3 = 50 PG (rare), niv 4 = 70 PG (rare),
 * niv 5 = 100 PG (rare) ; les niveaux précédents sont requis ; au-delà de
 * 2 niveaux, accès rare (300 PG cumulés) requis.
 * Seuls les paliers offrant un bonus au-delà de la réussite automatique sont
 * décrits : les niveaux absents de `paliers` n'apportent que la réussite auto.
 */
import type { TraitId } from '../types/character';

export interface OverdriveCatalogue {
  /** Aspect du digest (ex. 'Chair') — informationnel */
  aspect: string;
  trait: TraitId;
  nom: string;
  paliers: { niveau: number; coutPG: number; effet: string }[];
}

export const catalogueOverdrives: OverdriveCatalogue[] = [
  {
    aspect: 'Chair',
    trait: 'deplacement',
    nom: 'Overdrive de Déplacement (calculateur de trajectoire/servomoteurs)',
    paliers: [
      { niveau: 1, coutPG: 10, effet: 'Déplacement courte en action de déplacement ; avec le module Course, cette action est gratuite (1×/tour).' },
      { niveau: 2, coutPG: 30, effet: 'Franchit sans test les obstacles de sa taille.' },
      { niveau: 3, coutPG: 50, effet: 'Portée moyenne, action gratuite avec Course.' },
      { niveau: 4, coutPG: 70, effet: 'Franchit sans test les obstacles ≤ 5 m.' },
      { niveau: 5, coutPG: 100, effet: 'Chute sans dégâts sous 50 m.' },
    ],
  },
  {
    aspect: 'Chair',
    trait: 'endurance',
    nom: 'Overdrive d\u2019Endurance (compensateur de dégâts)',
    paliers: [
      { niveau: 2, coutPG: 30, effet: 'Ignore choc 1.' },
      { niveau: 3, coutPG: 50, effet: '+6 PS en méta-armure.' },
      { niveau: 4, coutPG: 70, effet: 'Ignore choc 2 et inférieur.' },
      { niveau: 5, coutPG: 100, effet: 'Soustrait son Endurance (sans OD) au débordement des bandes (à chaque addition).' },
    ],
  },
  {
    aspect: 'Chair',
    trait: 'force',
    nom: 'Overdrive de Force (fibres musculaires/endosquelette)',
    paliers: [
      { niveau: 1, coutPG: 10, effet: 'Soulève 500 kg, +3 dégâts au contact.' },
      { niveau: 2, coutPG: 30, effet: 'Soulève 2 t, +6 dégâts au contact.' },
      { niveau: 3, coutPG: 50, effet: 'Soulève 10 t, +9 dégâts au contact.' },
      { niveau: 4, coutPG: 70, effet: 'Soulève 30 t, +12 dégâts au contact.' },
      { niveau: 5, coutPG: 100, effet: 'Soulève 80 t, +15 dégâts au contact.' },
    ],
  },
  {
    aspect: 'Machine',
    trait: 'technique',
    nom: 'Overdrive de Technique (système d\u2019ingénierie intégré)',
    paliers: [
      { niveau: 1, coutPG: 10, effet: 'Connexion directe aux appareils sans pare-feu.' },
      { niveau: 2, coutPG: 30, effet: 'Test Technique pour comprendre/réparer/hacker tout objet inconnu.' },
      { niveau: 3, coutPG: 50, effet: 'Connexion wifi à portée lointaine, pare-feux simples passés sans test.' },
      { niveau: 4, coutPG: 70, effet: 'Action de déplacement = réparation d\u2019urgence (test Technique très difficile (9)) : +6 PA méta-armure/véhicule, répare une arme cassée.' },
      { niveau: 5, coutPG: 100, effet: 'Crée des virus/programmes à distance (1/tour, action de déplacement en conflit), simultanéité = score de Technique.' },
    ],
  },
  {
    aspect: 'Machine',
    trait: 'savoir',
    nom: 'Overdrive de Savoir (IA évoluée)',
    paliers: [
      { niveau: 1, coutPG: 10, effet: 'Accès instantané aux banques d\u2019information.' },
      { niveau: 2, coutPG: 30, effet: 'Informations temps réel dans un rayon de 2 km.' },
      { niveau: 3, coutPG: 50, effet: 'Soins +1D6 PS supplémentaires à l\u2019assistance (1×/scène).' },
      { niveau: 4, coutPG: 70, effet: 'Toutes les bases Knight/immortels, fiches instantanées.' },
      { niveau: 5, coutPG: 100, effet: 'Ignore les échecs critiques sur tout test.' },
    ],
  },
  {
    aspect: 'Machine',
    trait: 'tir',
    nom: 'Overdrive de Tir (assistance au tir)',
    paliers: [
      { niveau: 2, coutPG: 30, effet: 'Ignore le premier malus de portée.' },
      { niveau: 3, coutPG: 50, effet: 'Akimbo à distance, malus 1 dé.' },
      { niveau: 4, coutPG: 70, effet: 'Ambidextrie à distance, malus 1 dé (pas avec Watchtower Paladin).' },
      { niveau: 5, coutPG: 100, effet: 'Violence de ses armes sur la bande + dégâts sur l\u2019ennemi visé en une attaque.' },
    ],
  },
  {
    aspect: 'Bête',
    trait: 'combat',
    nom: 'Overdrive de Combat (IA de close combat)',
    paliers: [
      { niveau: 2, coutPG: 30, effet: 'Réaction +2 en combat au corps à corps en phase de conflit.' },
      { niveau: 3, coutPG: 50, effet: 'Akimbo avec armes de contact, malus 1 dé.' },
      { niveau: 4, coutPG: 70, effet: 'Ambidextrie avec armes de contact, malus 1 dé.' },
      { niveau: 5, coutPG: 100, effet: 'Violence sur la bande + dégâts sur l\u2019ennemi visé en une attaque au contact.' },
    ],
  },
  {
    aspect: 'Bête',
    trait: 'hargne',
    nom: 'Overdrive de Hargne (booster d\u2019adrénaline)',
    paliers: [
      { niveau: 3, coutPG: 50, effet: 'À 0 PS ne meurt pas, combat la mort (blessure grave ; nouvelle attaque/dégâts = agonie).' },
      { niveau: 4, coutPG: 70, effet: 'À 0 PS agit normalement sans blessure grave ; test Hargne (difficulté = dégâts de santé du dernier tour ×2) à chaque nouveau dégât ; 1 blessure grave / tranche de 5 PS perdus.' },
      { niveau: 5, coutPG: 100, effet: 'Ignore la capacité Anathème.' },
    ],
  },
  {
    aspect: 'Bête',
    trait: 'instinct',
    nom: 'Overdrive d\u2019Instinct (activateur cérébral)',
    paliers: [
      { niveau: 2, coutPG: 30, effet: 'Initiative testée 2 fois, meilleur score.' },
      { niveau: 3, coutPG: 50, effet: '+3 initiative par OD d\u2019Instinct.' },
      { niveau: 4, coutPG: 70, effet: 'Attaqué par surprise, conserve défense, réaction et CdF normaux.' },
      { niveau: 5, coutPG: 100, effet: 'Détecte les ennemis invisibles ; jamais en embuscade (alliés compris).' },
    ],
  },
  {
    aspect: 'Dame',
    trait: 'aura',
    nom: 'Overdrive d\u2019Aura (régulateur de phéromone)',
    paliers: [
      { niveau: 2, coutPG: 30, effet: 'Contre humains, attaqué en dernier.' },
      { niveau: 3, coutPG: 50, effet: '2 contacts/alliés PNJ par scénario (Dame ou Machine PNJ/2 < Aura).' },
      { niveau: 4, coutPG: 70, effet: 'Attire toute l\u2019attention 1 tour (test Aura vs Machine/2 ; difficulté MJ en combat).' },
      { niveau: 5, coutPG: 100, effet: 'Ajoute l\u2019Aura à la défense.' },
    ],
  },
  {
    aspect: 'Dame',
    trait: 'sangfroid',
    nom: 'Overdrive de Sang-Froid (diffuseur d\u2019endorphine)',
    paliers: [
      { niveau: 2, coutPG: 30, effet: 'Ignore les malus de difficulté en situation stressante.' },
      { niveau: 3, coutPG: 50, effet: 'Relance 1 jet d\u2019espoir raté (1×/test).' },
      { niveau: 4, coutPG: 70, effet: 'Ignore la capacité peur.' },
      { niveau: 5, coutPG: 100, effet: 'Ignore la capacité domination.' },
    ],
  },
  {
    aspect: 'Dame',
    trait: 'parole',
    nom: 'Overdrive de Parole (modulateur de voix)',
    paliers: [
      { niveau: 1, coutPG: 10, effet: 'Allié tombé à 0 PS < 1 min : dernier souffle tant que le héros lui parle.' },
      { niveau: 2, coutPG: 30, effet: 'Discours = +1D6 espoir à un héros (1×/mission/héros).' },
      { niveau: 3, coutPG: 50, effet: 'Imite toute voix entendue sans test.' },
      { niveau: 4, coutPG: 70, effet: 'Hypnose d\u2019un humain (Parole vs Machine/2 ; actions simples possibles ; immunité des aspects exceptionnels majeurs).' },
      { niveau: 5, coutPG: 100, effet: '+2D6 espoir à un allié (remplace le niveau 2).' },
    ],
  },
  {
    aspect: 'Masque',
    trait: 'perception',
    nom: 'Overdrive de Perception (afficheur tête haute)',
    paliers: [
      { niveau: 1, coutPG: 10, effet: 'Zoom ×400 à portée lointaine.' },
      { niveau: 2, coutPG: 30, effet: 'Zoom audio lointain.' },
      { niveau: 3, coutPG: 50, effet: 'Zoom olfactif et tactile (activation mentale).' },
      { niveau: 4, coutPG: 70, effet: 'Fiche d\u2019informations automatique sur objets/bâtiments/personnes.' },
      { niveau: 5, coutPG: 100, effet: 'Sonar permanent (êtres vivants à portée moyenne à travers obstacles) ; surprise/dos/invisibilité : conserve défense et réaction normales.' },
    ],
  },
  {
    aspect: 'Masque',
    trait: 'discretion',
    nom: 'Overdrive de Discrétion (atténuateur de bruit/camouflage)',
    paliers: [
      { niveau: 2, coutPG: 30, effet: 'Attaque un ennemi qui ne le voit pas : ajoute sa Discrétion (sans OD) aux dégâts (cumulable).' },
      { niveau: 3, coutPG: 50, effet: 'Jamais repéré par les bruits de pas ; déplacement discret court/moyenne = réussite automatique.' },
      { niveau: 4, coutPG: 70, effet: 'Immobile = se fond dans le décor (Machine/Masque PNJ < 12 ne le voient pas).' },
      { niveau: 5, coutPG: 100, effet: 'Discrétion avec OD aux dégâts furtifs ; peut commencer une phase de conflit en embuscade.' },
    ],
  },
  {
    aspect: 'Masque',
    trait: 'dexterite',
    nom: 'Overdrive de Dextérité (système d\u2019aide à la coordination)',
    paliers: [
      { niveau: 3, coutPG: 50, effet: 'Jamais désarmé, ne tombe pas sur malus environnemental.' },
      { niveau: 4, coutPG: 70, effet: 'Ignore l\u2019effet lourd ; peut remplacer Combat/Tir par Dextérité dans ses tests.' },
      { niveau: 5, coutPG: 100, effet: 'Pare les projectiles ; utilise sa défense (au lieu de la réaction) pour parer les tirs.' },
    ],
  },
];
