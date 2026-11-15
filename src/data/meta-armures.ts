/**
 * Les 9 méta-armures — étape 7 de création (règles p.129-131).
 * Seule la PALADIN est extraite en détail du digest (PARTIE 3 §1).
 * Les 8 autres modèles sont structurés mais leur profil chiffré (PA/PE/CdF,
 * slots, capacités) n'est PAS dans le digest → placeholders `RÈGLES: à
 * compléter` listés dans TODO-RULES.md — ne jamais inventer une valeur.
 */
import type { MetaArmor } from '../types/character';
import { paladin as paladinArmure } from './meta-armor';

/** Gabarit commun : les scores à 0 signalent un profil à extraire du livre */
function gabarit(modele: string, generation: 1 | 2 | 3, note: string): MetaArmor {
  return {
    modele,
    generation,
    slots: { tete: 0, torse: 0, brasGauche: 0, brasDroit: 0, jambeGauche: 0, jambeDroite: 0 }, // RÈGLES: à compléter — slots p.130-137 non extraits
    paTotal: 0, // RÈGLES: à compléter
    peTotal: 0, // RÈGLES: à compléter
    cdfTotal: 0, // RÈGLES: à compléter
    overdrivesDeBase: [], // RÈGLES: à compléter — OD de base propres au modèle
    capacites: [], // RÈGLES: à compléter — capacités propres au modèle
    handicaps: [note], // note documentaire affichée dans l'UI
    evolutions: [], // RÈGLES: à compléter
  };
}

export const META_ARMURES: Record<string, MetaArmor> = {
  paladin: paladinArmure,
  warrior: gabarit('warrior', 1, 'RÈGLES: à compléter — Warrior 1re génération, seule armure pouvant dépasser 5 niveaux d\u2019OD (p.130)'),
  warmaster: gabarit('warmaster', 1, 'RÈGLES: à compléter — Warmaster 1re génération (impulsions citées FAQ p.455)'),
  rogue: gabarit('rogue', 1, 'RÈGLES: à compléter — Rogue (p.129-131)'),
  bard: gabarit('bard', 1, 'RÈGLES: à compléter — Bard (p.129-131)'),
  wizard: gabarit('wizard', 1, 'RÈGLES: à compléter — Wizard (p.129-131)'),
  barbarian: gabarit('barbarian', 1, 'RÈGLES: à compléter — Barbarian, mode Goliath ne peut pas embarquer en véhicule (p.104)'),
  ranger: gabarit('ranger', 1, 'RÈGLES: à compléter — Ranger (p.129-131)'),
  priest: gabarit('priest', 1, 'RÈGLES: à compléter — Priest, créée par Merlin avec la Paladin (p.139)'),
};

/** Libellés lisibles pour le sélecteur */
export const NOMS_ARMURES: { id: string; nom: string; generation: string }[] = [
  { id: 'paladin', nom: 'Paladin', generation: '1re — artillerie/protecteur' },
  { id: 'warrior', nom: 'Warrior', generation: '1re' },
  { id: 'warmaster', nom: 'Warmaster', generation: '1re' },
  { id: 'rogue', nom: 'Rogue', generation: '1re' },
  { id: 'bard', nom: 'Bard', generation: '1re' },
  { id: 'wizard', nom: 'Wizard', generation: '1re' },
  { id: 'barbarian', nom: 'Barbarian', generation: '1re' },
  { id: 'ranger', nom: 'Ranger', generation: '1re' },
  { id: 'priest', nom: 'Priest', generation: '1re' },
];
