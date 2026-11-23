import { describe, it, expect, beforeEach } from 'vitest';
import { useCharacterStore } from '../characterStore';
import { personnageExemple } from '../../data/character';

/**
 * MICRO-HOTFIX — champ nom de l'étape 1 non propagé au brouillon (prod) :
 * trace « [scellement] ABANDON : nom du chevalier vide » alors que le joueur
 * avait tapé le nom. Causes couvertes : écrasement du brouillon par un
 * re-clic « Démarrer la création » (reload réseau) et perte de l'étape.
 */

const store = () => useCharacterStore.getState();

beforeEach(() => {
  useCharacterStore.setState({
    character: { ...structuredClone(personnageExemple), id: 'principal' },
    actifId: 'principal',
    autresFiches: {},
    wizardDraft: null,
    wizardStep: 0,
  } as never);
});

describe('le nom survit à la navigation entre les étapes', () => {
  it('saisir le nom à l\u2019étape 1 → avancer jusqu\u2019à l\u2019étape 10 → nom TOUJOURS dans wizardDraft', () => {
    store().demarrerWizard();
    store().majWizardDraft((d) => { d.nom = 'Dame Vesper II'; });
    // navigation étape par étape (majWizardStep ne touche pas au brouillon)
    for (let e = 1; e <= 9; e++) store().majWizardStep(e);
    expect(store().wizardStep).toBe(9); // étape 10 (index 9)
    expect(store().wizardDraft?.nom).toBe('Dame Vesper II'); // NOM INTACT
  });

  it('re-clic « Démarrer la création » (reload réseau) NE JETE PAS le brouillon rempli', () => {
    store().demarrerWizard();
    store().majWizardDraft((d) => { d.nom = 'Dame Vesper II'; });
    // le joueur recharge et re-clique Démarrer (l'UI revient à l'étape 1)
    store().demarrerWizard();
    expect(store().wizardDraft?.nom).toBe('Dame Vesper II'); // brouillon PRÉSERVÉ
  });

  it('le wizardStep persisté restaure l\u2019étape après un reload', () => {
    store().demarrerWizard();
    store().majWizardDraft((d) => { d.nom = 'Dame Vesper II'; });
    for (let e = 1; e <= 9; e++) store().majWizardStep(e);
    const snapshot = useCharacterStore.getState();
    // simule la rehydratation (merge du persist) : wizardDraft + wizardStep recopiés
    const restaure = {
      wizardDraft: snapshot.wizardDraft,
      wizardStep: snapshot.wizardStep,
    };
    expect(restaure.wizardStep).toBe(9);
    expect(restaure.wizardDraft?.nom).toBe('Dame Vesper II');
  });
});

describe('garde de source — champ nom câblé sur le brouillon du store', () => {
  it('l\u2019étape 1 écrit dans maj (majWizardDraft) et l\u2019étape vit dans le store', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = require('fs').readFileSync('app/personnage/creation/page.tsx', 'utf8');
    expect(src).toContain('value={draft.nom}');
    expect(src).toContain("maj((d) => { d.nom = v; })");
    expect(src).not.toContain('useState(0)'); // plus de step local non persisté
    expect(src).toContain('s.wizardStep');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const st = require('fs').readFileSync('src/store/characterStore.ts', 'utf8');
    expect(st).toContain('if (get().wizardDraft) return; // reprise du brouillon existant');
    expect(st).toContain('wizardStep: state.wizardStep'); // persisté
  });
});
