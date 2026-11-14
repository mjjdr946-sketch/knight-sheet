/**
 * Tableau des blessures aléatoires — règle p.91.
 * Tirage : 1D6 (colonne) + 1D6 (ligne).
 * Effets persistants jusqu'à implant cybernétique ou thérapie de
 * reconstruction corporelle ; caractéristique jamais sous 0 (p.91).
 *
 * TRANCHAGE v4 §0.3 : le tableau est codé TEL QUEL du digest ; les lignes
 * douteuses sont marquées `// TODO-RULES: vérifier p.91` — NunnuN tranchera
 * avec le livre papier.
 *
 * Colonnes du tableau p.91 : 1 | 2-3 | 4-5 | 6
 */
import type { Condition, Modifier, TraitId } from '../types/character';

/** Liste à plat des 15 caractéristiques (déclaré avant usage) */
const ASPECT_TRAITS_FLAT: TraitId[] = [
  'deplacement', 'force', 'endurance',
  'hargne', 'combat', 'instinct',
  'tir', 'savoir', 'technique',
  'aura', 'parole', 'sangfroid',
  'discretion', 'dexterite', 'perception',
];

export interface BlessureDef {
  /** Nom lisible de la blessure */
  nom: string;
  /** Malus traduits en Modifier (aspects = −1 à ses 3 caractéristiques) */
  effets: Modifier[];
  /** true = effet létal spécial (mort / hémorragie) — traitement dédié */
  mort?: 'immediate' | 'hemorragie';
  /** description textuelle du livre */
  description: string;
}

/** Malus aspect = −1 aux 3 caractéristiques de l'aspect */
function malusAspect(aspect: 'machine' | 'dame' | 'masque' | 'chair' | 'bete', n: number): Modifier[] {
  const parAspect: Record<string, string[]> = {
    machine: ['tir', 'savoir', 'technique'],
    dame: ['aura', 'parole', 'sangfroid'],
    masque: ['discretion', 'dexterite', 'perception'],
    chair: ['deplacement', 'force', 'endurance'],
    bete: ['hargne', 'combat', 'instinct'],
  };
  return (parAspect[aspect] ?? []).map((trait) => ({
    source: 'Blessure',
    target: `trait:${trait}` as Modifier['target'],
    valeur: -n,
    type: 'malus' as const,
  }));
}

/** Malus sur caractéristiques nommées */
function malusTraits(traits: TraitId[], n: number, source = 'Blessure'): Modifier[] {
  return traits.map((trait) => ({
    source,
    target: `trait:${trait}` as Modifier['target'],
    valeur: -n,
    type: 'malus' as const,
  }));
}

