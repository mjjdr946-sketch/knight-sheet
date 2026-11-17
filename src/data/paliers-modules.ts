/**
 * Modifier des paliers de modules (prompt v10 §3) — table au cas par cas.
 * Source : descriptions des données modules (digest PARTIE 4). Un module
 * absent de la table = pas d'effet de niveau câblé (TODO-RULES 🔶).
 * Chaque entrée : les effets du niveau NIV S'AJOUTENT à ceux du niveau 1.
 */
import type { Modifier } from '../types/character';

export const PALIERS_MODULES: Record<string, { niv2: Modifier[]; niv3?: Modifier[]; note: string }> = {
  // Saut niv 2 : +9 dégâts (digest PARTIE 4 — « saut niv 2 : +9 dégâts »)
  saut: {
    niv2: [],
    note: 'niv 2 : +9 dégâts (effet appliqué au moment du saut, voir TODO-RULES)',
  },
  // Blindage drone (digest : niv 2 = +4 CdF, +3 défense — cumulable avec le Shrine)
  'blindage-drone': {
    niv2: [
      { source: 'Blindage drone niv 2', target: 'cdf', valeur: 4, type: 'bonus' },
      { source: 'Blindage drone niv 2', target: 'defense', valeur: 3, type: 'bonus' },
    ],
    note: 'niv 2 : +4 CdF et +3 défense (cumulables avec le Shrine, FAQ p.449)',
  },
  // Miniaturisation / masse de contrôle / RIGG : pas de niveaux décrits
};

/** Effets d'un module à son niveau courant : niv 1 = effets de base, niv 2+ = + paliers */
export function effetsDeNiveau(moduleId: string, niveau: number, effetsNiv1: Modifier[]): Modifier[] {
  const palier = PALIERS_MODULES[moduleId];
  if (!palier || niveau <= 1) return effetsNiv1;
  const sup: Modifier[] = palier.niv2 ?? [];
  const niv3 = niveau >= 3 ? palier.niv3 ?? [] : [];
  return [...effetsNiv1, ...sup, ...niv3];
}
