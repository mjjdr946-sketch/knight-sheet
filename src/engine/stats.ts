/**
 * Moteur de calcul — statistiques dérivées.
 * Fonctions pures, aucune dépendance React. Chaque règle cite sa page du livre.
 * TOUT calcul passe ici ; l'UI et le store n'appliquent jamais de calcul eux-mêmes.
 */
import type {
  AspectId,
  Character,
  DerivedStats,
  Modifier,
  ModifierTarget,
  Overdrive,
  TraitId,
} from '../types/character';

// ─── Constantes de règles ────────────────────────────────────────────────────

/** PS de base (règle p.90/172 : 10 + 6 × meilleure Chair sans OD) */
export const PS_BASE = 10;
export const PS_FACTEUR = 6;

/** PEs total de départ (règle p.96/172) */
export const PES_BASE = 50;

/** Combinaison Guardian : 5 PA + CdF 5 quand l'armure est foldée (règle p.130) */
export const GUARDIAN_PA = 5;
export const GUARDIAN_CDF = 5;

/** Héroïsme : max 6 (règle p.96) */
export const HEROISME_MAX = 6;

/** Sous 10 PEs : −1 dé à tous les jets par point en dessous de 10 (règle p.96) */
export const SEUIL_DESESPOR = 10;

/** Champs modifiés uniquement "entre missions" (règle p.88/§5) : les totaux ne
 * fluctuent JAMAIS en partie ; les dégâts ne touchent que les scores actuels. */

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Overdrive d'une caractéristique, si l'armure est déployée (OD uniquement armure complète — p.130) */
export function overdriveNiveau(character: Character, trait: TraitId): number {
  if (!character.armureDeployee) return 0; // règle p.130 : OD uniquement méta-armure déployée
  return character.overdrives.find((od: Overdrive) => od.trait === trait)?.niveau ?? 0;
}

/**
 * Collecte les modificateurs actifs ciblant `target` :
 * cartes de tarot (avantages retenus), capacités d'armure actives, modules actifs,
 * conditions, évolutions débloquées (gloire >= seuil).
 */
export function collectModifiers(character: Character, target: ModifierTarget): Modifier[] {
  const mods: Modifier[] = [];

  // Cartes de tarot
  for (const carte of character.identite.cartes) {
    mods.push(...carte.effets.filter((m) => m.target === target));
  }

  // Évolutions de la méta-armure débloquées
  for (const evo of character.metaArmor.evolutions) {
    if (character.gloire >= evo.seuilPG) {
      mods.push(...evo.effets.filter((m) => m.target === target));
    }
  }

  // Capacités d'armure actives
  for (const cap of character.metaArmor.capacites) {
    if (cap.active) {
      mods.push(...cap.effets.filter((m) => m.target === target));
    }
  }

  // Modules actifs
  for (const mod of character.modules) {
    if (mod.etat === 'actif') {
      mods.push(...mod.effets.filter((m) => m.target === target));
    }
  }

  // Conditions (blessures, agonie…)
  for (const cond of character.conditions) {
    mods.push(...cond.effets.filter((m) => m.target === target));
  }

  return mods;
}

/**
 * Applique une liste de modificateurs à une valeur de base.
 * FAQ p.449/455 (CdF) : les bonus de type 'max' ne se cumulent PAS —
 * seul le plus gros s'applique (Shrine, CdF portatif…). Exception gérée à la
 * source : le blindage drone déclare ses valeurs en 'bonus' (cumul explicite).
 * L'ordre des opérations (règle p.89/§5) : diviser/multiplier d'abord (type
 * 'remplacement'), puis additionner/soustraire.
 */
export function appliquerModificateurs(base: number, mods: Modifier[]): number {
  let valeur = base;
  // 1) remplacements d'abord (ex. réaction ÷2 en Watchtower — FAQ p.455 : sur la valeur initiale)
  for (const m of mods) {
    if (m.type === 'remplacement') {
      // Convention validée : pour un diviseur, la valeur de remplacement est le diviseur
      // (valeur: 2 → base / 2). Un remplacement arithmétique direct serait valeur exacte.
      valeur = m.valeur === 2 ? Math.floor(valeur / 2) : m.valeur;
    }
  }
  // 2) bonus/malus additionnels
  for (const m of mods) {
    if (m.type === 'bonus') valeur += m.valeur;
    if (m.type === 'malus') valeur += m.valeur; // valeur négative attendue
  }
  // 3) bonus non-cumulables : le plus gros gagne (FAQ p.449)
  const maxes = mods.filter((m) => m.type === 'max').map((m) => m.valeur);
  if (maxes.length > 0) {
    valeur += Math.max(...maxes, 0);
  }
  return valeur;
}

