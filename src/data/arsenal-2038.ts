/**
 * Arsenal 2038 (PARTIE 7 du digest — pages 34-36 + reliques).
 * Armes de prestige (Table Ronde à 500 PG ou 700 PG) + reliques d'espoir.
 * Pages du supplément citées par arme.
 */
import type { Weapon } from '../types/character';

/** helper : profil d'arme de prestige (accessibilite optionnelle — défaut 'rare') */
function prestige(id: string, nom: string, type: Weapon['type'], pg: number, d: { nombre: number; bonus: number | string }, v: { nombre: number; bonus: number | string }, portee: Weapon['portee'], effets: string[], accessibilite: Weapon['accessibilite'] = 'rare'): Weapon {
  return {
    id, nom, type, accessibilite, coutPG: pg, equipee: false,
    degats: { nombre: d.nombre, faces: 6, bonus: d.bonus },
    violence: { nombre: v.nombre, faces: 6, bonus: v.bonus },
    portee, effets, modes: [],
  };
}

export const ARMES_PRESTIGE: Weapon[] = [
  prestige('chaine-epee-wyvern', 'Chaîne-épée Wyvern', 'contact', 150, { nombre: 9, bonus: 0 }, { nombre: 9, bonus: 0 }, 'courte',
    ['défense 2', 'orfèvrerie', 'ignore armure', 'dispersion 3', 'artillerie', 'fureur']), // Spécial : frappe jusqu'à portée courte bien que de contact (2038 p.34)
  prestige('marteau-typhon', 'Marteau cinétique Typhon', 'contact', 150, { nombre: 12, bonus: 0 }, { nombre: 6, bonus: 6 }, 'contact',
    ['lesté', 'ignore CdF', 'anti-véhicule', 'deux mains', 'lourd']), // Spécial : 5 PE → dispersion 6 (2038 p.34)
  prestige('pulseur-alpha', 'Pulseur alpha', 'distance', 120, { nombre: 4, bonus: 10 }, { nombre: 12, bonus: 10 }, 'longue',
    ['assistance à l\'attaque', 'meurtrier', 'oblitération', 'ignore armure', 'démoralisant', 'fureur', 'dispersion 6', 'deux mains']),
  prestige('griffes-fenrir', 'Griffes de Fenrir', 'contact', 120, { nombre: 8, bonus: 0 }, { nombre: 8, bonus: 6 }, 'moyenne',
    ['défense 4', 'réaction 4', 'ignore CdF', 'dispersion 6', 'deux mains']), // Spécial : frappe à portée moyenne ; bonus Perception à la place de Force
  prestige('gantelet-chimere', 'Gantelet Chimère', 'contact', 150, { nombre: 8, bonus: 0 }, { nombre: 6, bonus: 0 }, 'contact',
    ['métamorphose (1 PE, sans action) — équivalents arsenal, effets deux mains/lourd ignorés (2038 p.35)']),
  prestige('canon-nova', 'Canon Nova', 'distance', 120, { nombre: 10, bonus: 6 }, { nombre: 10, bonus: 6 }, 'moyenne',
    ['lumière 6', 'anti-Anathème', 'ténébricide', 'barrage 4', 'deux mains']), // Spécial : réserve de 18 dés répartissables (max 15D6/jet), uniquement contre l'Anathème (2038 p.35)
  prestige('seth', 'Seth, canon intelligent', 'distance', 150, { nombre: 12, bonus: 0 }, { nombre: 2, bonus: 0 }, 'lointaine',
    ['anti-véhicule', 'assistance à l\'attaque', 'artillerie', 'désignation', 'dispersion 3', 'précision', 'ultraviolence', 'deux mains', 'lourd']),
];

/**
 * Nouvel arsenal standard 2038 (PARTIE 7 D, pp.23-26) — 5 armes de série
 * accessibles sans la Table Ronde (accessibilite 'avance', canon UV 'rare').
 */
