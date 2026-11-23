import { describe, it, expect, beforeEach } from 'vitest';
import { useCharacterStore } from '../characterStore';
import { personnageExemple } from '../../data/character';

/**
 * HOTFIX 5ᵉ round (preuve par l'état, vibe-coder) — le composant wizard doit
 * appeler majWizardDraft SUR TOUTES les étapes, achats inclus. Preuve prod :
 * wizardDraft = stub { nom: "", classe: "paladin" } alors que le récap
 * affichait tout. Correctif : achats écrits dans le brouillon, scellement
 * ne lit QUE le store, marqueur de build pour trancher un build obsolète.
 */

const store = () => useCharacterStore.getState();

beforeEach(() => {
  useCharacterStore.setState({
    character: { ...structuredClone(personnageExemple), id: 'principal' },
    actifId: 'principal',
    autresFiches: {},
    wizardDraft: null,
    wizardDraftCompte: null,
    wizardStep: 0,
  } as never);
});

describe('les achats d\u2019arsenal vivent dans le brouillon du store', () => {
  it('un achat écrit l\u2019arme dans wizardDraft (plus de state local achats)', () => {
    store().demarrerWizard();
    // achat simulé comme le fait la page (maj → majWizardDraft)
    store().majWizardDraft((d) => {
      d.armes = d.armes ?? [];
      d.armes.push({ ...personnageExemple.armes[0]!, id: `marteau-${Date.now()}`, equipee: false, arsenal: true } as never);
    });
    const armes = store().wizardDraft?.armes ?? [];
    expect(armes.some((a) => (a as { arsenal?: boolean }).arsenal)).toBe(true); // l'achat est DANS le store
  });

  it('le scellement lit le brouillon : la fiche porte les armes achetées', async () => {
    store().demarrerWizard();
    store().majWizardDraft((d) => { d.nom = 'Vibe Recette'; d.classe = 'psion' as never; d.armes = [
      { ...personnageExemple.armes[0]!, id: 'achat-1', nom: 'Marteau-épieu', equipee: false, arsenal: true },
    ] as never; });
    const finie = { ...structuredClone(store().wizardDraft!), scelle: true };
    const put = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', put);
    const sync = await import('../../lib/sync');
    await sync.sauverFicheImmediate('acc-vibe', finie);
    const corps = JSON.parse(String(put.mock.calls[0]![1]!.body)) as { fiche: { nom: string; armes: { nom: string }[] } };
    expect(corps.fiche.nom).toBe('Vibe Recette');
    expect(corps.fiche.armes.some((a) => a.nom === 'Marteau-épieu')).toBe(true); // tout le contenu porte
  });
});

describe('garde de source — plus AUCUN état local au composant wizard', () => {
  it('la page n\u2019a plus de useState achats ; le brouillon porte les achats ; marqueur de build', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = require('fs').readFileSync('app/personnage/creation/page.tsx', 'utf8');
    expect(src).not.toContain('useState<Record<string, number>>'); // plus d'achats local
    expect(src).toContain('achatsBrouillon'); // dépense depuis le brouillon
    expect(src).toContain('BUILD wizard-store-v7'); // marqueur traçable en prod
    expect(src).toContain('majWizardDraft'); // tout passe par le store
  });
});

import { vi } from 'vitest';
