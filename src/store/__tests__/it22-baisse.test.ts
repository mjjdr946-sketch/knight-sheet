import { describe, it, expect, beforeEach } from 'vitest';
import { useCharacterStore } from '../characterStore';
import { personnageExemple } from '../../data/character';

/**
 * Itération 21/22 §4 — DIMINUTION avec REMBOURSEMENT (symétrie p.108) :
 * baisser un aspect rembourse 5 × valeur quittée ; baisser un trait
 * rembourse 2 × valeur quittée. Cohérence : l'aspect ne descend pas sous
 * ses caractéristiques liées.
 */

const store = () => useCharacterStore.getState();

beforeEach(() => {
  useCharacterStore.setState({
    character: { ...structuredClone(personnageExemple), id: 'principal', gloire: 30 },
    actifId: 'principal',
    autresFiches: {},
    wizardDraft: null,
    wizardDraftCompte: null,
    wizardStep: 0,
  } as never);
});

describe('baisse avec remboursement', () => {
  it('baisserAspect : rembourse 5 × valeur quittée et refuse sous les traits liés', () => {
    // Chair 4 ; Force liée à Chair = 3 → baisser Chair à 3 est REFUSÉ
    const r = store().baisserAspect('chair', 3);
    expect(r.ok).toBe(false);
    expect(r.message).toContain('d\u00e9passe');
    // Chair 5 → baisser à 4 rembourse 5 × 5 = 25
    useCharacterStore.setState({
      character: { ...structuredClone(personnageExemple), id: 'principal', gloire: 0, aspects: { ...personnageExemple.aspects, chair: 5 } },
    } as never);
    const r2 = store().baisserAspect('chair', 4);
    expect(r2.ok).toBe(true);
    expect(store().character.gloire).toBe(25); // remboursement intégral
    expect(store().character.aspects['chair']).toBe(4);
  });

  it('baisserTrait : rembourse 2 × valeur quittée', () => {
    // Force 3 (personnageExemple) → baisser à 2 rembourse 2 × 3 = 6
    const gloireAvant = store().character.gloire;
    const r = store().baisserTrait('force', 2);
    expect(r.ok).toBe(true);
    expect(store().character.gloire).toBe(gloireAvant + 6);
    expect(store().character.traits['force']).toBe(2);
  });


  it('garde de source — l’UI route montée/descente vers le store', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = require('fs').readFileSync('app/personnage/attributs/page.tsx', 'utf8');
    expect(src).toContain('baisserAspect(aspect.id, cible)');
    expect(src).toContain('baisserTrait(t.id, v)');
    expect(src).toContain('(rembourse'); // affichage du remboursement avant confirmation
  });
});