export const NOUVEL_ARSENAL_2038: Weapon[] = [
  prestige('fusil-sonique-2038', 'Fusil sonique', 'distance', 30, { nombre: 4, bonus: 0 }, { nombre: 4, bonus: 0 }, 'courte',
    ['oblitération', 'choc 1', 'dispersion 3', 'deux mains'], 'avance'), // moyenne dégâts 12 / violence 12
  prestige('lance-lumiere-2038', 'Lance de lumière', 'contact', 0, { nombre: 8, bonus: 'force+dexterite' }, { nombre: 4, bonus: 0 }, 'contact',
    ['lumière 6', 'anti-Anathème', 'ténébricide', 'orfèvrerie', 'deux mains'], 'avance'), // orfèvrerie : dégâts + Force + Dextérité
  prestige('canon-uv-2038', 'Canon UV', 'distance', 80, { nombre: 10, bonus: 10 }, { nombre: 6, bonus: 0 }, 'moyenne',
    ['lumière 6', 'anti-Anathème', 'ténébricide', 'deux mains', 'lourd'], 'rare'),
  prestige('ceste-concussion-2038', 'Ceste à concussion', 'contact', 40, { nombre: 6, bonus: 'force' }, { nombre: 3, bonus: 0 }, 'contact',
    ['oblitération', 'choc 1'], 'avance'),
  prestige('fusil-uv-2038', 'Fusil UV', 'distance', 40, { nombre: 6, bonus: 5 }, { nombre: 4, bonus: 0 }, 'courte',
    ['lumière 2', 'anti-Anathème', 'ténébricide', 'deux mains'], 'avance'),
];

/** Effets exclusifs 2038 (glossaire complémentaire, PARTIE 7 C p.23). */
export const EFFETS_2038 = {
  tenebricide: 'Ténébricide : contre l’Anathème, dégâts ET violence doublés (les dés déjà multipliés par 2 pour 1D6 du livre comptent multipliés une fois)',
  esperance: 'Espérance : au lieu de subir les pertes d’espoir (test d’espoir ou capacité), subissent des dégâts égaux aux points d’espoir perdus',
  obliteration: 'Oblitération : si les dégâts retirent au moins la moitié des PA actuels de la cible, la moitié du reste de ses PS est retirée (règle des tranches de 10 non appliquée)',
};

/** Reliques d’espoir (2038 p.35) — achat réservé aux chevaliers ≥ 300 PG, un exemplaire chacune. */
export const RELIQUES_ESPOIR: { id: string; nom: string; description: string; effets: string[]; special?: string }[] = [
  { id: 'joyeuse', nom: '« La Joyeuse »', description: 'Épée du sacre de Charlemagne (contact) — 6D6+Force / 4D6', effets: ['lumière 4', 'anti-Anathème', 'ténébricide', 'espérance'], special: 'Tant qu’elle est en main : toutes les pertes d’espoir réduites de 1 (cumulable)' },
  { id: 'tonbogiri', nom: '« Tonbogiri »', description: 'Lance japonaise (contact) — 8D6+Force / 2D6', effets: ['lumière 2', 'anti-Anathème', 'ténébricide', 'ignore armure', 'espérance'] },
  { id: 'oriflamme', nom: '« Oriflamme de Saint-Denis »', description: 'Bannière (100 PG, une main) — pas une arme', effets: ['espérance pour le porteur ET ses alliés', 'l’Anathème subit automatiquement lumière 6 chaque tour'], special: 'Indestructible par l’Anathème' },
];

/**
 * Règles 2038 descriptives (PARTIE 7 — non modélisées en data, références pour le moteur) :
 * - Avalon (fiche de gestion, 2038 pp.39-42 + 114) : PCo 1-4/mission, restrictions avant
 *   développement, 11 extensions — Armurerie 3, Laboratoire 3, Tour de renseignements 4,
 *   Baie de déploiement 4, Méta-atelier 5, Infirmerie 5, Galerie des héros 5, Arsenal 6,
 *   Centre R&D 6, Forge 10 (coûts en PCo).
 * - Table Ronde à 500 PG (2038 p.26) + options : dotation 50-100 PG, PG×2/PX÷2.
 *   Création d'arme de prestige : budget 150 PG, grille tarifaire ~40 effets (2038 pp.36-38).
 * - Armures 4e génération (2038 pp.15-23) : pas de PS, agonie = test Sang-Froid+Hargne 4,
 *   immunités, sensibilité IEM, armure vivante.
 * - Bonus de synergie des modules de prestige (aucun slot, 2038 p.26) : si tous les modules
 *   d'un blason sont achetés — −3 PE sur leur activation (min 1), OU activation −1 niveau,
 *   OU un 1D6 lancé devient 1D6+3.
 */

