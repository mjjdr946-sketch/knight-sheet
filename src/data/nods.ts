/**
 * Nods (seringues) — annexe 2 (digest PARTIE 4, lignes 648-651).
 * 1 action de déplacement, utilisables sur soi ou autrui.
 */
export interface Nod {
  nom: string;
  restaure: string;
  /** Contraintes d'usage éventuelles */
  contrainte?: string;
}

export const NODS: Record<'soin' | 'armure' | 'energie', Nod> = {
  soin: {
    nom: 'Nod de soin',
    restaure: '3D6 PS',
  },
  armure: {
    nom: 'Nod d\u2019armure',
    restaure: '3D6 PA', // points d'armure de la méta-armure
  },
  energie: {
    nom: 'Nod d\u2019énergie',
    restaure: '3D6 PE',
    contrainte:
      'Espacer les usages d\u2019une heure ; abus (au MJ) : fuite −3D6 PE, explosion 3D6 dégâts sans CdF, réacteur inutilisable 1 h',
  },
};
