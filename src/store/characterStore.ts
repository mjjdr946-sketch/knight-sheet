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
import { effetsDeNiveau } from '../data/paliers-modules';
import { odDuType, coutTypeWarrior, coutImpulsion, coutGhost, coutLongbow, profilLongbow, coutVision, coutChangeling, coutBenedictionArmes, ATTAQUE_PLASMA, UTILITAIRE_PLASMA, ORIFLAMME, conditionImpulsion } from '../engine/capacites';
import { STYLE_CONDITION_ID, getStyle, styleVersCondition } from '../engine/combat';
import { appliquerBlessure, suiteAgonie } from '../engine/blessures';
import { appliquerTestEspoir, depenserHeroisme, type ResultatHeroisme, type UsageHeroisme } from '../engine/heroisme';
import { parseCoutPE, validerEquipement, validerSlotage } from '../engine/equipement';
import { personnageExemple } from '../data/character';
import { MODULES_INTERDITS_PALADIN, catalogueModules } from '../data/modules';
import { META_ARMURES } from '../data/meta-armures';
import { subirDegatsPNJ } from '../engine/pnj';
import type { Adversaire } from '../engine/pnj';
import type { ArmorModule, AspectId, Character, Condition, DerivedStats, TraitId } from '../types/character';

/** Version du schéma de persistance — à incrémenter à chaque breaking change */
export const SCHEMA_VERSION = 4;

/** Slots de personnages (prompt v6 §2) : plusieurs fiches sauvegardées */
export interface SlotsPersonnages {
  /** id de la fiche active — null = aucune fiche (it. 7) */
  actif: string | null;
  /** fiches par id */
  fiches: Record<string, Character>;
}

const SLOTS_INITIAUX: SlotsPersonnages = {
  actif: 'principal',
  fiches: { principal: personnageExemple },
};

/**
 * CORRECTIF it. 7 (bug 2 🔴) : la fiche scellée est en LECTURE SEULE d'édition.
 * Retourne true (et bloque) si l'action d'édition est interdite. Les jauges de
 * jeu (PS/PE/Espoir/Héroïsme), le combat et les jets RESTENT actifs.
 */
function editionBloquee(s: { character: Character }): boolean {
  return s.character.scelle === true;
}

/** Fiche vierge pour l'état « aucune fiche » (it. 7, bug 4) — ne crash jamais l'UI */
function ficheVierge(): Character {
  return { ...structuredClone(personnageExemple), id: 'aucune', nom: '—', scelle: true };
}

/**
 * Table centralisée modèle de méta-armure → data-theme (DOCUMENT 3, règle 4).
 * Une seule source de vérité — utilisée par le script anti-flash et le layout.
 */
export const THEME_PAR_MODELE: Record<string, string> = {
  warrior: 'guerrier',
  warmaster: 'maitre-de-guerre',
  rogue: 'voleur',
  ranger: 'rodeur',
  bard: 'barde',
  wizard: 'sorcier',
  barbarian: 'barbare',
  priest: 'pretre',
  paladin: 'paladin',
  psion: 'psion',
  monk: 'monk',
  sorcerer: 'sorcerer',
};

/** Pose data-theme sur <html> (DOCUMENT 3 règle 4 — le store est la source).
 * Guard SSR : pas de DOM côté serveur. */
export function poserTheme(modele: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', THEME_PAR_MODELE[modele] ?? 'guerrier');
}

/** Couleur d'accent fixe par classe — pour l'accueil « Mes chevaliers »
 * (chaque carte porte la couleur d'accent de SA classe, DOCUMENT 3 règle 5). */
export const ACCENT_PAR_MODELE: Record<string, string> = {
  warrior: 'hsl(0 84% 58%)',          // Rouge & Acier
  paladin: 'hsl(45 93% 50%)',         // Or, Blanc & Bleu Sacré
  priest: 'hsl(190 95% 52%)',         // Bleu Céruléen
  ranger: 'hsl(142 75% 48%)',         // Vert Néon
  bard: 'hsl(295 95% 58%)',           // Magenta & Cyan
  barbarian: 'hsl(0 85% 50%)',        // Rouge Sang
  warmaster: 'hsl(35 100% 52%)',      // Ambre & Cuivre
  rogue: 'hsl(225 70% 62%)',          // Bleu Nuit & Argent
  wizard: 'hsl(265 85% 60%)',         // Indigo Arcanique
};

/** data-theme d'une fiche (avec repli Warrior = thème par défaut) */
export function themeDeFiche(fiche: Character): string {
  return THEME_PAR_MODELE[fiche.metaArmor.modele] ?? 'guerrier';
}

/** Entrée de l'historique des jets de la phase (prompt v5 livrable 5) */
export interface JetLog {
  id: number;
  /** horodatage ISO lisible */
  quand: string;
  arme: string;
  /** dés lancés (dérisés) */
  des: number[];
  total: number;
  seuil: number;
  touche: boolean;
  exploit: boolean;
  echecCritique: boolean;
  /** dégâts infligés si touche */
  degats?: number;
  /** jet libre (sans opposition — prompt v6 §1) */
  libre?: boolean;
  /** CORRECTIF it. 7 (bug 6) : jet contre adversaire en mode MJ — total et seuil
   * masqués dans l'historique (le MJ ne révèle pas défense/réaction, p.86) */
  masque?: boolean;
}

