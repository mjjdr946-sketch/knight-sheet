/**
 * Les 9 méta-armures — étape 7 (p.129-131) + PARTIE 6 (capacités, pp.141-170).
 * Profils chiffrés complets depuis le digest PARTIE 6 (v8) : les placeholders
 * PA/PE/CdF/slots/OD de l'itération 4 sont remplacés par les vraies valeurs.
 * Capacités : Paladin (Shrine/Watchtower), Priest (nanoC/Mechanic) et
 * Barbarian (Goliath) AUTOMATISÉES ; les 6 autres en description
 * (placeholder RÈGLES: à compléter — effets non chiffrés en Modifier).
 */
import type { MetaArmor } from '../types/character';
import { paladin as paladinArmure } from './meta-armor';

/** Gabarit : profil chiffré PARTIE 6 + capacités (automatisées ou en texte) */
function gabarit(
  modele: string,
  generation: 1 | 2,
  profil: { pa: number; pe: number; cdf: number; slots: [number, number, number, number, number, number] },
  odBase: string[],
  capacites: MetaArmor['capacites'],
  handicaps: string[],
): MetaArmor {
  const [tete, torse, brasG, brasD, jambeG, jambeD] = profil.slots;
  return {
    modele,
    generation,
    slots: { tete, torse, brasGauche: brasG, brasDroit: brasD, jambeGauche: jambeG, jambeDroite: jambeD },
    paTotal: profil.pa,
    peTotal: profil.pe,
    cdfTotal: profil.cdf,
    overdrivesDeBase: odBase.map((trait) => ({ trait: trait as MetaArmor['overdrivesDeBase'][number]['trait'], niveau: 1 })),
    capacites,
    handicaps,
    evolutions: [], // RÈGLES: à compléter — évolutions 150/200/250 PG pp.141-170
  };
}

