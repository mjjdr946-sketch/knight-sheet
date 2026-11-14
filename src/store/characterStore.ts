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
import { appliquerBlessure, suiteAgonie } from '../engine/blessures';
import { appliquerTestEspoir, depenserHeroisme, type ResultatHeroisme, type UsageHeroisme } from '../engine/heroisme';
import { parseCoutPE, validerEquipement, validerSlotage } from '../engine/equipement';
import { personnageExemple } from '../data/character';
import { MODULES_INTERDITS_PALADIN } from '../data/modules';
import type { Character, Condition, DerivedStats } from '../types/character';

/** Version du schéma de persistance — à incrémenter à chaque breaking change */
export const SCHEMA_VERSION = 2;
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
   * (« Lente et lourde », p.140) et déduit le coût d'activation en PE
   * (coûts structurés, à 0 PE plus rien d'utilisable — p.130).
   */
  activerModule: (id: string, activer: boolean) => boolean;
  /** Active/désactive une capacité d'armure (Shrine, Watchtower) + coût PE */
  activerCapacite: (id: string, activer: boolean) => boolean;
  /** Équipe/retire une arme (validation multi-mains p.87/FAQ p.453) */
  equiperArme: (id: string, equiper: boolean) => boolean;
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
  /**
   * Tire une blessure aléatoire (dés 2D6 injectés) suite à une mise à
   * l'agonie — règle p.90 : 1re/2e fois = blessure, 3e = MORT.
   * Retourne {mort, nom} pour l'UI.
   */
  tirerBlessureAgonie: (deLigne: number, deColonne: number) => { mort: boolean; nom: string; description: string };
  /** Dépense un point d'héroïsme (usages p.96-97) ou 3 pour une carte du destin */
  utiliserHeroisme: (usage: UsageHeroisme) => ResultatHeroisme;
  /** Test d'espoir (p.96) : échec → −1D6 PEs (dés injectés) */
  testerEspoir: (reussi: boolean, de6: number) => { pes: number; perte: number };
  /**
   * Utilise un nod (annexe : 3D6 restaurés, 1 action de déplacement).
   * RÈGLES: à compléter — l'espacement d'1 h entre deux nods d'énergie et
   * l'abus (fuite −3D6 PE / explosion / réacteur 1 h) restent à l'arbitrage MJ.
   */
  utiliserNod: (type: 'soin' | 'armure' | 'energie', de1: number, de2: number, de3: number) => number;
  /** Déduit un coût PE PAR USAGE (ex. tir supplémentaire Watchtower 1 PE — FAQ p.455) */
  depenserPEUsage: (cout: number) => boolean;
  /** Paie la maintenance du Shrine pour un tour (1 PE, FAQ p.455) */
  payerMaintenanceShrine: () => boolean;
  /** Slote une arme de tir dans un bras (évolution 150 PG — p.140, FAQ p.455) */
  sloterArme: (armeId: string, bras: 'brasGauche' | 'brasDroit') => boolean;
  /** Retire une arme slotée de son bras (entre missions) */
  desloterArme: (armeId: string) => void;
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
 * Coût d'activation structuré — remplace le parsing naïf (voir engine/equipement).
 */
function coutActivationPE(coutPE?: string): number {
  return parseCoutPE(coutPE).activation;
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
          // p.130 : à 0 PE, plus aucun module ni OD utilisable
          if (cout > jauges.pe.current) return false;
          if (cout > 0) {
            jauges.pe = { current: jauges.pe.current - cout };
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
        const arme = character.armes.find((a) => a.id === id);
        if (!arme) return false;
        // Validation multi-mains (p.87, FAQ p.453) — le déséquiper est toujours permis
        if (equiper) {
          const armeModifiee = { ...arme, equipee: true };
          if (!validerEquipement(character, armeModifiee).ok) return false;
        }
        const armes = character.armes.map((a) =>
          a.id === id ? { ...a, equipee: equiper } : a,
        );
        set(recalcule({ ...character, armes }));
        return true;
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
          agonieCoups: 0, // compteur d'agonie remis à zéro
          jauges,
        }));
      },

      tirerBlessureAgonie: (deLigne, deColonne) => {
        const { character } = get();
        // p.90 : compteur de coups à 0 PS ; 1re/2e = blessure, 3e = mort
        const coups = (character.agonieCoups ?? 0) + 1;
        const issue = suiteAgonie(coups);
        if (issue === 'mort') {
          set(recalcule({ ...character, agonieCoups: coups }));
          return { mort: true, nom: 'Mort', description: 'Troisième mise à l’agonie (p.90)' };
        }
        const r = appliquerBlessure(deLigne, deColonne);
        if (r.condition) {
          set(recalcule({ ...character, agonieCoups: coups, conditions: [...character.conditions, r.condition] }));
        } else {
          set(recalcule({ ...character, agonieCoups: coups }));
        }
        return { mort: r.mort, nom: r.nom, description: r.description };
      },

      utiliserHeroisme: (usage) => {
        const { character } = get();
        const r = depenserHeroisme(character, usage);
        if (!r.ok) return r;
        const jauges = { ...character.jauges };
        jauges.heroisme = { current: r.heroisme };
        if (r.ps !== undefined) jauges.ps = { current: r.ps };
        if (r.pes !== undefined) jauges.pes = { current: r.pes };
        // Remise à zéro du compteur d'agonie quand la mise à l'agonie est ignorée
        const agonieCoups = r.ps !== undefined ? 0 : character.agonieCoups;
        set(recalcule({ ...character, jauges, agonieCoups }));
        return r;
      },

      testerEspoir: (reussi, de6) => {
        const { character } = get();
        const r = appliquerTestEspoir(character, reussi, de6);
        const jauges = { ...character.jauges, pes: { current: r.pes } };
        set(recalcule({ ...character, jauges }));
        return r;
      },

      utiliserNod: (type, de1, de2, de3) => {
        // Nods (annexe) : 3D6 restaurés ; 1 action de déplacement ; sur soi ou autrui
        const restaure = de1 + de2 + de3;
        const { character, derived } = get();
        const jauges = { ...character.jauges };
        if (type === 'soin') {
          jauges.ps = { current: Math.min(derived.ps.max, jauges.ps.current + restaure) };
        } else if (type === 'armure') {
          jauges.pa = { current: Math.min(derived.pa.max, jauges.pa.current + restaure) };
        } else {
          jauges.pe = { current: Math.min(derived.pe.max, jauges.pe.current + restaure) };
        }
        set(recalcule({ ...character, jauges }));
        return restaure;
      },

      depenserPEUsage: (cout) => {
        const { character } = get();
        const jauges = { ...character.jauges };
        // p.130 : à 0 PE, plus rien d'utilisable — refus si le coût dépasse le score
        if (cout > jauges.pe.current) return false;
        jauges.pe = { current: jauges.pe.current - cout };
        set(recalcule({ ...character, jauges }));
        return true;
      },

      payerMaintenanceShrine: () => {
        // FAQ p.455 : le Shrine est maintenable en payant les PE chaque tour
        const shrine = get().character.metaArmor.capacites.find((c) => c.id === 'shrine');
        if (!shrine?.active) return false;
        return get().depenserPEUsage(1);
      },

      sloterArme: (armeId, bras) => {
        const { character } = get();
        const arme = character.armes.find((a) => a.id === armeId);
        if (!arme) return false;
        const v = validerSlotage(character, { ...arme, slotee: bras }, bras);
        if (!v.ok) return false;
        const armes = character.armes.map((a) =>
          a.id === armeId ? { ...a, slotee: bras } : a,
        );
        set(recalcule({ ...character, armes }));
        return true;
      },

      desloterArme: (armeId) => {
        const { character } = get();
        const armes = character.armes.map((a) =>
          a.id === armeId ? { ...a, slotee: undefined } : a,
        );
        set(recalcule({ ...character, armes }));
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
        // Migration v1 → v2 : normalisation du personnage (champs ajoutés it. 2)
        const perso = (persisted as Partial<CharacterStore>)?.character;
        if (!perso) return persisted as CharacterStore;
        const normalise: Character = {
          ...personnageExemple,
          ...perso,
          // champs nouveaux en v2 avec valeurs par défaut sûres
          agonieCoups: perso.agonieCoups ?? 0,
          overdrives: perso.overdrives ?? [],
          conditions: perso.conditions ?? [],
          armes: (perso.armes ?? []).map((a) => ({ ...a, equipee: a.equipee === true })),
        };
        return { ...(persisted as CharacterStore), character: normalise };
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
