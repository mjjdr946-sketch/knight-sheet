/**
 * Modules de méta-armure — annexe 2 (pp.428+).
 * Itération 1 : sélection d'exemples cohérents avec la Paladin
 * (les modules interdits par « Lente et lourde » — course, déplacement
 * silencieux, saut — sont explicitement signalés).
 * Le catalogue complet (72 modules, 15 OD) est intégré progressivement.
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

/** Modules interdits à la Paladin (« Lente et lourde », p.140) — références pour le moteur */
export const MODULES_INTERDITS_PALADIN = ['course', 'deplacement-silencieux', 'saut'];

export const catalogueModules: ArmorModule[] = [
  fumigene,
  flash,
  blindageDrone,
  lameDeBras,
  relaisTaccom,
];