/** Tableau p.91 — index [ligne 1-6][colonne 0=1, 1=2-3, 2=4-5, 3=6] */
export const TABLEAU_BLESSURES: BlessureDef[][] = [
  // ─── Ligne 1 ───
  [
    { nom: 'Mort', effets: [], mort: 'immediate', description: 'Mort' }, // TODO-RULES: vérifier p.91 — « Mort » sur un tirage possible (1D6+1D6 = 2) surprenant ; le digest le code tel quel
    { nom: 'Crâne brisé', effets: [...malusAspect('machine', 1), ...malusAspect('dame', 1), ...malusAspect('masque', 1)], description: '−1 à toutes les caractéristiques Machine, Dame et Masque' },
    { nom: 'Colonne vertébrale brisée', effets: [], description: 'Usage des jambes perdu' },
    { nom: 'Bras mutilé', effets: [], description: 'Plus d’arme lourde/à deux mains, difficultés accrues' },
  ],
  // ─── Ligne 2 ───
  [
    { nom: 'Organes internes touchés', effets: malusTraits(Object.values(ASPECT_TRAITS_FLAT), 1), description: '−1 à toutes les caractéristiques' },
    { nom: 'Yeux détruits', effets: [], description: 'Cécité, difficultés accrues' },
    { nom: 'Mâchoire, langue, dents détruites', effets: malusAspect('dame', 3), description: '−3 à l’aspect Dame, plus de parole' },
    { nom: 'Jambe mutilée', effets: [], description: 'Plus de marche/course/saut' },
  ],
  // ─── Ligne 3 ───
  [
    { nom: 'Cerveau touché', effets: [...malusAspect('bete', 1), ...malusAspect('machine', 1), ...malusAspect('dame', 1), ...malusAspect('masque', 1)], description: '−1 aux aspects Bête, Machine, Dame, Masque + perte d’une action au choix par tour' },
    { nom: 'Dos brisé', effets: malusTraits(['deplacement', 'force', 'endurance', 'hargne', 'combat', 'instinct'], 1), description: '−1 à toutes les caractéristiques Chair et Bête' },
    { nom: 'Pied brisé', effets: malusTraits(['combat', 'deplacement', 'discretion', 'force'], 1), description: '−1 en Combat, Déplacement, Discrétion, Force' },
    { nom: 'Traumatisme crânien', effets: malusTraits(['savoir', 'technique', 'instinct'], 1), description: '−1 en Savoir, Technique, Instinct' },
  ],
  // ─── Ligne 4 ───
  [
    { nom: 'Colonne vertébrale touchée', effets: [...malusAspect('chair', 2), ...malusAspect('bete', 2), ...malusAspect('masque', 2)], description: '−2 aux aspects Chair, Bête, Masque' },
    { nom: 'Main brisée', effets: malusTraits(['combat', 'technique', 'tir', 'dexterite'], 1), description: '−1 en Combat, Technique, Tir, Dextérité' },
    { nom: 'Dos touché', effets: malusTraits(['force', 'deplacement'], 1), description: '−1 en Force et Déplacement' },
    { nom: 'Borgne', effets: malusTraits(['tir', 'perception'], 1), description: '−1 en Tir et Perception' },
  ],
  // ─── Ligne 5 ───
  [
    { nom: 'Hémorragie interne', effets: [], mort: 'hemorragie', description: 'Mort sans +1 PS dans la minute' },
    { nom: 'Oreille éclatée', effets: malusTraits(['perception', 'deplacement', 'instinct'], 1), description: '−1 en Perception, Déplacement, Instinct' },
    { nom: 'Tempe touchée', effets: malusTraits(['hargne', 'sangfroid'], 1), description: '−1 en Hargne et Sang-Froid' },
    { nom: 'Blessure mineure', effets: [], description: 'Malus MJ (rien de grave)' },
  ],
  // ─── Ligne 6 ───
  [
    { nom: 'Poumons perforés', effets: malusTraits(['endurance', 'deplacement'], 2), description: '−2 en Endurance et Déplacement' },
    { nom: 'Côtes brisées', effets: malusTraits(['endurance', 'combat'], 1), description: '−1 en Endurance et Combat' },
    { nom: 'Blessure mineure', effets: [], description: 'Malus MJ (rien de grave)' },
    { nom: 'Rien, juste l’agonie', effets: [], description: 'Rien ! juste l’agonie' }, // TODO-RULES: vérifier p.91 — cohérence avec la ligne 1 « Mort »
  ],
];

/**
 * Tire une blessure : ligne = 1D6, colonne = 1D6 (1 → col.1, 2-3 → col.2-3,
 * 4-5 → col.4-5, 6 → col.6). Le dé est fourni par l'appelant (le moteur reste
 * déterministe et testable).
 */
export function tirerBlessure(deLigne: number, deColonne: number): BlessureDef {
  const ligne = Math.min(6, Math.max(1, deLigne));
  const colonne = deColonne <= 1 ? 0 : deColonne <= 3 ? 1 : deColonne <= 5 ? 2 : 3;
  const entree = TABLEAU_BLESSURES[ligne - 1]?.[colonne];
  if (!entree) throw new Error(`Blessure introuvable : ${deLigne}D${deColonne}`);
  return entree;
}

/** Transforme une blessure tirée en `Condition` prête pour le store */
export function blessureVersCondition(b: BlessureDef, id: string): Condition {
  return {
    id,
    nom: b.nom,
    categorie: 'blessure',
    description: b.description + ' (tableau p.91)',
    effets: b.effets,
    permanente: true, // retrait uniquement par implant/thérapie (p.91)
  };
}