// ─── Valeurs dérivées ────────────────────────────────────────────────────────

/**
 * PS total — règle p.90, p.172 : 10 + 6 × la caractéristique la plus haute
 * de l'aspect Chair, SANS overdrive (au choix du joueur, changeable entre missions).
 */
export function computePSMax(character: Character): number {
  const chairTraits: TraitId[] = ['deplacement', 'force', 'endurance'];
  const choix = character.choixDerivees.sante;
  let meilleure: number;
  if (choix && chairTraits.includes(choix)) {
    // Le choix du joueur est la caractéristique de calcul (règle p.88/172)
    meilleure = character.traits[choix];
  } else {
    meilleure = Math.max(...chairTraits.map((t) => character.traits[t]));
  }
  const base = PS_BASE + PS_FACTEUR * meilleure;
  const mods = collectModifiers(character, 'ps');
  // OD Endurance niv 3 (annexe) : +6 PS EN MÉTA-ARMURE (uniquement déployée)
  const endurance = character.overdrives.find((od) => od.trait === 'endurance');
  if (endurance && endurance.niveau >= 3 && character.armureDeployee) {
    mods.push({ source: 'OD Endurance niv 3', target: 'ps', valeur: 6, type: 'bonus' });
  }
  return appliquerModificateurs(base, mods);
}

/**
 * Défense — règle p.88, p.172 : une caractéristique de l'aspect Bête au choix
 * + 1 par niveau d'overdrive de cette caractéristique.
 * OD Aura niv 5 (annexe) : ajoute l'Aura à la défense.
 */
export function computeDefense(character: Character): number {
  const base = computeDerivedFromAspect(character, 'bete', 'defense', 'defense');
  const aura = character.overdrives.find((od) => od.trait === 'aura');
  if (aura && aura.niveau >= 5) {
    return appliquerModificateurs(base, [
      { source: 'OD Aura niv 5', target: 'defense', valeur: character.traits.aura, type: 'bonus' },
    ]);
  }
  return base;
}

/**
 * Réaction — règle p.88, p.172 : une caractéristique de l'aspect Machine au choix
 * + 1 par niveau d'overdrive. (Le mode Watchtower divise la valeur INITIALE par 2
 * — géré via Modifier 'remplacement' avec diviseur, FAQ p.455.)
 */
export function computeReaction(character: Character): number {
  return computeDerivedFromAspect(character, 'machine', 'reaction', 'reaction');
}

/**
 * Initiative — règle p.86, p.172 : une caractéristique de l'aspect Masque au
 * choix + 1 par niveau d'overdrive.
 * OD Instinct niv 3 (annexe) : +3 initiative par niveau d'OD d'Instinct.
 */
export function computeInitiative(character: Character): number {
  const base = computeDerivedFromAspect(character, 'masque', 'initiative', 'initiative');
  const instinct = character.overdrives.find((od) => od.trait === 'instinct');
  if (instinct && instinct.niveau >= 3) {
    return appliquerModificateurs(base, [
      { source: 'OD Instinct niv 3', target: 'initiative', valeur: 3 * instinct.niveau, type: 'bonus' },
    ]);
  }
  return base;
}

function computeDerivedFromAspect(
  character: Character,
  aspect: AspectId,
  cible: 'defense' | 'reaction' | 'initiative',
  choixKey: 'defense' | 'reaction' | 'initiative',
): number {
  const parAspect: Record<AspectId, TraitId[]> = {
    chair: ['deplacement', 'force', 'endurance'],
    bete: ['hargne', 'combat', 'instinct'],
    machine: ['tir', 'savoir', 'technique'],
    dame: ['aura', 'parole', 'sangfroid'],
    masque: ['discretion', 'dexterite', 'perception'],
  };
  const traits = parAspect[aspect];
  const choix = character.choixDerivees[choixKey];
  // Défaut : la plus haute caractéristique de l'aspect (comportement défensif, p.172)
  const defaut = traits.reduce((a, b) => (character.traits[b] > character.traits[a] ? b : a));
  const traitChoisi = choix && traits.includes(choix) ? choix : defaut;
  // p.172 lit "la plus haute caractéristique" ; p.88 lit "au choix" (validé avec l'utilisateur).
  // Si aucun choix explicite, on retient la plus haute (comportement défensif).
  const valeur = choix && traits.includes(choix) ? character.traits[traitChoisi] : Math.max(...traits.map((t) => character.traits[t]));
  const od = overdriveNiveau(character, traitChoisi);
  const base = valeur + od; // +1 par niveau d'OD (règle p.88)
  return appliquerModificateurs(base, collectModifiers(character, cible));
}