/** État de session de combat — persisté avec le personnage */
export interface CombatSession {
  /** opposition mémorisée du tour précédent (valeur MJ, prompt v5) */
  opposition: number;
  typeOpposition: 'contact' | 'tir';
  /** historique des jets de la phase */
  historique: JetLog[];
  /** tour courant de la phase (1-based) — Watchtower : 1er tir gratuit/tour */
  tour: number;
  /** tirs déjà effectués ce tour (Watchtower : le 1er est gratuit — FAQ p.455) */
  tirsCeTour: number;
  /** points de contact dépensés cette mission (p.95) */
  contactsDepenses: number;
}

const SESSION_VIDE: CombatSession = { opposition: 0, typeOpposition: 'contact', historique: [], tour: 1, tirsCeTour: 0, contactsDepenses: 0 };
export const STORAGE_KEY = 'knight-sheet-v1';

/** Cibles de jauge modifiables par l'UI */
export type JaugeCible = 'ps' | 'pa' | 'pe' | 'pes' | 'heroisme';

interface CharacterStore {
  /** Personnage courant — source de vérité unique */
  character: Character;
  /** Stats dérivées recalculées à chaque mutation (jamais calculées côté UI) */
  derived: DerivedStats;
  /** id de la fiche active (prompt v6 §2) — null = état « aucune fiche » (it. 7) */
  actifId: string | null;
  /** Fiches NON actives (l'active vit dans `character`) */
  autresFiches: Record<string, Character>;
  /** HOTFIX 2 (v19bis) : brouillon du wizard — vit DANS le store (persisté),
   * jamais dans un state local de composant (cause racine du bug prod). */
  wizardDraft: Character | null;
  /** MICRO-HOTFIX : étape courante du wizard (persistée) — le nom survit à la
   * navigation ET au rechargement de la page. */
  wizardStep: number;
  /** Démarre le wizard : brouillon NEUF dans le store */
  demarrerWizard: () => void;
  /** Met à jour le brouillon du wizard (chaque étape passe par ici) */
  majWizardDraft: (fn: (d: Character) => void) => void;
  /** MICRO-HOTFIX : mémorise l'étape du wizard (persistée, survit au F5) */
  majWizardStep: (etape: number) => void;
  /** Consomme le brouillon : fiche active = brouillon scellé 🔒 */
  confirmerScellement: (finie: Character) => void;
  /** Crée une nouvelle fiche (à partir du modèle d'exemple) */
  creerFiche: (nom: string) => string;
  /** Ajoute une fiche FINIE (wizard it. 6/7) sans toucher à l'active (bug 1) */
  ajouterFiche: (fiche: Character) => string;
  ajouterArme: (arme: Character['armes'][number]) => void;
  /** Achat catalogue (prompt v17 §2) : vérifie PG, débit, ajoute l'item */
  acheterArmeCatalogue: (modele: Character['armes'][number]) => { ok: boolean; message: string };
  acheterModuleCatalogue: (modele: Character['modules'][number]) => { ok: boolean; message: string };
  /** Duplique une fiche existante */
  dupliquerFiche: (id: string) => string | null;
  /** Supprime une fiche (la dernière restante est conservée) */
  supprimerFiche: (id: string) => void;
  /** Charge une fiche (l'active courante est sauvegardée au passage) */
  chargerFiche: (id: string) => void;
  /** Change de méta-armure (étape 7, p.129-131) — recalcul automatique via le moteur */
  changerArmure: (modele: string) => void;
  /** Adversaire courant du duel (prompt v7 §1) — null = saisie manuelle */
  adversaire: Adversaire | null;
  /** Crée/remplace l'adversaire */
  majAdversaire: (adv: Adversaire | null) => void;
  /** Applique les dégâts à l'adversaire via le moteur PNJ (retourne le résultat) */
  frapperAdversaire: (degats: number, options?: { violence?: number; ignoreCdf?: boolean; antiVehicule?: boolean }) => Adversaire | null;
  /** Session de combat : opposition mémorisée + historique des jets */
  combatSession: CombatSession;
  /** Mémorise l'opposition du tour (valeur MJ) — prompt v5 livrable 5 */
  memoriserOpposition: (opposition: number, type: 'contact' | 'tir') => void;
  /** Ajoute un jet à l'historique de la phase (max 20, FIFO) */
  journaliserJet: (log: Omit<JetLog, 'id' | 'quand'>) => void;
  /** Vide l'historique des jets (reset combat) */
  viderHistorique: () => void;
  /** Passe au tour suivant (Watchtower : 1er tir redevient gratuit — FAQ p.455) */
  passerAuTourSuivant: () => void;
  /** Bascule un favori générique (« type:id ») — prompt v6 §3, par personnage */
  basculerFavori: (id: string) => void;
  /**
   * Monte un module au niveau suivant (p.428 : niveaux précédents requis,
   * max 3). Refus si déjà au niveau 3 ou module sans niveaux.
   */
  monterNiveauModule: (id: string) => boolean;
  /** Pose un implant cybernétique (20 PG, −3 PEs total, max 6 — p.91) */
  poserImplant: (conditionId: string) => boolean;
  /** Thérapie de reconstruction (100 PG, p.91) : efface toutes les blessures */
  therapieReconstruction: () => boolean;
  /** Dépense des points de contact (p.95 : 1/2/3/4/6 selon le lieu) */
  depenserContacts: (points: number) => boolean;

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
  /** Déclare le style de combat (p.87-89) — un seul à la fois, déclaré avant l'initiative. */
  declarerStyle: (styleId: string) => void;
  /** Installe un module du catalogue (Camelot uniquement, p.130) : vérifie les slots */
  installerModule: (module: ArmorModule) => boolean;
  /** Désinstalle un module (Camelot uniquement) */
  desinstallerModule: (id: string) => void;
  /** Met à jour les champs textuels d'identité (haut fait, blason, serment…) */
  majIdentite: (maj: Partial<Character['identite']>) => void;
  /** Charge un personnage complet (import futur) */
  remplacerPersonnage: (character: Character) => void;
  sceller: () => void;
  deverrouiller: () => void;
  ajouterXP: (points: number, note?: string) => number[];
  /** Capacités de classe (prompt v10 §1) : débit PE + application via le moteur */
  activerTypeWarrior: (typeId: string, enConflit: boolean) => { ok: boolean; message: string };
  basculerGhost: (enConflit: boolean) => { ok: boolean; message: string };
  configurerLongbow: (armeId: string, cfg: Parameters<typeof coutLongbow>[0]) => { ok: boolean; message: string };
  utiliserImpulsion: (impulsionId: string, nbAllies: number, inclutPorteur: boolean) => { ok: boolean; message: string };
  utiliserCapacitePE: (coutPE: number, nom: string, note?: string) => { ok: boolean; message: string };
  reparerPA: (auContact: boolean, de?: () => number) => { ok: boolean; message: string };
  activerGoliath: (metres: number) => { ok: boolean; message: string };
  /** 2038 (PARTIE 7) : transition chevalier mort → Armure Sarcophage (p.21) */
  devenirNecromancer: () => { ok: boolean; message: string };
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
      actifId: 'principal',
      autresFiches: {},
      wizardDraft: null,
      wizardStep: 0,

