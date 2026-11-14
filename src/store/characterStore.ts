/**
 * Store Zustand persistant — LA porte d'entrée pour toute modification.
 * L'UI ne modifie jamais l'état directement ni ne calcule : chaque action
 * passe par le moteur (src/engine/) puis recalcule les stats dérivées.
 *
 * Persistance : localStorage, clé versionnée `knight-sheet-v1`
 * (schemaVersion dans le payload pour migrations futures).
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { applyDamage, type DamageInput, type DamageResult } from '../engine/damage';
import { computeDerived } from '../engine/stats';
import { STYLE_CONDITION_ID, getStyle, styleVersCondition } from '../engine/combat';
import { personnageExemple } from '../data/character';
import { MODULES_INTERDITS_PALADIN } from '../data/modules';
import type { Character, Condition, DerivedStats } from '../types/character';

/** Version du schéma de persistance — à incrémenter à chaque breaking change */
export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'knight-sheet-v1';

/** Cibles de jauge modifiables par l'UI */
export type JaugeCible = 'ps' | 'pa' | 'pe' | 'pes' | 'heroisme';

interface CharacterStore {
  /** Personnage courant — source de vérité unique */
  character: Character;
  /** Stats dérivées recalculées à chaque mutation (jamais calculées côté UI) */
  derived: DerivedStats;

  // ─── Actions ────────────────────────────────────────────────────────────
  /**
   * Ajuste une jauge de `delta` (signé) — borné [0, max] par le moteur.
   * Les totaux ne bougent jamais en partie (règle p.88/§5) : seul le score
   * actuel fluctue ; le max vient de computeDerived.
   */
  ajusterJauge: (cible: JaugeCible, delta: number) => void;
  /** Règle une jauge à une valeur exacte (bornée) — ex. : suite à un soin */
  reglerJauge: (cible: JaugeCible, valeur: number) => void;
  /**
   * Active/désactive un module. Refuse les modules interdits à la Paladin
   * (« Lente et lourde », p.140) et déduit le coût en PE à l'activation.
   */
  activerModule: (id: string, activer: boolean) => boolean;
  /** Active/désactive une capacité d'armure (Shrine, Watchtower) + coût PE */
  activerCapacite: (id: string, activer: boolean) => boolean;
  /** Équipe/retire une arme (une seule équipée pour chaque usage de main — simplifié itération 1) */
  equiperArme: (id: string, equiper: boolean) => void;
  /** Ajoute une condition (blessure, agonie…) avec ses modificateurs */
  ajouterBlessure: (condition: Condition) => void;
  /** Retire une condition (implant cybernétique / thérapie — entre missions) */
  retirerCondition: (id: string) => void;
  /** Déplie/replie l'armure (Guardian : 5 PA, CdF 5, plus d'OD — p.130) */
  basculerArmure: (deployee: boolean) => void;
  /**
   * Remise à zéro du combat : jauges régénérées au max (contexte Camelot),
   * modules/capacités temporaires désactivés, recalcul complet.
   */
  resetCombat: () => void;
  /** Résout un paquet de dégâts via le moteur et applique les nouvelles jauges */
  subirDegats: (input: DamageInput) => DamageResult;
  /** Change le choix d'une valeur dérivée (au choix, changeable entre missions — p.88) */
  setChoixDerive: (cle: 'defense' | 'reaction' | 'initiative' | 'sante', trait: string) => void;
  /**
   * Déclare le style de combat (p.87-89) — un seul à la fois, déclaré avant
   * l'initiative. Remplace la condition de style existante.
   */
  declarerStyle: (styleId: string) => void;
  /** Charge un personnage complet (import futur) */
  remplacerPersonnage: (character: Character) => void;
}

/**
 * Extrait le coût en PE d'activation d'un module/capacité.
 * Convention : premier entier de la chaîne de coût. Les coûts composés
 * ('2 (activation) + 1 par tir') ne déduisent que le coût d'activation —
 * les coûts par usage sont gérés par leurs actions dédiées (à venir).
 */
function coutActivationPE(coutPE?: string): number {
  if (!coutPE) return 0;
  const match = coutPE.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0; // RÈGLES: à compléter — coûts par usage en dur côté actions
}