/**
 * PEs total — règle p.96, p.172 : 50 fixe, modifié par avantages/inconvénients.
 * Ne monte que via motivations majeures ou effets rares.
 */
export function computePESMax(character: Character): number {
  return appliquerModificateurs(PES_BASE, collectModifiers(character, 'pes'));
}

/**
 * PA max — p.130/138 : score de série de l'armure ; si foldée, combinaison
 * Guardian = 5 PA (règle p.130).
 */
export function computePAMax(character: Character): number {
  const base = character.armureDeployee ? character.metaArmor.paTotal : GUARDIAN_PA;
  return appliquerModificateurs(base, collectModifiers(character, 'pa'));
}

/** PE max — score propre au modèle (Paladin : 20, p.138) */
export function computePEMax(character: Character): number {
  const base = character.armureDeployee ? character.metaArmor.peTotal : 0;
  return appliquerModificateurs(base, collectModifiers(character, 'pe'));
}

/**
 * CdF effectif — p.130 + FAQ p.449/455 :
 * CdF propre (armure déployée = score de série ; foldée = Guardian CdF 5)
 * + le plus gros des bonus conférés ('max' — non cumulables)
 * + les bonus explicites cumulables ('bonus' — ex. blindage drone).
 */
export function computeCdF(character: Character): number {
  const base = character.armureDeployee ? character.metaArmor.cdfTotal : GUARDIAN_CDF;
  return appliquerModificateurs(base, collectModifiers(character, 'cdf'));
}

/**
 * Points de contact — règle p.95, p.172-173 : la plus haute caractéristique
 * de l'aspect Dame, SANS overdrive.
 */
export function computeContacts(character: Character): number {
  const dameTraits: TraitId[] = ['aura', 'parole', 'sangfroid'];
  return Math.max(...dameTraits.map((t) => character.traits[t]));
}

/**
 * Malus de désespoir — règle p.96 : sous 10 PEs, −1 dé à tous les jets
 * par point en dessous de 10 (peut réduire un jet à 0 dé).
 */
export function computeMalusDesespoir(currentPES: number): number {
  return currentPES < SEUIL_DESESPOR ? SEUIL_DESESPOR - currentPES : 0;
}

// ─── Aggregate ───────────────────────────────────────────────────────────────

/** Calcul complet des stats dérivées — LA fonction que le store appelle. */
export function computeDerived(character: Character): DerivedStats {
  const psMax = computePSMax(character);
  const paMax = computePAMax(character);
  const peMax = computePEMax(character);
  const pesMax = computePESMax(character);
  const cdf = computeCdF(character);

  return {
    ps: { current: Math.min(character.jauges.ps.current, psMax), max: psMax },
    pa: { current: Math.min(character.jauges.pa.current, paMax), max: paMax },
    pe: { current: Math.min(character.jauges.pe.current, peMax), max: peMax },
    cdf,
    pes: { current: Math.min(character.jauges.pes.current, pesMax), max: pesMax },
    defense: Math.max(0, computeDefense(character) - (character.goliathMetres ?? 0)), // Goliath p.168 : −1 défense/m (figée à évolution 200 — RÈGLES: à compléter)
    reaction: Math.max(0, computeReaction(character) - (character.goliathMetres ?? 0) * 2), // Goliath p.168 : −2 réaction/m
    initiative: computeInitiative(character),
    contacts: computeContacts(character),
    malusDesespoir: computeMalusDesespoir(character.jauges.pes.current),
    etatAgonie: character.jauges.ps.current <= 0, // règle p.90 : à 0 PS, agonie
    cdfGoliath: (character.goliathMetres ?? 0), // Goliath p.168 : +1 CdF par mètre (utilisé par le simulateur)
  };
}