      // ─── HOTFIX 2 (v19bis) : le brouillon du wizard vit dans le store ──
      demarrerWizard: () => {
        // MICRO-HOTFIX : NE PAS écraser un brouillon en cours (reload réseau au
        // milieu du wizard → retour étape 1 → re-clic « Démarrer » jetait le
        // brouillon rempli : nom vide au scellement, constaté en prod).
        if (get().wizardDraft) {
          // §0 traçage (prompt v21) : une reprise ne doit JAMAIS réinitialiser
          console.info('[wizard] demarrerWizard → REPRISE du brouillon existant (nom:', get().wizardDraft?.nom ?? '', ')');
          return;
        }
        console.info('[wizard] demarrerWizard → NOUVEAU brouillon (nom vide)');
        const base: Character = { ...structuredClone(personnageExemple), id: `fiche-${Date.now()}`, nom: '', scelle: false };
        base.favoris = [];
        base.xpJournal = [];
        // étape 1 (p.110) : reset des scores de base — aspects 2, caractéristiques 1
        (Object.keys(base.aspects) as AspectId[]).forEach((a) => { base.aspects[a] = 2; });
        (Object.keys(base.traits) as TraitId[]).forEach((tr) => { base.traits[tr] = 1; });
        base.conditions = [];
        set({ wizardDraft: base });
      },
      majWizardStep: (etape: number) => { set({ wizardStep: etape }); },
      majWizardDraft: (fn) => {
        const d = get().wizardDraft;
        if (!d) {
          // HOTFIX 2-bis : plus de perte silencieuse — trace l'abandon
          console.error('[wizard] majWizardDraft ignoré : wizardDraft est null (demarrerWizard non appelé ?)');
          return;
        }
        const copie = structuredClone(d);
        fn(copie);
        // §0 traçage (prompt v21) : chaque écriture du brouillon est traçée —
        // le log qui manque est celui qui révèle où le nom disparaît.
        console.info('[wizard] majWizardDraft → nom:', JSON.stringify(copie.nom), '| classe:', copie.classe);
        set({ wizardDraft: copie });
      },
      confirmerScellement: (finie) => {
        // §0 traçage (prompt v21) : le nom au moment exact du swap
        console.info('[wizard] confirmerScellement → fiche active =', finie.nom, '| brouillon consommé');
        // la fiche scellée DEVIENT l'active (invariant : l'ancienne neutre disparaît)
        set({ character: finie, derived: computeDerived(finie), wizardDraft: null });
      },

      // ─── Slots de personnages (prompt v6 §2) ──────────────────────────
      ajouterFiche: (fiche) => {
        const id = fiche.id && !get().autresFiches[fiche.id] ? fiche.id : `fiche-${Date.now()}`;
        useCharacterStore.setState((s) => ({ autresFiches: { ...s.autresFiches, [id]: { ...fiche, id } } }));
        return id;
      },

