/**
 * Modèle de données — feuille de personnage Knight
 * Conçu générique (toutes les classes à terme) ; itération 1 : Paladin.
 * Identifiants en anglais, commentaires en français.
 *
 * Principe pivot : tout effet qui modifie une stat passe par `Modifier`.
 * C'est lui qui rend l'app multi-classes sans réécriture du moteur.
 */

// ─── Identifiants ────────────────────────────────────────────────────────────

/** Classes jouables — union extensible (itération 1 : paladin uniquement) */
export type ClassId = 'paladin';

/** Les 5 aspects du personnage */
export type AspectId = 'chair' | 'bete' | 'machine' | 'dame' | 'masque';

/** Les 15 caractéristiques (3 par aspect) */
export type TraitId =
  // Chair
  | 'deplacement' | 'force' | 'endurance'
  // Bête
  | 'hargne' | 'combat' | 'instinct'
  // Machine
  | 'tir' | 'savoir' | 'technique'
  // Dame
  | 'aura' | 'parole' | 'sangfroid'
  // Masque
  | 'discretion' | 'dexterite' | 'perception';

/** Zones de slots de la méta-armure */
export type SlotZone = 'tete' | 'torse' | 'brasGauche' | 'brasDroit' | 'jambeGauche' | 'jambeDroite';

/** Le joueur choisit quelle caractéristique alimente chaque valeur dérivée (règle p.88 : "au choix") */
export type DerivedChoice = 'defense' | 'reaction' | 'initiative' | 'sante';

// ─── Jauges ──────────────────────────────────────────────────────────────────

/** Jauge générique — le max est TOUJOURS calculé par le moteur, jamais saisi */
export interface Gauge {
  current: number;
}

// ─── Modificateurs ───────────────────────────────────────────────────────────

/** Cible d'un modificateur — étendu au fil des règles */
export type ModifierTarget =
  | 'ps'          // points de santé (total)
  | 'pes'         // points d'espoir (total)
  | 'pa'          // points d'armure
  | 'pe'          // points d'énergie
  | 'cdf'         // champ de force
  | 'defense'
  | 'reaction'
  | 'initiative'
  | `trait:${TraitId}`
  | `aspect:${AspectId}`;

export interface Modifier {
  /** Source lisible (nom du module, blessure, avantage…) */
  source: string;
  target: ModifierTarget;
  /** Valeur signée ; pour `remplacement`, la valeur de remplacement */
  valeur: number;
  /**
   * - `bonus` / `malus` : additionnés
   * - `remplacement` : remplace la valeur de base (ex. réaction ÷2 en Watchtower)
   * - `max` : CdF non-cumulable (FAQ p.449) — seul le plus gros bonus s'applique
   */
  type: 'bonus' | 'malus' | 'remplacement' | 'max';
}

// ─── Armes ───────────────────────────────────────────────────────────────────

export type WeaponType = 'contact' | 'distance';

/** Profil de dégâts : ex. 3D6+Force → { nombre: 3, faces: 6, bonus: 'force' } */
export interface DamageProfile {
  nombre: number;
  faces: 6;
  /** Bonus fixe : nombre, ou clé spéciale ('force', 'dexterite', 'tir', 'force×2'…) */
  bonus: number | string;
  /** Moyenne basse du livre, utilisable au lieu du jet (règle p.89) */
  moyenne?: number;
}

export interface Weapon {
  id: string;
  nom: string;
  type: WeaponType;
  /** Accessibilité arsenal : standard (0 PG), avancé (100 PG cumulés), rare (300 PG) */
  accessibilite: 'standard' | 'avance' | 'rare';
  /** Coût en points de gloire */
  coutPG: number;
  degats: DamageProfile;
  violence: DamageProfile;
  /** 'contact' | 'courte' | 'moyenne' | 'longue' | 'lointaine' */
  portee: 'contact' | 'courte' | 'moyenne' | 'longue' | 'lointaine';
  /** Coût en PE par usage ('1/action', '1/tir', '1/tour'…) ; undefined = gratuit */
  coutPE?: string;
  /** Effets du glossaire arsenal (annexe 2, p.414+) : 'perce armure 40', 'choc 1'… */
  effets: string[];
  /** Munitions/modes alternatifs du même arcane d'arme */
  modes?: WeaponMode[];
  /** Améliorations d'armes à distance appliquées (max 1/2/3 selon l'arme) */
  ameliorations?: WeaponUpgrade[];
  equipee: boolean;
  /** Arme rackée (module rack : 5 armes max, ceinture) */
  rackee?: boolean;
  /** Arme slotée dans un bras de Paladin (évolution 150 PG, considérée "en main") */
  slotee?: 'brasGauche' | 'brasDroit';
}

/** Munition/mode alternatif d'une même arme (ex. marteau-épieu : contact / chevrotine) */
export interface WeaponMode {
  nom: string;
  degats: DamageProfile;
  violence: DamageProfile;
  portee: Weapon['portee'];
  effets: string[];
}

/** Amélioration d'arme à distance (annexe arsenal) */
export interface WeaponUpgrade {
  id: string;
  nom: string;
  coutPG: number;
  effets: string[];
}

// ─── Méta-armure ─────────────────────────────────────────────────────────────