export const META_ARMURES: Record<string, MetaArmor> = {
  // ─── PALADIN — profil complet + Shrine/Watchtower automatisées (p.138-141) ───
  paladin: paladinArmure,

  // ─── PRIEST (p.143-146) : nanoC / Mechanic ───────────────────────────────
  priest: gabarit(
    'priest', 1,
    { pa: 70, pe: 60, cdf: 10, slots: [5, 8, 5, 5, 5, 5] },
    ['force', 'endurance', 'savoir', 'technique'],
    [
      {
        id: 'nanoc',
        nom: 'Mode nanoC (construction)',
        description:
          'Crée formes simples (3 m³, 3 PE), objets détaillés (2 m³, 6 PE), objets mécaniques/électroniques (1 m³, 9 PE). ' +
          'Test base Technique (difficulté MJ). Durée 1 minute (10 tours), +2 PE par minute supplémentaire. (p.144)',
        coutPE: '3/6/9',
        activation: 'action-deplacement',
        duree: '1 minute (10 tours)',
        effets: [],
        active: false,
      },
      {
        id: 'mechanic',
        nom: 'Mode Mechanic (réparation)',
        description:
          'Au contact : restaure 3D6+6 PA (4 PE). À distance (longue max) : 2D6+6 PA (6 PE). Instantané. (p.144)',
        coutPE: '4 (contact) / 6 (distance)',
        activation: 'action-deplacement',
        duree: 'instantanée',
        effets: [],
        active: false,
      },
    ],
    ['RÈGLES: à compléter — évolutions 150/200/250 PG (nanoC 1 h, Mechanic +1D6+6, création de véhicules) — p.145'],
  ),

  // ─── BARBARIAN (p.167-170) : Goliath (mètres portés par Character) ────────
  barbarian: gabarit(
    'barbarian', 2,
    { pa: 60, pe: 60, cdf: 12, slots: [5, 8, 5, 5, 5, 5] },
    ['force', 'endurance', 'combat', 'hargne'],
    [
      {
        id: 'goliath',
        nom: 'Mode Goliath',
        description:
          'Grandit de 1 m par 2 PE (base 2 m, max 6 m ; 8 m à 150 PG, 10 m à 250 PG). Par mètre : +1 réussite aux jets ' +
          'Force/Endurance, +1D6 dégâts/violence au contact, +1 CdF. À 6 m+ : attaques anti-véhicule, armes rackées ' +
          'automatiquement. Défense −1/m et réaction −2/m (défense figée à 200 PG). Impossible d\u2019embarquer en véhicule. (p.168)',
        coutPE: '2/mètre',
        activation: 'action-deplacement',
        duree: '6 tours / 1 minute',
        effets: [], // effets par mètre appliqués via character.goliathMetres dans le moteur
        active: false,
      },
    ],
    [
      'Réaction −2 et défense −1 par mètre gagné en Goliath (min 0)',
      'À 6 m ou plus : toutes les armes rackent automatiquement',
      'Pas d\u2019embarquement en véhicule en mode Goliath (p.104)',
    ],
  ),

  // ─── Les 6 autres : profil chiffré complet, capacités en description ──────
  warrior: gabarit(
    'warrior', 1,
    { pa: 100, pe: 40, cdf: 8, slots: [7, 12, 10, 10, 7, 7] }, // PARTIE 6 p.135-138 PDF : Tête 7 · Bras 10/10 · Torse 12 · Jambes 7/7
    ['combat', 'deplacement', 'tir', 'dexterite'],
    [
      {
        id: 'types-warrior',
        nom: 'Types Warrior',
        description:
          '5 types (Soldier Chair · Hunter Bête · Scholar Machine · Herald Dame · Scout Masque) : 1 niveau d\u2019OD dans ' +
          'les 3 caractéristiques de l\u2019aspect, HORS limite de 5. Un seul actif ; activation 1 action de déplacement, ' +
          'jusqu\u2019au début du prochain tour. 1 PE/tour en conflit, 6 PE par scène hors conflit. (p.136)',
        coutPE: '1/tour (6/scène hors conflit)',
        activation: 'action-deplacement',
        duree: 'jusqu\u2019au début du prochain tour',
        effets: [],
        active: false,
      },
    ],
    ['Aucun handicap écrit (p.141)', 'Seule armure pouvant dépasser 5 niveaux d\u2019OD (p.130)'],
  ),

  warmaster: gabarit(
    'warmaster', 1,
    { pa: 90, pe: 50, cdf: 8, slots: [5, 8, 5, 5, 5, 5] },
    ['force', 'endurance', 'aura', 'sangfroid'],
    [
      {
        id: 'warlord',
        nom: 'Mode Warlord (impulsions)',
        description:
          'Impulsions à distance (lointaine, sans ligne de vue), 3 au choix à la création : Action 4 PE (+10 porteur), ' +
          'Esquive 3 PE/allié (+2/tour), Force (CdF+2) 2 PE/allié (+1/tour), Guerre (+1D6 dégâts) 1 PE/allié (+1/tour), ' +
          'Énergie (transfert 1-5 PE). Activation action de déplacement. (p.148)',
        coutPE: '1 à 10 selon impulsion',
        activation: 'action-deplacement',
        duree: 'prochain tour (maintenable)',
        effets: [],
        active: false,
      },
      {
        id: 'falcon',
        nom: 'Mode Falcon (analyseur)',
        description:
          'Révèle aspects / défense-réaction / armes / bouclier / capacités / points faibles d\u2019un PNJ, ou stats d\u2019une bande. ' +
          '6 PE, action de déplacement, instantané. (p.148)',
        coutPE: '6',
        activation: 'action-deplacement',
        duree: 'instantanée',
        effets: [],
        active: false,
      },
    ],
    ['Aucun handicap (p.147)', 'RÈGLES: à compléter — évolutions (Infinity +10 PE, toutes impulsions, Falcon 3 PE sans action)'],
  ),

  rogue: gabarit(
    'rogue', 2,
    { pa: 50, pe: 70, cdf: 12, slots: [5, 8, 5, 5, 5, 5] },
    ['deplacement', 'dexterite', 'discretion', 'combat'],
    [
      {
        id: 'ghost',
        nom: 'Mode Ghost',
        description:
          'Invisible et inaudible : +3 réussites auto aux jets pour passer inaperçu (déplacement/acrobatie/course, pas les ' +
          'attaques) ; jet base Discrétion opposé à Machine/2 contre un ennemi sur le qui-vive. Toute attaque désactive le mode ; ' +
          'la 1re attaque du tour qui brise l\u2019invisibilité gagne bonus en dés + bonus fixe aux dégâts = Discrétion (OD inclus). ' +
          'Pas de désactivation+réactivation dans le même tour. (p.152)',
        coutPE: '2 PE/tour (6 PE/minute hors conflit)',
        activation: 'aucune',
        duree: '1 tour ou 1 minute',
        effets: [],
        active: false,
      },
    ],
    ['Aucun handicap formalisé (limites du mode Ghost, p.151)'],
  ),

  ranger: gabarit(
    'ranger', 2,
    { pa: 50, pe: 70, cdf: 12, slots: [4, 6, 4, 4, 4, 4] }, // PARTIE 6 p.155-158 : Tête 4 · Torse 6 · Bras 4/4 · Jambes 4/4
    ['deplacement', 'dexterite', 'discretion', 'tir'],
    [
      {
        id: 'longbow',
        nom: 'Fusil Longbow modulable',
        description:
          'Profil de base 3D6 dégâts / 1D6 violence / portée moyenne · lourd, deux mains, assistance à l\u2019attaque. ' +
          'Le chevalier choisit dégâts/violence et jusqu\u2019à 3 effets par tir : 1 PE = +1D6 dégâts ou violence (max 6D6 ' +
          'générés) ou portée +1 · 2 PE = dégâts continus 3, silencieux, choc 1, perce armure 40, ultraviolence, désignation · ' +
          '3 PE = lumière 4, dispersion 3, artillerie, pénétrant 6, perce armure 60, anti-véhicule. (p.156)',
        coutPE: '1 à 3 PE par effet',
        activation: 'aucune',
        duree: '1 attaque',
        effets: [],
        active: false,
      },
      {
        id: 'vision',
        nom: 'Vision (voir l\u2019invisible)',
        description:
          'Voir gaz, vent, maladies, respiration, ondes radio, l\u2019Anathème, pensées… — et les créatures invisibles ' +
          '(mode Ghost inclus). Jet base Perception, difficulté faisable (2) à très difficile (9) au MJ. (p.157)',
        coutPE: '5 à 10 PE (au MJ)',
        activation: 'action-deplacement',
        duree: '6 secondes',
        effets: [],
        active: false,
      },
    ],
    ['RÈGLES: à compléter — évolutions PAYÉES en PG (exception, p.157)'],
  ),

  bard: gabarit(
    'bard', 2,
    { pa: 40, pe: 80, cdf: 12, slots: [5, 8, 5, 5, 5, 5] },
    ['aura', 'parole', 'sangfroid', 'perception'],
    [
      {
        id: 'changeling',
        nom: 'Mode Changeling',
        description:
          'L\u2019armure prend n\u2019importe quelle apparence ; jusqu\u2019à 3 m de rayon et 4 faux êtres de nanoM intangibles ' +
          '(max 3 m du chevalier, aucune action complexe). Percer : PNJ test Machine difficulté 6, PJ test Perception normale 3 — ' +
          'jamais automatique ; Ranger/Vision le détecte sans test. (p.160)',
        coutPE: '6 PE (transformation) · 8 PE (taille étendue) · 3 PE par faux être',
        activation: 'tour-complet',
        duree: 'une scène / phase / heure',
        effets: [],
        active: false,
      },
    ],
    ['Pas de rapetissement (p.159)', 'RÈGLES: à compléter — explosion de nanoM ignore armure/CdF à 250 PG'],
  ),

  wizard: gabarit(
    'wizard', 2,
    { pa: 40, pe: 80, cdf: 14, slots: [5, 8, 5, 5, 5, 5] },
    ['sangfroid', 'instinct', 'combat', 'aura'],
    [
      {
        id: 'borealis',
        nom: 'Mode Borealis (plasma)',
        description:
          'Bénédiction d\u2019armes (anti-Anathème, 6 PE +2/allié) · Attaque plasma 4D6/4D6 courte, anti-Anathème + dégâts ' +
          'continus 3 (2 PE/utilisation) · Utilitaire plasma (6 PE, 6 tours). (p.164)',
        coutPE: '2-6',
        activation: 'action-combat',
        duree: 'variable',
        effets: [],
        active: false,
      },
      {
        id: 'oriflamme',
        nom: 'Mode Oriflamme',
        description:
          'Zone de lumière portée courte : l\u2019Anathème subit 6D6+6 dégâts / 6D6+12 violence sans jet (moitié à moyenne ' +
          'autour). Ne touche que l\u2019Anathème. anti-Anathème, lumière 2. 12 PE, action de déplacement, instantané. (p.165)',
        coutPE: '12',
        activation: 'action-deplacement',
        duree: 'instantanée',
        effets: [],
        active: false,
      },
    ],
    ['Aucun handicap formalisé — fragilité structurelle : PA 40 (p.163)', 'RÈGLES: à compléter — évolutions (portées, −3 PE min 1)'],
  ),
};

/** Libellés lisibles pour le sélecteur */
export const NOMS_ARMURES: { id: string; nom: string; generation: string }[] = [
  { id: 'paladin', nom: 'Paladin', generation: '1re — artillerie/protecteur' },
  { id: 'warrior', nom: 'Warrior', generation: '1re — 5 types' },
  { id: 'warmaster', nom: 'Warmaster', generation: '1re — officier' },
  { id: 'priest', nom: 'Priest', generation: '1re — soutien nanoC' },
  { id: 'rogue', nom: 'Rogue', generation: '2e — assassin' },
  { id: 'ranger', nom: 'Ranger', generation: '2e — éclaireur' },
  { id: 'bard', nom: 'Bard', generation: '2e — infiltrateur' },
  { id: 'wizard', nom: 'Wizard', generation: '2e — anti-Anathème' },
  { id: 'barbarian', nom: 'Barbarian', generation: '2e — contact' },
];
