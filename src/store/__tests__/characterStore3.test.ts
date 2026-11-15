/**
 * Tests store itération 4 — favoris + slots de personnages (prompt v6).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useCharacterStore, SCHEMA_VERSION } from '../characterStore';
import { personnageExemple } from '../../data/character';
import { computeDerived } from '../../engine/stats';

beforeEach(() => {
  const character = structuredClone(personnageExemple);
  useCharacterStore.setState({
    character,
    derived: computeDerived(character),
    actifId: 'principal',
    autresFiches: {},
    combatSession: { opposition: 0, typeOpposition: 'contact', historique: [] },
  });
});

const S = () => useCharacterStore.getState();

describe('Favoris — prompt v6 §3', () => {
  it('bascule un favori : ajout puis retrait', () => {
    S().basculerFavori('arme:marteau-epieu');
    expect(S().character.favoris).toContain('arme:marteau-epieu');
    S().basculerFavori('arme:marteau-epieu');
    expect(S().character.favoris).not.toContain('arme:marteau-epieu');
  });

  it('les favoris sont par personnage (stockés dans Character)', () => {
    S().basculerFavori('style:agressif');
    expect(S().character.favoris).toEqual(['style:agressif']);
  });
});

describe('Slots de personnages — prompt v6 §2', () => {
  it('créer une fiche : ajoutée aux autres, pas active', () => {
    const id = S().creerFiche('Gauvain');
    expect(id).toBeTruthy();
    expect(S().autresFiches[id]?.nom).toBe('Gauvain');
    expect(S().actifId).toBe('principal');
    expect(S().character.nom).toBe('Seraphine « Ambre » Vasseur'); // inchangé
  });

  it('charger une fiche : sauvegarde l\u2019active et charge la cible', () => {
    const id = S().creerFiche('Gauvain');
    S().reglerJauge('ps', 5); // mutation de l'active
    S().chargerFiche(id);
    expect(S().actifId).toBe(id);
    expect(S().character.nom).toBe('Gauvain');
    // l'ancienne active a été sauvegardée avec ses jauges
    const ancienne = S().autresFiches['principal'];
    expect(ancienne?.jauges.ps.current).toBe(5);
  });

  it('dupliquer une fiche', () => {
    const id = S().creerFiche('Gauvain');
    const copie = S().dupliquerFiche(id);
    expect(copie).toBeTruthy();
    expect(S().autresFiches[copie!]?.nom).toBe('Gauvain (copie)');
  });

  it('supprimer une fiche non active', () => {
    const id = S().creerFiche('Gauvain');
    S().supprimerFiche(id);
    expect(S().autresFiches[id]).toBeUndefined();
  });

  it('supprimer la fiche active : bascule sur la première autre', () => {
    const id = S().creerFiche('Gauvain');
    S().supprimerFiche('principal');
    expect(S().actifId).toBe(id);
    expect(S().character.nom).toBe('Gauvain');
  });

  it('impossible de supprimer la dernière fiche', () => {
    S().supprimerFiche('principal');
    expect(S().actifId).toBe('principal');
    expect(S().character.nom).toBe('Seraphine « Ambre » Vasseur');
  });

  it('SCHEMA_VERSION = 4 (slots)', () => {
    expect(SCHEMA_VERSION).toBe(4);
  });
});