      /** Achat catalogue (prompt v17 §2) : PG disponibles → débit → inventaire → sync serveur */
      acheterArmeCatalogue: (modele) => {
        const { character } = get();
        if (character.gloire < modele.coutPG) return { ok: false, message: `Il te manque ${modele.coutPG - character.gloire} PG (p.414)` };
        const instance: Character['armes'][number] = { ...structuredClone(modele), id: `${modele.id}-${Date.now()}`, equipee: false };
        set(recalcule({ ...character, gloire: character.gloire - modele.coutPG, armes: [...character.armes, instance] }));
        return { ok: true, message: `${modele.nom} achetée (−${modele.coutPG} PG)` };
      },
      /** Achat module catalogue : débit + installation automatique sur slots libres (p.428) */
      acheterModuleCatalogue: (modele) => {
        const { character } = get();
        if (character.gloire < modele.coutPG) return { ok: false, message: `Il te manque ${modele.coutPG - character.gloire} PG (p.428)` };
        // réservation des slots : vérifier la place sur chaque zone demandée
        const occupe: Record<string, number> = {};
        for (const m of character.modules) for (const [zone, n] of Object.entries(m.slots)) occupe[zone] = (occupe[zone] ?? 0) + n;
        const capacite = character.metaArmor.slots;
        for (const [zone, n] of Object.entries(modele.slots)) {
          if ((occupe[zone] ?? 0) + (n as number) > (capacite[zone as keyof typeof capacite] ?? 0)) {
            return { ok: false, message: `Pas assez de slots libres : ${zone} (p.428)` };
          }
        }
        const instance: Character['modules'][number] = { ...structuredClone(modele), id: `${modele.id}-${Date.now()}`, etat: 'inactif' as const, niveau: 1 };
        set(recalcule({ ...character, gloire: character.gloire - modele.coutPG, modules: [...character.modules, instance] }));
        return { ok: true, message: `${modele.nom} installé (−${modele.coutPG} PG)` };
      },

      /** Ajoute une arme forgée/achetée (générateur prestige, prompt v13 §4) */
      ajouterArme: (arme) => {
        const { character } = get();
        set(recalcule({ ...character, armes: [...character.armes, arme] }));
      },

      creerFiche: (nom) => {
        const nomFinal = nom.trim() || 'Nouveau chevalier'; // it.10 §0.4 : pas de fiche anonyme
        const id = `fiche-${Date.now()}`;
        const nouvelle: Character = {
          ...structuredClone(personnageExemple),
          id,
          nom: nomFinal,
          favoris: [],
        };
        set((s) => ({ autresFiches: { ...s.autresFiches, [id]: nouvelle } }));
        return id;
      },

      dupliquerFiche: (id) => {
        const { character, actifId, autresFiches } = get();
        const source = id === actifId ? character : autresFiches[id];
        if (!source) return null;
        const nouveau = structuredClone(source);
        nouveau.id = `fiche-${Date.now()}`;
        nouveau.nom = `${source.nom} (copie)`;
        set((s) => ({ autresFiches: { ...s.autresFiches, [nouveau.id]: nouveau } }));
        return nouveau.id;
      },

      supprimerFiche: (id) => {
        const { actifId, autresFiches, character } = get();
        const reste = { ...autresFiches };
        if (id === actifId) {
          // CORRECTIF it. 7 (bug 4) : nouvelle active = première clé ≠ id supprimé ;
          // l'invariant garantit que la clé ≠ actifId, pas de TypeError choixDerivees.
          const nouvelleId = Object.keys(reste).find((k) => k !== id);
          if (!nouvelleId) {
            // état « aucune fiche » propre : fiche vierge, actifId null (prompt v9 §0.4)
            const vierge = ficheVierge();
            set({ character: vierge, derived: computeDerived(vierge), actifId: null, autresFiches: {} });
            return;
          }
          const nouvelleActive = reste[nouvelleId]!;
          delete reste[nouvelleId];
          set(recalcule(nouvelleActive));
          poserTheme(nouvelleActive.metaArmor.modele);
          useCharacterStore.setState({ actifId: nouvelleId, autresFiches: reste });
          return;
        }
        delete reste[id];
        void character;
        set({ autresFiches: reste });
      },

      chargerFiche: (id) => {
        const { actifId, autresFiches, character } = get();
        if (id === actifId) return; // actifId null : on peut charger (état « aucune fiche »)
        const cible = autresFiches[id];
        if (!cible) return;
        // INVARIANT (correctif it. 7, bug 4) : l'active n'est jamais dans le map.
        // Sauvegarde de l'active + retrait de la cible (qui devient active).
        const reste = { ...autresFiches };
        if (actifId !== null) reste[actifId] = character; // sauvegarde de l'active
        delete reste[id];
        set(recalcule(cible));
        poserTheme(cible.metaArmor.modele);
        useCharacterStore.setState({ actifId: id, autresFiches: reste });
      },

      changerArmure: (modele) => {
        // scellement (bug 2) : édition de feuille bloquée
        if (editionBloquee(get())) return;
        const { character } = get();
        const nouvelle = META_ARMURES[modele];
        if (!nouvelle) return;
        // Prompt v11 §4 : le changement RÉINITIALISE tout ce qui dépend de l'armure —
        // modules déséquipés, OD remplacées par les OD de base de la nouvelle,
        // capacités actives désactivées, jauges recalculées (PG/identité/xpJournal conservés).
        set(recalcule({
          ...character,
          metaArmor: structuredClone(nouvelle),
          modules: [], // modules déséquipés (slots propres à chaque armure, p.130)
          overdrives: nouvelle.overdrivesDeBase.map((o) => ({ trait: o.trait, niveau: o.niveau, origine: 'base' })),
          ghostActif: false, // capacités spécifiques désactivées (p.152)
          goliathMetres: 0, // Goliath reset (p.168)
        }));
        poserTheme(nouvelle.modele);
      },

