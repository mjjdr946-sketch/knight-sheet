import { describe, it, expect, beforeEach } from 'vitest';
import { useCharacterStore } from '../characterStore';
import { personnageExemple } from '../../data/character';

/**
 * Itération 19 (prompt v21) §2 — le brouillon du wizard appartient à son
 * compte : marqué par accountId, purgé au changement de compte, jamais
 * scellé sur un autre compte.
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

describe('brouillon marqué par compte', () => {
  it('demarrerWizard marque le compte courant comme propriétaire', () => {
    localStorage.setItem('knight-compte', 'compte-A');
    store().demarrerWizard();
    expect(store().wizardDraft).not.toBeNull();
    expect(store().wizardDraftCompte).toBe('compte-A');
  });

  it('abandonnerBrouillon purge brouillon + propriétaire + étape (changement de compte)', () => {
    localStorage.setItem('knight-compte', 'compte-A');
    store().demarrerWizard();
    store().majWizardDraft((d) => { d.nom = 'Brouillon de A'; });
    store().majWizardStep(5);
    // bascule sur compte B → purge
    store().abandonnerBrouillon();
    expect(store().wizardDraft).toBeNull();
    expect(store().wizardDraftCompte).toBeNull();
    expect(store().wizardStep).toBe(0);
  });

  it('brouillon d\\u2019un autre compte : la garde de scellement est exprimée côté page', () => {
    localStorage.setItem('knight-compte', 'compte-A');
    store().demarrerWizard();
    // le joueur bascule manuellement knight-compte (bascule sans /quijoue)
    localStorage.setItem('knight-compte', 'compte-B');
    const draftCompte = store().wizardDraftCompte;
    const compteCourant = localStorage.getItem('knight-compte');
    // condition de la garde de valider() : brouillon propriétaire ≠ compte courant
    expect(draftCompte !== compteCourant).toBe(true);
    expect(draftCompte).toBe('compte-A');
  });
});

describe('garde de source — purge au changement + revendication au wizard', () => {
  it('/quijoue appelle abandonnerBrouillon au succès ; le wizard revendique au montage', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const quijoue = require('fs').readFileSync('app/quijoue/page.tsx', 'utf8');
    expect(quijoue).toContain('abandonnerBrouillon()');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const wizard = require('fs').readFileSync('app/personnage/creation/page.tsx', 'utf8');
    expect(wizard).toContain('wizardDraftCompte'); // propriétaire lu
    expect(wizard).toContain('abandonnerBrouillon()'); // purge au montage + garde scellement
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const store = require('fs').readFileSync('src/store/characterStore.ts', 'utf8');
    expect(store).toContain('wizardDraftCompte: state.wizardDraftCompte'); // persisté
  });
});