/** Recalcule les dérivées après une mutation d'état */
function recalcule(character: Character): Pick<CharacterStore, 'character' | 'derived'> {
  return { character, derived: computeDerived(character) };
}

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set, get) => ({
      character: personnageExemple,
      derived: computeDerived(personnageExemple),

      ajusterJauge: (cible, delta) => {
        const { character, derived } = get();
        const jauges = { ...character.jauges };
        // Bornes : 0 .. max calculé par le moteur (le max n'est jamais saisi)
        const max =
          cible === 'ps' ? derived.ps.max
          : cible === 'pa' ? derived.pa.max
          : cible === 'pe' ? derived.pe.max
          : cible === 'pes' ? derived.pes.max
          : 6; // héroïsme : max 6, règle p.96
        const courant = jauges[cible].current;
        jauges[cible] = { current: Math.min(max, Math.max(0, courant + delta)) };
        set(recalcule({ ...character, jauges }));
      },

      reglerJauge: (cible, valeur) => {
        const { character, derived } = get();
        const jauges = { ...character.jauges };
        const max =
          cible === 'ps' ? derived.ps.max
          : cible === 'pa' ? derived.pa.max
          : cible === 'pe' ? derived.pe.max
          : cible === 'pes' ? derived.pes.max
          : 6;
        jauges[cible] = { current: Math.min(max, Math.max(0, valeur)) };
        set(recalcule({ ...character, jauges }));
      },

      activerModule: (id, activer) => {
        const { character } = get();
        const module = character.modules.find((m) => m.id === id);
        if (!module) return false;
        // Handicap « Lente et lourde » p.140 : modules interdits à la Paladin
        if (activer && MODULES_INTERDITS_PALADIN.includes(id)) return false;
        // Vérification des slots libres requis sur chaque zone concernée (p.130)
        if (activer) {
          for (const [zone, requis] of Object.entries(module.slots)) {
            const pris = character.modules
              .filter((m) => m.id !== id && m.etat === 'actif')
              .reduce((total, m) => total + ((m.slots as Record<string, number | undefined>)[zone] ?? 0), 0);
            const dispo = character.metaArmor.slots[zone as keyof Character['metaArmor']['slots']];
            if (pris + (requis ?? 0) > dispo) return false;
          }
        }
        const modules = character.modules.map((m) =>
          m.id === id ? { ...m, etat: activer ? ('actif' as const) : ('inactif' as const) } : m,
        );
        const jauges = { ...character.jauges };
        if (activer) {
          const cout = coutActivationPE(module.coutPE);
          if (cout > 0) {
            jauges.pe = { current: Math.max(0, jauges.pe.current - cout) };
          }
        }
        set(recalcule({ ...character, modules, jauges }));
        return true;
      },

      activerCapacite: (id, activer) => {
        const { character } = get();
        const capacite = character.metaArmor.capacites.find((c) => c.id === id);
        if (!capacite) return false;
        const capacites = character.metaArmor.capacites.map((c) =>
          c.id === id ? { ...c, active: activer } : c,
        );
        const jauges = { ...character.jauges };
        if (activer) {
          const cout = coutActivationPE(capacite.coutPE);
          if (cout > 0) {
            // PE à 0 : plus aucune capacité utilisable (règle p.130)
            if (jauges.pe.current < cout) return false;
            jauges.pe = { current: jauges.pe.current - cout };
          }
        }
        const metaArmor = { ...character.metaArmor, capacites };
        set(recalcule({ ...character, metaArmor, jauges }));
        return true;
      },

      equiperArme: (id, equiper) => {
        const { character } = get();
        const armes = character.armes.map((a) =>
          a.id === id ? { ...a, equipee: equiper } : a,
        );
        set(recalcule({ ...character, armes }));
      },

      ajouterBlessure: (condition) => {
        const { character } = get();
        set(recalcule({ ...character, conditions: [...character.conditions, condition] }));
      },

      retirerCondition: (id) => {
        const { character } = get();
        set(recalcule({
          ...character,
          conditions: character.conditions.filter((c) => c.id !== id),
        }));
      },

      basculerArmure: (deployee) => {
        const { character } = get();
        // À 0 PA l'armure se folde automatiquement (p.130) — action manuelle possible
        set(recalcule({ ...character, armureDeployee: deployee }));
      },

      resetCombat: () => {
        const { character, derived } = get();
        // Modules temporaires désactivés, capacités coupées, armure déployée
        const modules = character.modules.map((m) =>
          m.etat === 'actif' ? { ...m, etat: 'inactif' as const } : m,
        );
        const capacites = character.metaArmor.capacites.map((c) => ({ ...c, active: false }));
        const jauges = {
          ps: { current: derived.ps.max },   // retour complet à Camelot (p.90)
          pa: { current: derived.pa.max },   // recharge intégrale à Camelot (p.130)
          pe: { current: derived.pe.max },   // recharge intégrale (p.130)
          cdf: { current: derived.cdf },
          pes: { current: derived.pes.max }, // contextes de jeu : Camelot
          heroisme: { current: character.jauges.heroisme.current }, // se conserve (p.96)
        };
        set(recalcule({
          ...character,
          modules,
          metaArmor: { ...character.metaArmor, capacites },
          armureDeployee: true,
          jauges,
        }));
      },

      subirDegats: (input) => {
        const { character } = get();
        const resultat = applyDamage(character, input);
        const jauges = { ...character.jauges };
        jauges.pa = { current: resultat.nouvellesJauges.pa };
        jauges.ps = { current: resultat.nouvellesJauges.ps };
        // À 0 PA, l'armure se folde automatiquement (règle p.130)
        const armureDeployee = resultat.armureFoldedAuto ? false : character.armureDeployee;
        set(recalcule({ ...character, jauges, armureDeployee }));
        return resultat;
      },

      setChoixDerive: (cle, trait) => {
        const { character } = get();
        set(recalcule({
          ...character,
          choixDerivees: { ...character.choixDerivees, [cle]: trait as never },
        }));
      },

      declarerStyle: (styleId) => {
        const { character } = get();
        const style = getStyle(styleId);
        // Un seul style à la fois : on retire l'ancienne condition de style
        const conditions = [
          ...character.conditions.filter((c) => c.id !== STYLE_CONDITION_ID),
          ...(style.id !== 'standard' ? [styleVersCondition(style)] : []),
        ];
        set(recalcule({ ...character, conditions }));
      },

      remplacerPersonnage: (character) => set(recalcule(character)),
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Le schéma est versionné : les migrations futures passeront par `migrate`
      migrate: (persisted, version) => {
        // RÈGLES: à compléter — première migration au prochain breaking change du schéma
        return persisted as CharacterStore;
      },
      partialize: (state) => ({ character: state.character }) as unknown as CharacterStore,
      merge: (persisted, current) => {
        // Ne restaure que le personnage ; les dérivées sont recalculées au merge
        const perso = (persisted as Partial<CharacterStore>).character ?? current.character;
        return { ...current, ...recalcule(perso) };
      },
    },
  ),
);
