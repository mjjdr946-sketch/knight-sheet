import { describe, it, expect, beforeEach } from 'vitest';
import { useCharacterStore } from '../characterStore';
import { personnageExemple } from '../../data/character';

/**
 * IT. 22 (KO testeur) — l'ÉQUIPEMENT d'une arme achetée est une ACTION DE
 * JEU, permise même sur fiche scellée (FAQ p.453, symétrie avec le
 * déséquipement). Avant : la garde editionBloquee renvoyait false
 * silencieusement → l'arme payée vivait « en limbe ».
 */

const store = () => useCharacterStore.getState();

beforeEach(() => {
  useCharacterStore.setState({
    character: { ...structuredClone(personnageExemple), id: 'principal', scelle: true },
    actifId: 'principal',
    autresFiches: {},
  } as never);
});

describe('l’équipement est une action de jeu (fiche scellée incluse)', () => {
  it('equiperArme sur fiche scellée → l’arme est équipée (le PUT suit)', () => {
    // l'arme achetée (instance de l'inventaire, equipee: false)
    useCharacterStore.setState({
      character: { ...store().character, armes: [{ ...personnageExemple.armes[0]!, id: 'couteau-1', nom: 'Couteau de combat', equipee: false }] },
    } as never);
    const ok = store().equiperArme('couteau-1', true);
    expect(ok).toBe(true);
    expect(store().character.armes.find((a) => a.id === 'couteau-1')!.equipee).toBe(true);
  });

  it('le déséquipement reste toujours permis (FAQ p.453)', () => {
    // une arme RÉELLE de l'inventaire du chevalier
    useCharacterStore.setState({
      character: { ...store().character, armes: [{ ...personnageExemple.armes[0]!, id: 'arme-1', equipee: true }] },
    } as never);
    const ok = store().equiperArme('arme-1', false);
    expect(ok).toBe(true);
  });
});
