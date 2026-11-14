/**
 * Améliorations d'armes à distance — annexe 2 du livre (digest PARTIE 4, lignes 779-800).
 * 18 améliorations, PG 10 à 30 + jumelage SPÉ (10 PG par arme, acheté par couple).
 * Limites par arme : 1 (à une main), 2 (deux mains), 3 (lourd) ; activées par défaut,
 * activation/désactivation en conflit = 1 action de déplacement.
 */
import type { WeaponUpgrade } from '../types/character';

export const catalogueAmeliorationsArmes: WeaponUpgrade[] = [
  {
    id: 'chargeur-balles-grappes',
    nom: 'Chargeur et balles grappes',
    coutPG: 10,
    effets: ['Violence +1D6', 'Dégâts −1D6', 'Restriction : pas sur lance-flammes, laser, arbalète, lance-grenade'],
  },
  {
    id: 'chargeur-munitions-explosives',
    nom: 'Chargeur et munitions explosives',
    coutPG: 10,
    effets: ['Dégâts +1D6', 'Violence −1D6', 'Restriction : pas sur lance-flammes, laser, arbalète, lance-grenade'],
  },
  {
    id: 'pointeur-laser',
    nom: 'Pointeur laser',
    coutPG: 10,
    effets: ['Bonus de 3 dés au test du tireur à portée courte ou moyenne', 'Restriction : pas sur lance-flammes'],
  },
  {
    id: 'lunette-intelligente',
    nom: 'Lunette intelligente',
    coutPG: 10,
    effets: [
      'Portée +1 niveau sans malus (armes à deux mains)',
      'Restriction : arme à deux mains ou lourd, sauf lance-flammes',
    ],
  },
  {
    id: 'canon-raccourci',
    nom: 'Canon raccourci',
    coutPG: 10,
    effets: [
      'Dispersion 3 à portée courte ou inférieure',
      'À portée moyenne+ : difficulté des tirs +3 (réaction ennemie +3)',
    ],
  },
  {
    id: 'munitions-non-letales',
    nom: 'Munitions non létales',
    coutPG: 10,
    effets: ['Les tirs ne peuvent pas tuer', 'Restriction : pas sur lance-flammes, laser, arbalète, lance-grenade'],
  },
  {
    id: 'canon-long',
    nom: 'Canon long',
    coutPG: 10,
    effets: [
      '1 réussite automatique à portée moyenne+',
      'À portée courte− : difficulté +3',
    ],
  },
  {
    id: 'munitions-iem',
    nom: 'Munitions IEM',
    coutPG: 15,
    effets: ['Parasitage 2', 'Dégâts −1D6', 'Violence −1D6', 'Restriction : pas sur lance-flammes, laser, arbalète, lance-grenade'],
  },
  {
    id: 'interface-de-guidage',
    nom: 'Interface de guidage',
    coutPG: 15,
    effets: ['Tir en sécurité', 'Restriction : armes tirant balles, grenades, missiles ou roquettes'],
  },
  {
    id: 'jumelage',
    nom: 'Jumelage (SPÉ)',
    coutPG: 10,
    effets: [
      'Jumelé (akimbo) si armes identiques, jumelé (ambidextrie) sinon',
      'Restriction : pas sur armes lourd ou deux mains',
      'Restriction : 1 emplacement d\u2019amélioration par arme, acheté par couple (10 PG par arme)',
    ],
  },
  {
    id: 'munitions-subsoniques',
    nom: 'Munitions subsoniques',
    coutPG: 20,
    effets: ['Silencieux', 'Restriction : pas sur lance-flammes, laser, lance-grenade'],
  },
  {
    id: 'protection-arme',
    nom: 'Protection d\u2019arme',
    coutPG: 20,
    effets: ['Réaction du tireur +2', 'Restriction : arme à deux mains ou lourd'],
  },
  {
    id: 'structure-alpha',
    nom: 'Structure alpha',
    coutPG: 20,
    effets: ['Arme indestructible (incassable, inbrûlable, etc.)'],
  },
  {
    id: 'revetement-omega',
    nom: 'Revêtement omega',
    coutPG: 20,
    effets: ['Assassin 2', 'Restriction : armes avec l\u2019effet silencieux uniquement'],
  },
  {
    id: 'chambre-double',
    nom: 'Chambre double',
    coutPG: 30,
    effets: [
      'Cadence 2',
      'Occupe 2 emplacements d\u2019amélioration',
      'Restriction : armes lourd/deux mains à balles ou fléchettes',
    ],
  },
  {
    id: 'systeme-refroidissement',
    nom: 'Système de refroidissement',
    coutPG: 30,
    effets: [
      'Tir en rafale',
      'Barrage 1',
      'Une arme légère gagne deux mains, une arme à deux mains gagne lourd',
      'Restriction : armes à balles/fléchettes, lasers, armes soniques ; pas sur armes lourdes',
    ],
  },
  {
    id: 'munitions-hyper-velocite',
    nom: 'Munitions hyper vélocité',
    coutPG: 30,
    effets: [
      "Assistance à l'attaque",
      'Une arme légère gagne deux mains, une arme à deux mains gagne lourd',
      'Restriction : pas sur armes lourdes ni lasers',
    ],
  },
  {
    id: 'munitions-drones',
    nom: 'Munitions drones',
    coutPG: 30,
    effets: ['+3 réussites automatiques au tir', 'Restriction : pas sur lance-flammes ni laser'],
  },
];
