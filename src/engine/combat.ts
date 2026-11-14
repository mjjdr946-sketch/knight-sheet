/**
 * Styles de combat — règles pp.87-89.
 * Déclarés AVANT le jet d'initiative ; un seul à la fois ; changement de
 * style = 1 action de déplacement ; sans déclaration → style standard.
 * Les PNJ n'en utilisent jamais.
 */
import type { Modifier } from '../types/character';

export interface CombatStyle {
  id: string;
  nom: string;
  /** Armes requises (contact à deux mains, tir à deux mains, 2 armes…) */
  restriction?: string;
  bonus: string;
  malus: string;
  /** Modificateurs appliqués au personnage tant que le style est actif */
  effets: Modifier[];
}

export const STYLES_COMBAT: CombatStyle[] = [
  {
    id: 'standard',
    nom: 'Standard',
    bonus: '—',
    malus: '—',
    effets: [],
  },
  {
    id: 'agressif',
    nom: 'Agressif',
    bonus: '+3 dés aux jets d’attaque (contact et tir)',
    malus: '−2 à la réaction et à la défense (min. 0)',
    effets: [
      { source: 'Style agressif', target: 'defense', valeur: -2, type: 'malus' },
      { source: 'Style agressif', target: 'reaction', valeur: -2, type: 'malus' },
    ],
  },
  {
    id: 'defensif',
    nom: 'Défensif',
    bonus: '+2 en défense',
    malus: '−3 dés aux jets d’attaque',
    effets: [
      { source: 'Style défensif', target: 'defense', valeur: 2, type: 'bonus' },
    ],
  },
  {
    id: 'couvert',
    nom: 'Mise à couvert',
    restriction: 'abri dans la ligne de tir, décidé par le MJ',
    bonus: '+2 en réaction',
    malus: '−3 dés aux jets d’attaque',
    effets: [
      { source: 'Mise à couvert', target: 'reaction', valeur: 2, type: 'bonus' },
    ],
  },
  {
    id: 'ambidextre',
    nom: 'Ambidextre',
    restriction: '2 armes à une main',
    bonus: '2 attaques successives = 1 seule action de combat (1 test/attaque, 2 cibles)',
    malus: '−3 dés à toutes les attaques',
    // les malus d'attaque (dés) ne sont pas des modificateurs de stat — roleplay/MJ
    effets: [],
  },
  {
    id: 'akimbo',
    nom: 'Akimbo',
    restriction: '2 armes identiques à une main',
    bonus: 'Attaque double unique (1 jet) : dés de dégâts cumulés, bonus fixe compté 1 fois ; violence = dés d’une arme + moitié (inf.) de l’autre',
    malus: '−3 dés à toutes les attaques',
    effets: [],
  },
  {
    id: 'precis',
    nom: 'Précis',
    restriction: 'arme de contact à deux mains',
    bonus: '3ᵉ caractéristique au combo pour toucher (Dextérité, Savoir, Instinct ou Sang-Froid ; réussites auto de l’OD ignorées)',
    malus: 'Coûte action de combat + action de déplacement (deux mains et lourd : combat + 2 déplacements)',
    effets: [],
  },
  {
    id: 'pilonnage',
    nom: 'Pilonnage',
    restriction: 'arme de tir à deux mains',
    bonus: 'Même cible = +1 dé de dégâts/violence par tour précédé de tir (max +6 dés)',
    malus: '−2 dés à chaque attaque',
    effets: [],
  },
  {
    id: 'puissant',
    nom: 'Puissant',
    restriction: 'arme de contact avec effet lourd',
    bonus: 'Sacrifier jusqu’à 6 dés de toucher → autant de dés de dégâts/violence (par attaque, librement ajustable)',
    malus: '−2 à la réaction et à la défense (min. 0)',
    effets: [
      { source: 'Style puissant', target: 'defense', valeur: -2, type: 'malus' },
      { source: 'Style puissant', target: 'reaction', valeur: -2, type: 'malus' },
    ],
  },
  {
    id: 'suppression',
    nom: 'Suppression',
    restriction: 'arme de tir avec effet lourd',
    bonus: 'Sacrifier 2 dés de dégâts → −1 dé aux attaques de la cible au prochain tour (max −3) ; contre une bande : 2 dés de violence → −1 débordement (max −4)',
    malus: 'Malus non cumulables sur une même cible (max 3 dés / 4 points de débordement par tour)',
    effets: [],
  },
];

export function getStyle(id: string): CombatStyle {
  // Le style standard est toujours présent (tableau p.87)
  const trouve = STYLES_COMBAT.find((s) => s.id === id);
  if (trouve) return trouve;
  const standard = STYLES_COMBAT[0];
  if (!standard) throw new Error('Table des styles vide');
  return standard;
}

/** Id stable de la condition portant le style actif dans le store */
export const STYLE_CONDITION_ID = 'style-combat';

/** Transforme un style en condition (modificateurs portés par le moteur) */
export function styleVersCondition(style: CombatStyle) {
  return {
    id: STYLE_CONDITION_ID,
    nom: `Style : ${style.nom}`,
    categorie: 'autre' as const,
    description: `${style.bonus} — Malus : ${style.malus}`,
    effets: style.effets,
    permanente: false,
  };
}