      adversaire: null,

      majAdversaire: (adv) => set({ adversaire: adv }),

      frapperAdversaire: (degats, options) => {
        const adv = get().adversaire;
        if (!adv) return null;
        const r = subirDegatsPNJ(adv, degats, options);
        const nouveau: Adversaire = {
          ...adv,
          pa: r.pa,
          ps: r.ps,
          cohesion: r.cohesion,
        };
        // bande défaite / adversaire détruit : on garde la fiche (état visible)
        set({ adversaire: nouveau });
        return nouveau;
      },
      combatSession: SESSION_VIDE,

      memoriserOpposition: (opposition, typeOpposition) => {
        set((s) => ({ combatSession: { ...s.combatSession, opposition, typeOpposition } }));
      },

      journaliserJet: (log) => {
        set((s) => ({
          combatSession: {
            ...s.combatSession,
            historique: [
              { ...log, id: Date.now() + s.combatSession.historique.length, quand: new Date().toISOString() },
              ...s.combatSession.historique,
            ].slice(0, 20), // FIFO : les 20 derniers jets de la phase
          },
        }));
      },

      viderHistorique: () => {
        set((s) => ({ combatSession: { ...s.combatSession, historique: [] } }));
      },

      passerAuTourSuivant: () => {
        set((s) => ({
          combatSession: { ...s.combatSession, tour: s.combatSession.tour + 1, tirsCeTour: 0 },
        }));
      },

      basculerFavori: (id) => {
        const { character } = get();
        const favoris = new Set(character.favoris ?? []);
        if (favoris.has(id)) favoris.delete(id);
        else favoris.add(id);
        set(recalcule({ ...character, favoris: Array.from(favoris) }));
      },

      monterNiveauModule: (id) => {
        // scellement (bug 2) : édition de feuille bloquée
        if (editionBloquee(get())) return false;
        const { character } = get();
        const module = character.modules.find((m) => m.id === id);
        if (!module) return false;
        const niveauActuel = module.niveau ?? 1;
        // p.428 : niveaux 1→3, les niveaux précédents sont requis
        if (niveauActuel >= 3) return false;
        const nouveauNiveau = niveauActuel + 1;
        // Prompt v10 §3 : les Modifier des paliers s'ajoutent au cas par cas
        // (paliers-modules.ts). L'achat PG reste à l'arbitrage MJ (p.428).
        const modules = character.modules.map((m) =>
          m.id === id
            ? { ...m, niveau: nouveauNiveau, effets: effetsDeNiveau(m.id, nouveauNiveau, m.effets) }
            : m,
        );
        set(recalcule({ ...character, modules }));
        return true;
      },

      poserImplant: (conditionId) => {
        // scellement (bug 2) : édition de feuille bloquée
        if (editionBloquee(get())) return false;
        const { character } = get();
        // p.91 : 20 PG (pose entre missions), −3 PEs TOTAL par implant, max 6
        const implants = character.conditions.filter((c) => c.nom.startsWith('Implant cybernétique')).length;
        if (implants >= 6) return false;
        const cible = character.conditions.find((c) => c.id === conditionId);
        if (!cible) return false;
        // l'implant ignore les effets de la blessure → on retire la condition
        // et on pose l'implant (permanent, −3 PEs)
        const implant: Condition = {
          id: `implant-${Date.now()}`,
          nom: `Implant cybernétique ${implants + 1}`,
          categorie: 'autre',
          description: `Ignore les effets de « ${cible.nom} » (p.91)`,
          effets: [{ source: 'Implant cybernétique', target: 'pes', valeur: -3, type: 'malus' }],
          permanente: true,
        };
        const conditions = [
          ...character.conditions.filter((c) => c.id !== conditionId),
          implant,
        ];
        set(recalcule({ ...character, conditions }));
        return true;
      },

      therapieReconstruction: () => {
        // scellement (bug 2) : édition de feuille bloquée
        if (editionBloquee(get())) return false;
        const { character } = get();
        // p.91 : 100 PG (gloire dépensée par le MJ), 3 h — efface TOUTES les blessures
        const blessures = character.conditions.filter((c) => c.categorie === 'blessure');
        if (blessures.length === 0) return false;
        set(recalcule({
          ...character,
          conditions: character.conditions.filter((c) => c.categorie !== 'blessure'),
        }));
        return true;
      },

