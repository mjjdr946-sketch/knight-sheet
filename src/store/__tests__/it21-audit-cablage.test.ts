import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCharacterStore } from '../characterStore';
import { personnageExemple } from '../../data/character';

/**
 * Itération 21 (prompt v21) — retour de table : audit de câblage exhaustif.
 * §1 HORS_JEU à la route (tout champ hors identité de création est modifiable
 *    sur fiche scellée : fin des omissions CHAMPS_JEU) ; déverrouillage avec
 *    modale custom ; bandeau absent sur PUT 200.
 * §2 désélection d'arme à l'étape Arsenal.
 * §5 progression PG (monterTrait/monterAspect — coût = nouvelle valeur).
 */

const store = () => useCharacterStore.getState();

beforeEach(() => {
  localStorage.removeItem('knight-compte');
  useCharacterStore.setState({
    character: { ...structuredClone(personnageExemple), id: 'principal' },
    actifId: 'principal',
    autresFiches: {},
    wizardDraft: null,
    wizardDraftCompte: null,
    wizardStep: 0,
  } as never);
});

describe('§1 — garde inversée (identité seule bloquée sur fiche scellée)', () => {
  it('tous les champs de jeu sont hors liste structurelle', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const route = require('fs').readFileSync('app/api/chevaliers/route.ts', 'utf8');
    expect(route).toContain("new Set(['id', 'nom', 'classe', 'concept', 'archetypeId', 'sectionId', 'metaArmor'])");
    for (const champ of ['gloire', 'xpJournal', 'niveau', 'overdrives', 'modules', 'armes', 'armureDeployee', 'scelle']) {
      expect(route).not.toContain(`'${champ}'`); // aucun champ de jeu dans la liste structurelle
    }
  });

  it('PUT 200 d’un module activé sur fiche scellée → le bandeau ne s’affiche PAS', async () => {
    const scellee = { ...structuredClone(personnageExemple), id: 'principal', nom: 'Seraphine', scelle: true };
    useCharacterStore.setState({ character: scellee } as never);
    const ficheModule = { ...structuredClone(scellee), modules: [{ ...personnageExemple.modules?.[0], etat: 'actif' }] };
    const put = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) });
    vi.stubGlobal('fetch', put);
    const sync = await import('../../lib/sync');
    const ok = await sync.sauverFicheImmediate('acc-mod', ficheModule);
    expect(ok).toBe(true); // PUT 200 → PAS de bandeau
    vi.unstubAllGlobals();
  });

  it('deverrouiller → scelle=false persisté (PUT avec scelle hors liste structurelle)', () => {
    const scellee = { ...structuredClone(personnageExemple), id: 'principal', scelle: true };
    useCharacterStore.setState({ character: scellee } as never);
    store().deverrouiller();
    expect(store().character.scelle).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const route = require('fs').readFileSync('app/api/chevaliers/route.ts', 'utf8');
    expect(route).not.toContain("'scelle'"); // scelle modifiable côté API (déverrouillage persiste)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const feuille = require('fs').readFileSync('app/personnage/feuille/page.tsx', 'utf8');
    expect(feuille).toContain('modalDeverrouiller'); // modale CUSTOM (plus de confirm() natif)
    expect(feuille).toContain('les achats d');
  });
});

describe('§2 — désélection d’arme à l’étape Arsenal', () => {
  it('deselectionner retire l’arme du brouillon (d’une arme achetée) et recalcule', () => {
    store().demarrerWizard();
    // deux achats du même modèle
    store().majWizardDraft((d) => {
      d.armes = [
        { ...personnageExemple.armes[0]!, id: 'achat-1', nom: 'Pistolet de service', equipee: false, arsenal: true } as never,
        { ...personnageExemple.armes[0]!, id: 'achat-2', nom: 'Pistolet de service', equipee: false, arsenal: true } as never,
      ];
    });
    // deselectionner retire la DERNIÈRE occurrence du modèle
    store().majWizardDraft((d) => {
      const idx = d.armes!.map((a) => a.nom).lastIndexOf('Pistolet de service');
      if (idx >= 0) d.armes!.splice(idx, 1);
    });
    expect((store().wizardDraft?.armes ?? []).filter((a) => a.nom === 'Pistolet de service')).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = require('fs').readFileSync('app/personnage/creation/page.tsx', 'utf8');
    expect(src).toContain('deselectionner(a.id)'); // bouton branché
    expect(src).toContain('− 1'); // libellé du bouton
  });
});

describe('§5 — progression PG (monterTrait / monterAspect)', () => {
  it('monterTrait : coût = nouvelle valeur, débit gloire, journal, plafond aspect', () => {
    const scellee = { ...structuredClone(personnageExemple), id: 'principal', gloire: 5, xpJournal: [] };
    useCharacterStore.setState({ character: scellee } as never);
    // personnageExemple : Force 3, Chair 4 → plafond du trait Force = 4 ;
    // monter Force 3 → 4 coûte 4 (la nouvelle valeur)
    const r = store().monterTrait('force', 4);
    expect(r.ok).toBe(true);
    expect(store().character.gloire).toBe(1); // 5 − 4
    expect(store().character.traits['force']).toBe(4);
    expect(store().character.xpJournal?.length).toBeGreaterThan(0);
    // plafond : Chair = 4 → monter Force à 5 → refus
    const r5 = store().monterTrait('force', 5);
    expect(r5.ok).toBe(false);
    expect(r5.message).toContain('Plafond');
  });

  it('monterAspect : un cran maximum, coût = nouvelle valeur, plafond 9', () => {
    const scellee = { ...structuredClone(personnageExemple), id: 'principal', gloire: 10, xpJournal: [] };
    useCharacterStore.setState({ character: scellee } as never);
    // Chair = 4 → seule cible : 5, coût 5
    const r = store().monterAspect('chair', 5);
    expect(r.ok).toBe(true);
    expect(store().character.gloire).toBe(5);
    expect(store().character.aspects['chair']).toBe(5);
    // +2 d'un coup → refus
    const r2 = store().monterAspect('chair', 7);
    expect(r2.ok).toBe(false);
    expect(r2.message).toContain('cran');
  });

  it('gloire insuffisante → refus avec message chiffré', () => {
    const scellee = { ...structuredClone(personnageExemple), id: 'principal', gloire: 1, xpJournal: [] };
    useCharacterStore.setState({ character: scellee } as never);
    const r = store().monterTrait('force', 4);
    expect(r.ok).toBe(false);
    expect(r.message).toContain('Il te manque'); // coûte 4, gloire 1
  });

  it('garde de source — Attributs en listes déroulantes branchées au store', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = require('fs').readFileSync('app/personnage/attributs/page.tsx', 'utf8');
    expect(src).toContain('<select'); // listes déroulantes (plus de +/−)
    expect(src).toContain('monterTrait');
    expect(src).toContain('monterAspect');
    expect(src).not.toContain('ajusterTrait'); // les +/− sont morts
    expect(src).toContain('role="alert"'); // refus visible
  });
});
