/**
 * Formatage des profils de dégâts/violence (ex. "3D6+Force (9)").
 */
import type { DamageProfile } from '@/types/character';

/** Libellés lisibles des bonus spéciaux (Force, Dextérité, Tir…) */
const BONUS_LABELS: Record<string, string> = {
  force: 'Force',
  'force×2': 'Force ×2',
  dexterite: 'Dextérité',
  tir: 'Tir',
};

export function formaterProfil(profil: DamageProfile): string {
  const des = `${profil.nombre}D${profil.faces}`;
  let bonus = '';
  if (typeof profil.bonus === 'number') {
    if (profil.bonus > 0) bonus = `+${profil.bonus}`;
    else if (profil.bonus < 0) bonus = profil.bonus.toString();
  } else {
    bonus = `+${BONUS_LABELS[profil.bonus] ?? profil.bonus}`;
  }
  const moyenne = profil.moyenne !== undefined ? ` (${profil.moyenne})` : '';
  return `${des}${bonus}${moyenne}`;
}