/** Modules de prestige par blason (PARTIE 7 E, pp.26-33) — Table Ronde à 500 PG, aucun slot. */
export interface ModulePrestige {
  id: string;
  blason: string;
  nom: string;
  coutPG: number;
  activation: string;
  duree: string;
  energie: string;
  description: string;
  page: string;
}

/** Les 33 modules de prestige du supplément, un par ligne du digest. */
export const MODULES_PRESTIGE: ModulePrestige[] = [
  // Ours (2038 p.26)
  { id: 'puissance-ours', blason: 'ours', nom: 'Puissance de l’ours', coutPG: 40, activation: 'aucune', duree: 'scène-phase', energie: '12 PE', description: 'Armes « deux mains » utilisables à une main (akimbo/ambidextre), effet lourd ignoré, port ×2, bonus OD Force ×2', page: '2038 p.26' },
  { id: 'endurance-ours', blason: 'ours', nom: 'Endurance de l’ours', coutPG: 30, activation: 'aucune', duree: '1 tour', energie: '2 PE', description: '1×/tour : jet de 3 dés, la méta-armure récupère en PA le meilleur', page: '2038 p.26' },
  { id: 'rage-ours', blason: 'ours', nom: 'Rage de l’ours', coutPG: 30, activation: '3 PE/tour', duree: '—', energie: '3 PE/tour', description: 'À 0 PS l’armure continue de se battre (protège/attaque) ; stand-by à 0 PE ou fin de phase', page: '2038 p.26' },
  // Serpent (2038 p.27)
  { id: 'peau-serpent', blason: 'serpent', nom: 'Peau du serpent', coutPG: 30, activation: 'aucune', duree: 'scène-phase', energie: '6 PE', description: 'Réaction +2 ; immobile contre surface unie = indétectable (sauf Machine exceptionnelle)', page: '2038 p.27' },
  { id: 'toucher-serpent', blason: 'serpent', nom: 'Toucher du serpent', coutPG: 30, activation: 'permanent', duree: 'permanent', energie: '0 PE', description: 'Toutes les attaques de contact : meurtrier + dégâts continus 6 (doublés si déjà présents)', page: '2038 p.27' },
  { id: 'sens-serpent', blason: 'serpent', nom: 'Sens du serpent', coutPG: 20, activation: 'aucune', duree: 'scène-phase', energie: '3 PE', description: 'Sonar : ennemis jusqu’à portée moyenne, même invisibles/éthérés (immunisés : Machine/Masque exceptionnels)', page: '2038 p.27' },
  { id: 'reflexes-serpent', blason: 'serpent', nom: 'Réflexes du serpent', coutPG: 20, activation: 'permanent', duree: 'permanent', energie: '0 PE', description: 'Initiative 3 dés +10 ; +1 action de déplacement', page: '2038 p.27' },
  // Dragon (2038 p.28)
  { id: 'souffle-dragon', blason: 'dragon', nom: 'Souffle du dragon', coutPG: 40, activation: 'action de déplacement', duree: '1 tour', energie: 'variable (1 PE = 1D6)', description: 'Dégâts 2D6 +1D6/PE (max +8D6), violence idem, portée courte ; ignore CdF / anti-véhicule / destructeur / fureur', page: '2038 p.28' },
  { id: 'aura-dragon', blason: 'dragon', nom: 'Aura du dragon', coutPG: 40, activation: 'permanent', duree: 'dépense spéciale', energie: 'dépense spéciale', description: 'CdF +3 ; à l’impact +1 CdF par PE dépensé (max 10), amortit tout sauf ignore CdF', page: '2038 p.28' },
  { id: 'grandeur-dragon', blason: 'dragon', nom: 'Grandeur du dragon', coutPG: 20, activation: 'permanent', duree: 'permanent', energie: '0 PE', description: 'Armure +50 cm, blindage : +10 PA', page: '2038 p.28' },
  // Faucon (2038 p.29)
  { id: 'force-faucon', blason: 'faucon', nom: 'Force du faucon', coutPG: 60, activation: 'aucune', duree: 'scène-phase', energie: '8 PE', description: 'Armes des alliés à portée courte gagnent anti-Anathème (tir : si cible à portée courte)', page: '2038 p.29' },
  { id: 'lumiere-faucon', blason: 'faucon', nom: 'Lumière du faucon', coutPG: 40, activation: 'permanent', duree: 'permanent', energie: '0 PE', description: 'Toutes les attaques du porteur ont lumière 6 (non transférable)', page: '2038 p.29' },
  // Sanglier (2038 p.29)
  { id: 'hargne-sanglier', blason: 'sanglier', nom: 'Hargne du sanglier', coutPG: 60, activation: 'aucune', duree: 'scène-phase', energie: '6 PE', description: 'Ajoute Hargne (+bonus OD) à tous les combos de la scène ; actions obligatoirement cruelles/violentes ; aucun héroïsme', page: '2038 p.29' },
  { id: 'obstination-sanglier', blason: 'sanglier', nom: 'Obstination du sanglier', coutPG: 40, activation: 'permanent', duree: 'permanent', energie: '0 PE', description: 'Relance toujours les tests peur/désespoir, garde le meilleur', page: '2038 p.29' },
  // Cheval (2038 p.30)
  { id: 'fidelite-cheval', blason: 'cheval', nom: 'Fidélité du cheval', coutPG: 80, activation: 'action de combat', duree: '1 tour', energie: '10 PE', description: 'Attaque groupée 1×/tour : les alliés PJ attaquent la cible désignée sans dépenser d’action', page: '2038 p.30' },
  { id: 'loyaute-cheval', blason: 'cheval', nom: 'Loyauté du cheval', coutPG: 20, activation: 'aucune', duree: 'scène-phase', energie: '6 PE', description: 'Redéploie des OD vers l’armure d’un allié (inutilisables par le donneur ; OD-bonus Warrior non redéployables)', page: '2038 p.30' },
  // Aigle (2038 p.30)
  { id: 'serres-aigle', blason: 'aigle', nom: 'Serres de l’aigle', coutPG: 30, activation: 'action de déplacement', duree: 'fin de scène', energie: '0 PE', description: 'Attaque supplémentaire/tour (Combat ou Tir) : 4D6 / 3D6, portée courte, ignore armure ; effets grappin', page: '2038 p.30' },
  { id: 'vivacite-aigle', blason: 'aigle', nom: 'Vivacité de l’aigle', coutPG: 40, activation: 'permanent', duree: 'permanent', energie: '0 PE', description: 'Réaction +4', page: '2038 p.30' },
  { id: 'oeil-aigle', blason: 'aigle', nom: 'Œil de l’aigle', coutPG: 30, activation: 'permanent', duree: 'permanent', energie: '0 PE', description: 'Ignore tous les malus de portée au tir (sauf lance-flammes)', page: '2038 p.30' },
  // Cerf (2038 p.31)
  { id: 'autorite-cerf', blason: 'cerf', nom: 'Autorité du cerf', coutPG: 40, activation: 'aucune', duree: 'selon l’ordre', energie: '4 PE (+2/personne en plus)', description: 'Ordre simple à un PNJ humain (Machine < 12) à portée moyenne ou inférieure', page: '2038 p.31' },
  { id: 'noblesse-cerf', blason: 'cerf', nom: 'Noblesse du cerf', coutPG: 40, activation: 'aucune', duree: 'scène-phase', energie: '8 PE', description: 'Aura : les humains préfèrent attaquer d’autres PJ ; si attaqué +3 défense/+3 réaction ; moitié du débordement contre bandes humaines', page: '2038 p.31' },
  { id: 'splendeur-cerf', blason: 'cerf', nom: 'Splendeur du cerf', coutPG: 20, activation: 'permanent', duree: 'permanent', energie: '0 PE', description: 'Défense +3', page: '2038 p.31' },
  // Corbeau (2038 p.31)
  { id: 'rire-corbeau', blason: 'corbeau', nom: 'Rire du corbeau', coutPG: 40, activation: 'permanent', duree: 'permanent', energie: '0 PE', description: 'À chaque dégât subi : redirige jusqu’à la moitié vers sa réserve PE (impossible à 0 PE)', page: '2038 p.31' },
  { id: 'faim-corbeau', blason: 'corbeau', nom: 'Faim du corbeau', coutPG: 40, activation: 'permanent', duree: 'permanent', energie: '0 PE', description: 'Chaque attaque réussie (contact/moyenne) : 1D6, l’adversaire perd autant de PE, le PJ les récupère (détruits si l’ennemi est à 0)', page: '2038 p.31' },
  { id: 'longevite-corbeau', blason: 'corbeau', nom: 'Longévité du corbeau', coutPG: 20, activation: 'permanent', duree: 'permanent', energie: '0 PE', description: 'Second noyau : +20 PE', page: '2038 p.31' },
  // Lion (2038 p.32)
  { id: 'courage-lion', blason: 'lion', nom: 'Courage du lion', coutPG: 30, activation: 'aucune', duree: 'scène-phase', energie: '8 PE', description: 'Bouclier d’espoir : pertes d’espoir PJ + alliés à portée courte réduites de 1 (cumulable)', page: '2038 p.32' },
  { id: 'assurance-lion', blason: 'lion', nom: 'Assurance du lion', coutPG: 20, activation: 'permanent', duree: 'permanent', energie: '0 PE', description: '+2 espoirs quand il en récupère et entend son IA', page: '2038 p.32' },
  { id: 'ferocite-lion', blason: 'lion', nom: 'Férocité du lion', coutPG: 50, activation: 'aucune', duree: '1 tour', energie: '3 PE', description: '1 action de combat supplémentaire par tour ; avec accélérateur = 3e action', page: '2038 p.32' },
  // Taureau (2038 p.32)
  { id: 'cuir-taureau', blason: 'taureau', nom: 'Cuir du taureau', coutPG: 50, activation: 'permanent', duree: 'permanent', energie: '0 PE', description: 'Dégâts sur PS redirigés vers PA (ignore armure/perce armure sans effet) ; règle des multiples de 5 appliquée', page: '2038 p.32' },
  { id: 'vigueur-taureau', blason: 'taureau', nom: 'Vigueur du taureau', coutPG: 20, activation: 'permanent', duree: 'permanent', energie: '0 PE', description: 'PS +½ du total actuel', page: '2038 p.32' },
  { id: 'presence-taureau', blason: 'taureau', nom: 'Présence du taureau', coutPG: 30, activation: 'action de déplacement', duree: '1 tour ou 10 s', energie: '3 PE', description: 'Rend 1D6 PS aux PJ/PNJ alliés à portée courte', page: '2038 p.32' },
  // Loup (2038 p.33)
  { id: 'meute-loup', blason: 'loup', nom: 'Meute du loup', coutPG: 30, activation: 'action de déplacement', duree: 'scène', energie: '6 PE', description: 'Meute de drones (bande alliée : cohésion 100, déf 2, réaction 2, débordement 6, vol niv.3) OU drone unique (Chair 8, Bête 8, Machine 12, Masque 8 ; déf 3, réaction 4, PA 70, CdF 10 ; shotgun automatique lourd 6D6+12 ×2, dispersion 6, lourd)', page: '2038 p.33' },
  { id: 'instinct-loup', blason: 'loup', nom: 'Instinct du loup', coutPG: 50, activation: 'permanent', duree: 'permanent', energie: '0 PE', description: 'À l’achat : 2 effets à ignorer parmi choc X / dégâts continus X / perce armure X / peur X + 1 parmi ignore armure / ignore CdF / drain d’énergie / domination', page: '2038 p.33' },
  { id: 'protection-loup', blason: 'loup', nom: 'Protection du loup', coutPG: 20, activation: 'action de déplacement', duree: 'scène', energie: '3 PE (+2/allié)', description: 'CdF actuel +2 pour la scène', page: '2038 p.33' },
];

/** Compte dérivé : 33 modules (ours 3, serpent 4, dragon 3, faucon 2, sanglier 2, cheval 2, aigle 3, cerf 3, corbeau 3, lion 3, taureau 3, loup 3). */
export const MODULES_PRESTIGE_COUNT = MODULES_PRESTIGE.length;
