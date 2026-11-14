/**
 * Formatage des profils de dégâts/violence (ex. "3D6+Force (9)").
 */
import type { DamageProfile } from '@/types/character';

export function formaterProfil(profil: DamageProfile): string {
  const des = `${profil.nombre}D${profil.faces}`;
  let bonus = '';
  if (typeof profil.bonus === 'number') {
    if (profil.bonus > 0) bonus = `+${profil.bonus}`;
    else if (profil.bonus < 0) bonus = profil.bonus.toString();
  } else {
    bonus = `+${profil.bonus}`;
  }
  const moyenne = profil.moyenne !== undefined ? ` (${profil.moyenne})` : '';
  return `${des}${bonus}${moyenne}`;
}
