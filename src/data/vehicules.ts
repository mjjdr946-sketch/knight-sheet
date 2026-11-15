/**
 * Catalogue des véhicules — annexe (pp.447-450, digest PARTIE 5).
 * Tous les véhicules sont de type « colosse » (tranches de 10 dégâts = 1 PA,
 * l'anti-véhicule compense — p.104). PE = carburant.
 * Une Paladin occupe toujours 2 points d'équipage (FAQ p.455).
 */
export interface Vehicule {
  id: string;
  nom: string;
  categorie: 'militaire' | 'civil';
  pa: number;
  pe: number;
  cdf: number;
  /** vitesse max/tour : 0 = quelques m · 1 = 50 m · 2 = 300 m · 3 = 1 km · 4 = 5 km · 5 = 10 km */
  vitesse: number;
  /** dés ± ajoutés aux jets du conducteur ; 0 dé (négatif) = impossible de piloter */
  manoeuvrabilite: number;
  equipage: number;
  armement: string;
}

export const VEHICULES: Vehicule[] = [
  // ─── Militaires / du Knight (p.447-448) ──────────────────────────────
  { id: 'vector-lourd', nom: 'Vector lourd', categorie: 'militaire', pa: 200, pe: 30, cdf: 12, vitesse: 4, manoeuvrabilite: 3, equipage: 64, armement: 'Aucun' },
  { id: 'vector-legier', nom: 'Vector léger', categorie: 'militaire', pa: 40, pe: 30, cdf: 8, vitesse: 5, manoeuvrabilite: 1, equipage: 12, armement: 'Aucun' },
  { id: 'vector-combat', nom: 'Vector de combat', categorie: 'militaire', pa: 150, pe: 50, cdf: 12, vitesse: 5, manoeuvrabilite: 0, equipage: 6, armement: '(4) railgun, 2 pods missile, 2 pods roquette, mitrailleuse lourde, désignation' },
  { id: 'vector-harpie', nom: 'Vector modèle Harpie', categorie: 'militaire', pa: 100, pe: 50, cdf: 12, vitesse: 5, manoeuvrabilite: 3, equipage: 18, armement: '(5) railgun, 3 pods missile, 3 pods roquette, fusil laser, désignation' },
  { id: 'dropship', nom: 'Dropship', categorie: 'militaire', pa: 500, pe: 90, cdf: 14, vitesse: 3, manoeuvrabilite: -4, equipage: 250, armement: '(20) 2 railguns cockpit, 10 tourelles auto, 8 lance-missiles, 2 désignations' },
  { id: 'moto-steed', nom: 'Moto steed', categorie: 'militaire', pa: 30, pe: 30, cdf: 0, vitesse: 3, manoeuvrabilite: 3, equipage: 1, armement: '(1) shotgun escamotable à l\u2019avant' },
  { id: 'stalion', nom: 'Stalion', categorie: 'militaire', pa: 80, pe: 30, cdf: 12, vitesse: 2, manoeuvrabilite: 1, equipage: 5, armement: '(2) railgun OU 2 mitrailleuses lourdes' },
  { id: 'centurion', nom: 'Transport blindé Centurion', categorie: 'militaire', pa: 200, pe: 30, cdf: 14, vitesse: 2, manoeuvrabilite: -3, equipage: 14, armement: '(2) mitrailleuse lourde + lance-missile + désignation' },
  { id: 'titan', nom: 'Titan', categorie: 'militaire', pa: 400, pe: 90, cdf: 14, vitesse: 1, manoeuvrabilite: -4, equipage: 60, armement: '(11) railgun/lance-flammes tourelle, 2 tourelles auto, 4 lance-grenades, 2 lance-missiles, 2 désignations' },
  { id: 'maraudeur-ii', nom: 'Maraudeur II', categorie: 'militaire', pa: 150, pe: 30, cdf: 0, vitesse: 2, manoeuvrabilite: 0, equipage: 10, armement: '(2) mitrailleuse lourde + pod roquette' },
  // ─── Civils (p.449) ──────────────────────────────────────────────────
  { id: 'moto', nom: 'Moto', categorie: 'civil', pa: 10, pe: 10, cdf: 0, vitesse: 3, manoeuvrabilite: 2, equipage: 2, armement: '—' },
  { id: 'voiture', nom: 'Voiture', categorie: 'civil', pa: 30, pe: 10, cdf: 0, vitesse: 3, manoeuvrabilite: 0, equipage: 5, armement: '—' },
  { id: 'camionnette', nom: 'Camionnette', categorie: 'civil', pa: 60, pe: 10, cdf: 0, vitesse: 2, manoeuvrabilite: 0, equipage: 9, armement: '—' },
  { id: 'camion', nom: 'Camion', categorie: 'civil', pa: 100, pe: 10, cdf: 0, vitesse: 2, manoeuvrabilite: -2, equipage: 40, armement: '—' },
  { id: 'helicoptere', nom: 'Hélicoptère', categorie: 'civil', pa: 80, pe: 10, cdf: 0, vitesse: 3, manoeuvrabilite: -2, equipage: 20, armement: '(2) mitrailleuse lourde ou fusil laser' },
  { id: 'avion-ligne', nom: 'Avion de ligne', categorie: 'civil', pa: 200, pe: 30, cdf: 0, vitesse: 5, manoeuvrabilite: -4, equipage: 900, armement: '—' },
  { id: 'jet-prive', nom: 'Jet privé', categorie: 'civil', pa: 100, pe: 30, cdf: 0, vitesse: 5, manoeuvrabilite: -1, equipage: 60, armement: '—' },
];