      depenserContacts: (points) => {
        const { character, derived, combatSession } = get();
        // p.95 : dépense par lieu (1/2/3/4/6) ; retour au max entre missions
        const disponibles = derived.contacts - combatSession.contactsDepenses;
        if (points > disponibles) return false;
        set({
          combatSession: { ...combatSession, contactsDepenses: combatSession.contactsDepenses + points },
        });
        void character;
        return true;
      },

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
        // scellement (bug 2) : édition de feuille bloquée (le déséquipement est permis — voir FAQ)
        if (equiper && editionBloquee(get())) return false;
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
        // scellement (bug 2) : édition de feuille bloquée
        if (editionBloquee(get())) return;
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
        // l'historique des jets de la phase est vidé + contacts au max (p.95)
        get().viderHistorique();
        useCharacterStore.setState((s) => ({
          combatSession: { ...s.combatSession, contactsDepenses: 0 },
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
        // OD Savoir niv 3 (prompt v10 §2, p.77+) : +1D6 aux SOINS
        const odSavoir = get().character.overdrives
          .filter((o) => o.trait === 'savoir')
          .reduce((a, o) => a + o.niveau, 0);
        const bonusSavoir = type === 'soin' && odSavoir >= 3 ? 1 + Math.floor(Math.random() * 6) : 0;
        const restaure = de1 + de2 + de3 + bonusSavoir;
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
        return restaure; // restaure inclut déjà le +1D6 de Savoir niv 3
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
        // scellement (bug 2) : édition de feuille bloquée
        if (editionBloquee(get())) return false;
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
        // scellement (bug 2) : édition de feuille bloquée
        if (editionBloquee(get())) return;
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
        // scellement (bug 2) : édition de feuille bloquée
        if (editionBloquee(get())) return;
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

      installerModule: (module) => {
        // scellement (bug 2) : édition de feuille bloquée
        if (editionBloquee(get())) return false;
        const { character } = get();
        // Modules interdits à la Paladin (« Lente et lourde », p.140)
        if (MODULES_INTERDITS_PALADIN.includes(module.id)) return false;
        // Slots libres requis sur chaque zone concernée (p.130)
        for (const [zone, requis] of Object.entries(module.slots)) {
          const pris = character.modules
            .filter((m) => m.etat === 'actif')
            .reduce((total, m) => total + ((m.slots as Record<string, number | undefined>)[zone] ?? 0), 0);
          const dispo = character.metaArmor.slots[zone as keyof Character['metaArmor']['slots']];
          if (pris + (requis ?? 0) > dispo) return false;
        }
        // pas d'installation en double
        if (character.modules.some((m) => m.id === module.id)) return false;
        set(recalcule({ ...character, modules: [...character.modules, { ...module, etat: 'inactif' }] }));
        return true;
      },

      desinstallerModule: (id) => {
        // scellement (bug 2) : édition de feuille bloquée
        if (editionBloquee(get())) return;
        const { character } = get();
        set(recalcule({ ...character, modules: character.modules.filter((m) => m.id !== id) }));
      },

      majIdentite: (maj) => {
        // scellement (bug 2) : édition de feuille bloquée
        if (editionBloquee(get())) return;
        const { character } = get();
        set(recalcule({ ...character, identite: { ...character.identite, ...maj } }));
      },

      /** SCELLEMENT (prompt v8) : passe la fiche en lecture seule d'édition */
      sceller: () => {
        set(recalcule({ ...get().character, scelle: true }));
      },
      deverrouiller: () => {
        set(recalcule({ ...get().character, scelle: false }));
      },
      /** XP (prompt v8) : gloire += points, journal, détection des paliers 150/200/250 */
      ajouterXP: (points, note = '') => {
        const character = get().character;
        const gloireAvant = character.gloire;
        const gloire = gloireAvant + points;
        const paliers = [150, 200, 250].filter((seuil) => gloireAvant < seuil && gloire >= seuil);
        useCharacterStore.setState((s) => ({
          character: {
            ...s.character,
            gloire,
            xpJournal: [
              ...(s.character.xpJournal ?? []),
              { quand: new Date().toISOString(), points, note, paliers },
            ],
          },
          derived: computeDerived({ ...s.character, gloire }),
        }));
        return paliers;
      },
      /** WARRIOR — Types (p.136) : 1 OD dans les 3 traits de l'aspect, HORS limite de 5 */
      activerTypeWarrior: (typeId, enConflit) => {
        const { character } = get();
        const cout = coutTypeWarrior(enConflit);
        if (character.jauges.pe.current < cout) return { ok: false, message: `Pas assez d'énergie (${cout} PE, p.136)` };
        // retirer les OD du type précédent puis poser les nouvelles
        const sansAnciennes = character.overdrives.filter((o) => (o as { origine?: string }).origine !== 'type-warrior');
        const nouvelles = odDuType(typeId);
        set(recalcule({
          ...character,
          overdrives: [...sansAnciennes, ...nouvelles.map((n) => ({ trait: n.trait, niveau: n.niveau, origine: 'type-warrior' }))],
          jauges: { ...character.jauges, pe: { ...character.jauges.pe, current: character.jauges.pe.current - cout } },
        }));
        return { ok: true, message: `Type activé (−${cout} PE) : +1 OD dans les 3 traits de l'aspect, hors limite de 5 (p.136)` };
      },
      /** ROGUE — Ghost (p.152) : 2 PE/tour (6 PE/minute hors conflit) */
      basculerGhost: (enConflit) => {
        const { character } = get();
        if (character.ghostActif) {
          set(recalcule({ ...character, ghostActif: false }));
          return { ok: true, message: 'Ghost désactivé (p.152)' };
        }
        const cout = coutGhost(enConflit);
        if (character.jauges.pe.current < cout) return { ok: false, message: `Pas assez d'énergie (${cout} PE, p.152)` };
        set(recalcule({ ...character, ghostActif: true, jauges: { ...character.jauges, pe: { ...character.jauges.pe, current: character.jauges.pe.current - cout } } }));
        return { ok: true, message: `Ghost activé (−${cout} PE) : +3 réussites pour passer inaperçu (p.152)` };
      },
      /** RANGER — Longbow (p.156) : configure le profil du tir, débit PE, modifie l'arme */
      configurerLongbow: (armeId, cfg) => {
        const { character } = get();
        const arme = character.armes.find((a) => a.id === armeId);
        if (!arme) return { ok: false, message: 'Longbow introuvable' };
        const cout = coutLongbow(cfg);
        if (character.jauges.pe.current < cout) return { ok: false, message: `Pas assez d'énergie (${cout} PE, p.156)` };
        const profil = profilLongbow(cfg);
        if (!profil.valide) return { ok: false, message: profil.erreur ?? 'Configuration invalide' };
        const portees = ['contact', 'courte', 'moyenne', 'longue', 'lointaine'] as const;
        const armes = character.armes.map((a) => a.id === armeId
          ? { ...a, degats: { ...a.degats, nombre: profil.degats }, violence: { ...a.violence, nombre: profil.violence }, portee: portees[profil.portee], effets: profil.effets }
          : a);
        set(recalcule({ ...character, armes, jauges: { ...character.jauges, pe: { ...character.jauges.pe, current: character.jauges.pe.current - cout } } }));
        return { ok: true, message: `Longbow : ${profil.degats}D6 / ${profil.violence}D6 (−${cout} PE, p.156)` };
      },
      /** WARMASTER — impulsions de Warlord sur SOI (p.148) : condition temporaire */
      utiliserImpulsion: (impulsionId, nbAllies, inclutPorteur) => {
        const { character } = get();
        const cout = coutImpulsion(impulsionId, nbAllies, inclutPorteur);
        if (cout > 0 && character.jauges.pe.current < cout) return { ok: false, message: `Pas assez d'énergie (${cout} PE, p.148)` };
        const cond = conditionImpulsion(impulsionId);
        if (!cond) return { ok: true, message: 'Impulsion ciblée alliés (résolu à la table, p.148)' };
        // ajouté comme condition temporaire (effets par cible — le moteur les lit)
        const condition = {
          id: `${cond.id}-${Date.now()}`,
          nom: cond.nom,
          categorie: 'autre' as const,
          description: cond.effets.map((e) => `${e.cible} ${e.valeur > 0 ? '+' : ''}${e.valeur}`).join(' · '),
          effets: cond.effets.map((e) => ({ source: cond.nom, target: e.cible as never, valeur: e.valeur, type: e.type as never })),
          permanente: false,
        };
        set(recalcule({
          ...character,
          conditions: [...character.conditions, condition],
          jauges: cout > 0 ? { ...character.jauges, pe: { ...character.jauges.pe, current: character.jauges.pe.current - cout } } : character.jauges,
        }));
        return { ok: true, message: `${cond.nom} appliquée (−${cout} PE, p.148)` };
      },
      /** Coût PE générique (Borealis bénédiction, Oriflamme, Vision, Changeling, nanoC…) */
      utiliserCapacitePE: (coutPE, nom, note) => {
        const { character } = get();
        if (character.jauges.pe.current < coutPE) return { ok: false, message: `Pas assez d'énergie (${coutPE} PE requis)` };
        set(recalcule({ ...character, jauges: { ...character.jauges, pe: { ...character.jauges.pe, current: character.jauges.pe.current - coutPE } } }));
        return { ok: true, message: `${nom} (−${coutPE} PE)${note ? ' — ' + note : ''}` };
      },

      /** Priest — Mode Mechanic (p.144) : restaure 3D6+6 (contact) ou 2D6+6 (distance) PA, coût 4/6 PE */
      reparerPA: (auContact: boolean, de: () => number = Math.random) => {
        const jauge = get().character.jauges.pe;
        const cout = auContact ? 4 : 6;
        if (jauge.current < cout) return { ok: false, message: `Pas assez d'énergie (${cout} PE requis, p.144)` };
        const dice = auContact ? 3 : 2;
        const pa = Array.from({ length: dice }, () => 1 + Math.floor(de() * 6)).reduce((a, b) => a + b, 0) + 6;
        useCharacterStore.setState((s) => ({
          character: {
            ...s.character,
            jauges: {
              ...s.character.jauges,
              pe: { ...s.character.jauges.pe, current: s.character.jauges.pe.current - cout },
              pa: { ...s.character.jauges.pa, current: Math.min(s.character.metaArmor.paTotal, s.character.jauges.pa.current + pa) },
            },
          },
        }));
        return { ok: true, message: `+${pa} PA restaurés (−${cout} PE, p.144)` };
      },
      /** Barbarian — Mode Goliath (p.168) : mètres gagnés, 2 PE/mètre */
      activerGoliath: (metres: number) => {
        const m = Math.max(0, Math.min(6, metres));
        const cout = m * 2;
        const jauge = get().character.jauges.pe;
        if (m > 0 && jauge.current < cout) return { ok: false, message: `Pas assez d'énergie (${cout} PE pour ${m} m, p.168)` };
        useCharacterStore.setState((s) => ({
          character: {
            ...s.character,
            goliathMetres: m,
            jauges: m > 0 ? { ...s.character.jauges, pe: { ...s.character.jauges.pe, current: s.character.jauges.pe.current - cout } } : s.character.jauges,
          },
          derived: computeDerived({ ...s.character, goliathMetres: m }),
        }));
        return { ok: true, message: m > 0 ? `Goliath ${m} m (−${cout} PE) — +${m} CdF, défense −${m}, réaction −${m * 2}, +${m}D6 contact` : 'Goliath désactivé' };
      },

      /** NECROMANCER — Armure Sarcophage (2038 pp.21-23) : garde anti-double-transition.
       * Conserve nom/PG/XP/armes ; perd ancienne armure + capacités + OD ;
       * applique la dotation de modules gratuits selon les PG (coût PG ignoré). */
      devenirNecromancer: () => {
        const { character } = get();
        if (character.metaArmor.modele === 'necromancer') return { ok: false, message: 'Transition déjà effectuée — jamais deux fois (2038 p.21)' };
        const pg = character.gloire;
        const dotation: string[] = pg < 50 ? ['fumigene']
          : pg < 100 ? ['fumigene', 'flash']
          : pg < 150 ? ['fumigene', 'flash', 'grappin']
          : pg < 200 ? ['fumigene', 'flash', 'grappin', 'dard', 'attaque-sur-casque']
          : pg < 250 ? ['fumigene', 'flash', 'grappin', 'dard', 'attaque-sur-casque', 'lame-de-bras']
          : pg < 300 ? ['fumigene', 'flash', 'grappin', 'dard', 'attaque-sur-casque', 'lame-de-bras', 'relais-taccom']
          : ['fumigene', 'flash', 'grappin', 'dard', 'attaque-sur-casque', 'lame-de-bras', 'relais-taccom', 'blindage-drone'];
        // modules standards gratuits du catalogue (coût PG ignoré, p.21)
        const modules = dotation.map((id) => catalogueModules.find((m) => m.id === id)).filter(Boolean) as Character['modules'];
        const necro = META_ARMURES['necromancer'];
        if (!necro) return { ok: false, message: 'Necromancer absente des données' };
        set(recalcule({
          ...character,
          metaArmor: structuredClone(necro),
          modules,
          overdrives: [], // les 4 OD libres « Plus fort que la chair » restent à répartir au MJ (p.21)
          ghostActif: false,
          goliathMetres: 0,
        }));
        poserTheme('necromancer');
        return { ok: true, message: `Sarcophage investie — ${modules.length} modules gratuits (PG ${pg}, 2038 p.21)` };
      },

      remplacerPersonnage: (character) => {
        set(recalcule(character));
        poserTheme(character.metaArmor.modele);
      },
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Le schéma est versionné : les migrations futures passeront par `migrate`
      migrate: (persisted, version) => {
        // Migration → v4 : slots de personnages. v3 (character seul) →
        // l'active devient la fiche « principal » ; les v4 gardent leurs fiches.
        const p = persisted as Partial<CharacterStore>;
        const perso = p?.character;
        if (!perso) return persisted as CharacterStore;
        const normalise: Character = {
          ...personnageExemple,
          ...perso,
          agonieCoups: perso.agonieCoups ?? 0,
          favoris: perso.favoris ?? [],
          overdrives: perso.overdrives ?? [],
          conditions: perso.conditions ?? [],
          armes: (perso.armes ?? []).map((a) => ({ ...a, equipee: a.equipee === true })),
        };
        const autres = p.autresFiches ?? {};
        return {
          ...(persisted as CharacterStore),
          character: normalise,
          actifId: p.actifId ?? 'principal',
          autresFiches: autres,
          combatSession: { ...SESSION_VIDE, ...(p?.combatSession ?? {}) },
        };
      },
      partialize: (state) =>
        ({
          character: state.character,
          combatSession: state.combatSession,
          actifId: state.actifId,
          autresFiches: state.autresFiches,
          adversaire: state.adversaire,
          wizardDraft: state.wizardDraft, // HOTFIX 2 : brouillon persisté (récupère sa place après un refresh)
          wizardStep: state.wizardStep, // MICRO-HOTFIX : étape persistée
        }) as unknown as CharacterStore,
      merge: (persisted, current) => {
        // Restaure personnage + fiches + session + adversaire ; dérivées recalculées
        const p = persisted as Partial<CharacterStore>;
        // §0 traçage (prompt v21) : ce que le persist réinjecte au rehydrate —
        // un merge écrasant le brouillon serait visible ici.
        console.info('[persist] merge — wizardDraft persisté:', p.wizardDraft ? JSON.stringify(p.wizardDraft.nom) : '∅', '| courant:', current.wizardDraft ? JSON.stringify(current.wizardDraft.nom) : '∅');
        const perso = p.character ?? current.character;
        const session: CombatSession = { ...SESSION_VIDE, ...(p.combatSession ?? {}) };
        return {
          ...current,
          ...recalcule(perso),
          combatSession: session,
          actifId: p.actifId ?? current.actifId,
          autresFiches: p.autresFiches ?? current.autresFiches,
          adversaire: p.adversaire ?? null,
          // ops : wizardDraft est écrit par partialize mais n'était PAS recopié ici :
          // le brouillon du wizard était jeté à chaque rehydratation (reload).
          wizardDraft: p.wizardDraft ?? current.wizardDraft,
          wizardStep: p.wizardStep ?? 0,
        };
      },
    },
  ),
);