export interface MetaArmor {
  modele: string; // 'paladin'
  generation: 1 | 2 | 3;
  /** Slots par zone (Paladin : tête 7, torse 10, bras 7/7, jambes 7/7) */
  slots: Record<SlotZone, number>;
  /** Scores de série */
  paTotal: number;
  peTotal: number;
  cdfTotal: number;
  /** Overdrives de base fournis par l'armure (Paladin : 4 OD de base) */
  overdrivesDeBase: Overdrive[];
  /** Capacités d'armure (Shrine, Watchtower…) */
  capacites: ArmorCapacity[];
  /** Handicap (Paladin : "Lente et lourde" p.140) */
  handicaps: string[];
  /** Évolutions par PG accumulés (150/200/250 pour Paladin) */
  evolutions: Evolution[];
}

export interface ArmorCapacity {
  id: string;
  nom: string;
  description: string;
  coutPE: string;
  /** 'aucune' | 'action-deplacement' | 'action-combat' | 'tour-complet' */
  activation: 'aucune' | 'action-deplacement' | 'action-combat' | 'tour-complet';
  duree: string;
  /** Modificateurs produits quand la capacité est active */
  effets: Modifier[];
  /** État activé/désactivé géré par le store */
  active: boolean;
}

export interface Evolution {
  seuilPG: number;
  description: string;
  /** Effets débloqués une fois l'évolution acquise (appliqués si pgAccumules >= seuilPG) */
  effets: Modifier[];
}

// ─── Modules ─────────────────────────────────────────────────────────────────

export type ModuleCategory =
  | 'deplacement' | 'contact' | 'distance' | 'visee' | 'defense'
  | 'tactique' | 'utilitaire' | 'amelioration' | 'automatise' | 'overdrive';

export type ModuleState = 'actif' | 'inactif' | 'endommage';

export interface ArmorModule {
  id: string;
  nom: string;
  categorie: ModuleCategory;
  accessibilite: 'standard' | 'avance' | 'rare';
  coutPG: number;
  /** Occupation par zone : ex. { jambeGauche: 1, jambeDroite: 1 } */
  slots: Partial<Record<SlotZone, number>>;
  /** 'aucune' | 'action-deplacement' | 'action-combat' | 'tour-complet' | 'aucune-1x-par-tour' */
  activation: string;
  duree: string;
  coutPE?: string;
  /** Niveau acheté (1→3, niveaux précédents requis) */
  niveau?: number;
  description: string;
  effets: Modifier[];
  etat: ModuleState;
}

/** Overdrive : 0 slot, +1 réussite auto par niveau, max 5 (sauf Warrior) */
export interface Overdrive {
  trait: TraitId;
  niveau: number; // 1..5
}

// ─── Identité ────────────────────────────────────────────────────────────────

export interface TarotCard {
  numero: string; // 'I' … 'XXI', 'Fou'
  nom: string;
  aspect: AspectId | null;
  /** Avantages retenus (le PJ garde 2 avantages parmi 5) */
  avantagesRetenus: string[];
  /** Inconvénient retenu (le PJ garde 1 parmi 5) */
  inconvénientRetenu?: string;
  /** Modificateurs produits par les avantages retenus */
  effets: Modifier[];
}

export interface HautFait {
  nom: string;
  surnom: string;
}

export interface Motivation {
  type: 'majeure' | 'mineure';
  texte: string;
}

// ─── Conditions (blessures, agonie…) ────────────────────────────────────────

export interface Condition {
  id: string;
  nom: string;
  /** 'blessure' | 'agonie' | 'desespoir' | 'autre' */
  categorie: 'blessure' | 'agonie' | 'desespoir' | 'autre';
  description: string;
  effets: Modifier[];
  /** Les blessures du tableau p.91 ne se retirent que par implant/thérapie */
  permanente: boolean;
}

// ─── Personnage ──────────────────────────────────────────────────────────────

export interface Character {
  id: string;
  nom: string;
  classe: ClassId;
  concept: string;
  niveau: string; // Knight n'a pas de niveaux chiffrés : rang ('écuyer'…)
  /** 5 aspects */
  aspects: Record<AspectId, number>;
  /** 15 caractéristiques */
  traits: Record<TraitId, number>;
  /** Overdrives actifs (méta-armure complète requise) */
  overdrives: Overdrive[];
  /** Choix du joueur pour chaque valeur dérivée (règle p.88 "au choix") */
  choixDerivees: Partial<Record<DerivedChoice, TraitId>>;
  metaArmor: MetaArmor;
  armes: Weapon[];
  modules: ArmorModule[];
  identite: {
    cartes: TarotCard[];
    hautFait: HautFait;
    blason: string;
    serment?: string;
    motivations: Motivation[];
  };
  /** Jauges — score actuel uniquement ; le max vient du moteur */
  jauges: {
    ps: Gauge;
    pa: Gauge;
    pe: Gauge;
    cdf: Gauge;
    pes: Gauge;
    heroisme: Gauge;
  };
  /** État : armure déployée ou foldée (Guardian 5 PA / CdF 5) */
  armureDeployee: boolean;
  /** Compteur de coups reçus alors qu'à 0 PS (règle p.90 : 3e = mort) */
  agonieCoups?: number;
  /** PG et PX cumulés (totaux, ne bougent qu'entre missions) */
  gloire: number;
  experience: number;
  conditions: Condition[];
}

/** Statistiques calculées par le moteur — jamais par l'UI */
export interface DerivedStats {
  ps: { current: number; max: number };
  pa: { current: number; max: number };
  pe: { current: number; max: number };
  cdf: number;
  pes: { current: number; max: number };
  defense: number;
  reaction: number;
  initiative: number;
  /** Points de contact (max Dame, sans OD) */
  contacts: number;
  /** Malus de dés si sous 10 PEs (règle p.96) */
  malusDesespoir: number;
  /** PS perdus par tranche de 5 PA encaissés — recalculé au moment des dégâts */
  etatAgonie: boolean;
}
