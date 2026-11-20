/**
 * Arsenal 2038 (PARTIE 7 du digest — pages 34-36 + reliques).
 * Armes de prestige (Table Ronde à 500 PG ou 700 PG) + reliques d'espoir.
 * Pages du supplément citées par arme.
 */
import type { Weapon } from '../types/character';

/** helper : profil d'arme de prestige */
function prestige(id: string, nom: string, type: Weapon['type'], pg: number, d: { nombre: number; bonus: number }, v: { nombre: number; bonus: number }, portee: Weapon['portee'], effets: string[]): Weapon {
  return {
    id, nom, type, accessibilite: 'rare', coutPG: pg, equipee: false,
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

/** Modules de prestige (PARTIE 7 E) — Table Ronde à 500 PG, aucun slot.
 * Liste complète des 20 modules par blason : données complètes pp.26-33. */
export const MODULES_PRESTIGE_TABLE_RONDE = true; // accès à 500 PG — implémentation complète au fur et à mesure (voir TODO-RULES)
