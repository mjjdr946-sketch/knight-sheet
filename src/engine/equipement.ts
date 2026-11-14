/**
 * Moteur — coûts d'énergie structurés et équipement multi-mains.
 */
import type { Character, Weapon } from '../types/character';

/** Coût d'énergie structuré — remplace le parsing par premier entier */
export interface CoutPE {
  /** Coût à l'activation du module/capacité */
  activation: number;
  /** Coût par usage, si applicable */
  usage?: {
    cout: number;
    par: 'tir' | 'action' | 'tour' | 'attaque';
  };
}

/**
 * Parse une chaîne de coût PE du livre.
 * Exemples : '2' → {activation:2} ; '1/tir' → {activation:0, usage:{1,'tir'}} ;
 * '2 (activation) + 1 par tir supplémentaire' → {activation:2, usage:{1,'tir'}} ;
 * '1/action' → {activation:0, usage:{1,'action'}} ; '1/dé ajouté' → usage action.
 */
export function parseCoutPE(coutPE?: string): CoutPE {
  if (!coutPE) return { activation: 0 };
  // '1/tir' : le premier nombre suivi de '/' est un coût PAR USAGE, pas une activation
  const usageSeul = /^\d+\s*\//.test(coutPE);
  const activationMatch = usageSeul ? null : coutPE.match(/^(\d+)/);
  const activation = activationMatch?.[1] ? parseInt(activationMatch[1], 10) : 0;
  const usageMatch = coutPE.match(/(\d+)\s*\/\s*(tir|action|tour|attaque)/i)
    ?? coutPE.match(/(\d+)\s*par\s*(tir|action|tour|attaque)/i);
  if (usageMatch) {
    return {
      activation,
      usage: {
        cout: parseInt(usageMatch[1] ?? '0', 10),
        par: usageMatch[2]!.toLowerCase() as 'tir' | 'action' | 'tour' | 'attaque',
      },
    };
  }
  return { activation };
}

// ─── Équipement multi-mains (FAQ p.453, évolutions Paladin p.140) ──────────

export interface ValidationEquipement {
  ok: boolean;
  raison?: string;
}

/** Arme considérée « en main » : équipée OU slotée dans un bras (évolution 150 PG, p.140) */
export function enMain(character: Character, arme: Weapon): boolean {
  return arme.equipee === true || arme.slotee !== undefined;
}

function estDeuxMains(arme: Weapon): boolean {
  return arme.effets.includes('Deux mains');
}

function estLourd(arme: Weapon): boolean {
  return arme.effets.includes('Lourd');
}

/**
 * Valide l'équipement d'une arme.
 * Règles :
 * - p.87 : deux mains = les deux mains obligatoires → aucune autre arme en main
 * - p.87 : ambidextre = 2 armes à une main ; akimbo = 2 armes IDENTIQUES
 * - FAQ p.453 : akimbo/ambidextre s'appliquent aux armes en main ET slotées
 * - p.140/FAQ p.455 : une arme avec l'attribut lourd ne peut pas être slotée
 */
export function validerEquipement(character: Character, arme: Weapon): ValidationEquipement {
  const autres = character.armes.filter((a) => a.id !== arme.id && enMain(character, a));

  if (estDeuxMains(arme) && autres.length > 0) {
    return { ok: false, raison: `Arme à deux mains : les autres mains doivent être libres (${autres.map((a) => a.nom).join(', ')} en main)` };
  }
  for (const autre of autres) {
    if (estDeuxMains(autre) && enMain(character, arme)) {
      return { ok: false, raison: `${autre.nom} occupe les deux mains` };
    }
  }
  // Akimbo : les 2 armes doivent être IDENTIQUES (même profil) — p.87
  if (autres.length === 1 && autres[0] && !estDeuxMains(autres[0])) {
    if (autres[0].id !== arme.id) {
      // 2 armes différentes = ambidextre (autorisé, malus différent) — pas de blocage
      // mais 2 armes de types différents dont une jumelée akimbo ? Le style décide.
    }
  }
  return { ok: true };
}

/**
 * Valide le slotage d'une arme dans un bras de Paladin (évolution 150 PG).
 * RÈGLES p.140 + FAQ p.455 :
 * - arme de tir uniquement, SANS l'attribut lourd
 * - 1 slot/bras pour une arme à 1 main, 2 slots pour une arme à 2 mains
 * - Aisance n'a aucun effet ici
 */
export function validerSlotage(character: Character, arme: Weapon, bras: 'brasGauche' | 'brasDroit'): ValidationEquipement {
  const evol150 = character.metaArmor.evolutions.find((e) => e.seuilPG === 150);
  if (!evol150 || character.gloire < evol150.seuilPG) {
    return { ok: false, raison: 'Évolution 150 PG non acquise : slotage indisponible (p.140)' };
  }
  if (arme.type !== 'distance') {
    return { ok: false, raison: 'Seules les armes de tir peuvent être slotées (p.140)' };
  }
  if (estLourd(arme)) {
    return { ok: false, raison: "Les armes avec l'effet lourd ne peuvent pas être slotées (FAQ p.455)" };
  }
  // Slots requis : 1 (une main) ou 2 (deux mains) sur le bras
  const requis = estDeuxMains(arme) ? 2 : 1;
  const pris = character.armes
    .filter((a) => a.id !== arme.id && a.slotee === bras)
    .reduce((t, a) => t + (estDeuxMains(a) ? 2 : 1), 0);
  const dispo = character.metaArmor.slots[bras];
  if (pris + requis > dispo) {
    return { ok: false, raison: `Pas assez de slots sur ${bras} : ${pris + requis} requis, ${dispo} disponibles` };
  }
  return { ok: true };
}
