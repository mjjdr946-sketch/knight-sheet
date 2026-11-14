/**
 * Personnage d'exemple — Paladin cohérent avec le digest.
 * Calcul manuel de vérification (doit correspondre aux tests du moteur) :
 * - Aspects : Chair 4, Bête 5, Machine 3, Dame 6, Masque 4
 *   (base 2 partout, +2 Dame = cartes, +1 Chair haut fait « Survivant de la peste rouge »,
 *   +1 Dame archétype Célébrité… → cohérent, aspects ≤ 9)
 * - PS = (10 + 6 × meilleure Chair SANS OD) + Dur à cuir = 10 + 6 × 4 + 5 = 39
 *   (base 34, règle p.90/172 ; +5 PS via l'avantage Dur à cuir, lame XI)
 * - Défense = Hargne 5 (les 4 OD de base sont en 4 aspects différents :
 *   force/Chair, sangfroid/Dame, tir/Machine, perception/Masque — tranchage v4 §0.1)
 * - Réaction = Tir 4 (+1 OD Tir) → 5
 * - Initiative = Perception 4 (+1 OD Perception) → 5
 * - Contacts = meilleure Dame SANS OD = Parole 6 → 6
 * - PEs = 50 (aucun avantage modifiant le total dans cet exemple)
 * - CdF armure déployée = 8 ; foldée (Guardian) = 5
 * - PA armure déployée = 120 ; foldée = 5
 * - PE max = 20
 */
import type { Character } from '../types/character';
import { paladin } from './meta-armor';
import { fusilAssaut, lanceGrenadeLeger, marteauEpieu, pistoletDeService } from './weapons';
import { blindageDrone, flash, fumigene, lameDeBras, relaisTaccom } from './modules';

export const personnageExemple: Character = {
  id: 'paladin-demo',
  nom: 'Seraphine « Ambre » Vasseur',
  classe: 'paladin',
  concept: 'Célébrité survivante de la peste rouge, pilote d\'artillerie défensive',
  niveau: 'écuyer',
  aspects: { chair: 4, bete: 5, machine: 3, dame: 6, masque: 4 },
  traits: {
    // Chair
    deplacement: 2, force: 3, endurance: 4,
    // Bête
    hargne: 5, combat: 3, instinct: 2,
    // Machine
    tir: 4, savoir: 2, technique: 2,
    // Dame
    aura: 4, parole: 6, sangfroid: 3,
    // Masque
    discretion: 2, dexterite: 3, perception: 4,
  },
  overdrives: [
    // 4 OD de base de la Paladin (p.138), un par aspect : force (Chair),
    // sangfroid (Dame), tir (Machine), perception (Masque) — tranchage v4 §0.1
    { trait: 'force', niveau: 1 },
    { trait: 'sangfroid', niveau: 1 },
    { trait: 'tir', niveau: 1 },
    { trait: 'perception', niveau: 1 },
  ],
  choixDerivees: {
    defense: 'hargne',     // meilleure Bête (règle p.88 : au choix)
    reaction: 'tir',       // meilleure Machine
    initiative: 'perception', // meilleure Masque
    sante: 'endurance',    // meilleure Chair sans OD → PS 34
  },
  metaArmor: paladin,
  armes: [marteauEpieu, pistoletDeService, fusilAssaut, lanceGrenadeLeger],
  modules: [relaisTaccom, lameDeBras, fumigene, flash, blindageDrone],
  identite: {
    cartes: [
      {
        numero: 'XI',
        nom: 'La Force',
        aspect: 'chair',
        avantagesRetenus: ['Dur à cuir (+5 PS total)'],
        inconvénientRetenu: undefined,
        effets: [{ source: 'Dur à cuir', target: 'ps', valeur: 5, type: 'bonus' }],
      },
      {
        numero: 'V',
        nom: 'Le Pape',
        aspect: 'machine',
        avantagesRetenus: ['Forteresse spirituelle (+5 PEs total)'],
        inconvénientRetenu: undefined,
        effets: [{ source: 'Forteresse spirituelle', target: 'pes', valeur: 5, type: 'bonus' }],
      },
      {
        numero: 'VIII',
        nom: 'La Justice',
        aspect: 'machine',
        avantagesRetenus: ['Bon sens (+1 réussite auto contre manipulation)'],
        inconvénientRetenu: 'Trop prudent : initiative sur 2D6 au lieu de 3D6',
        effets: [],
      },
    ],
    hautFait: {
      nom: 'Survivant de la peste rouge',
      surnom: 'Ambre',
    },
    blason: "L'Ours — Empêcher la mort d'un être humain",
    serment: undefined,
    motivations: [
      { type: 'majeure', texte: 'Retrouver la fille disparue pendant la peste rouge' },
      { type: 'mineure', texte: 'Protéger mes équipiers, coûte que coûte' },
      { type: 'mineure', texte: "Empêcher la mort d'un être humain (vœu du blason L'Ours)" },
    ],
  },
  jauges: {
    // Scores actuels de départ — les max viennent du moteur
    ps: { current: 39 }, // 34 de base + 5 Dur à cuir
    pa: { current: 120 },
    pe: { current: 20 },
    cdf: { current: 8 },
    pes: { current: 55 },
    heroisme: { current: 0 },
  },
  armureDeployee: true,
  gloire: 0,
  experience: 0,
  conditions: [],
};
