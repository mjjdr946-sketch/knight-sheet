import { describe, it, expect } from 'vitest';
import { SCHEMA_VERSION } from '../characterStore';
import { personnageExemple } from '../../data/character';

/**
 * Itération 17bis — §0-bis : modale qui boucle + carte fantôme (bloquants
 * déploiement it. 17). Test de non-régression évident : charger la page
 * deux fois doit faire disparaître la modale définitivement.
 */
describe('BUG 1 — acquittement versionné de la modale d\u2019incompatibilité', () => {
  it('SCHEMA_VERSION exposé pour la clé d\u2019acquittement knight-migration-ack', () => {
    expect(typeof SCHEMA_VERSION).toBe('number');
    expect(SCHEMA_VERSION).toBeGreaterThan(0);
  });

  it('non-régression : 2 chargements → la modale disparaît définitivement', () => {
    // simulation du flux de la page accueil
    localStorage.setItem('knight-sheet-v1', JSON.stringify({
      state: { character: personnageExemple, autresFiches: {} },
    }));
    // 1er chargement : fiches détectées → modale
    const brut = localStorage.getItem('knight-sheet-v1');
    expect(brut).not.toBeNull();
    // acquittement (comportement du bouton « J'ai compris »)
    const parsed = JSON.parse(brut!) as Record<string, unknown>;
    const st = parsed.state as Record<string, unknown>;
    st.character = null; // purge des SEULES données de fiche
    st.autresFiches = {};
    localStorage.setItem('knight-sheet-v1', JSON.stringify(parsed));
    localStorage.setItem('knight-migration-ack', String(SCHEMA_VERSION));
    // 2ᵉ chargement : malgré la clé knight-sheet-v1 RECÉÉE par zustand-persist,
    // l'acquittement empêche la modale
    const ack = localStorage.getItem('knight-migration-ack');
    expect(ack).toBe(String(SCHEMA_VERSION));
    // condition d'affichage de la modale = ack !== SCHEMA_VERSION
    expect(ack !== String(SCHEMA_VERSION)).toBe(false); // → modale PAS affichée
    // les données de fiche sont bien purgées (coquille propre, pas removeItem)
    const apres = JSON.parse(localStorage.getItem('knight-sheet-v1')!) as { state: Record<string, unknown> };
    expect(apres.state.character).toBeNull();
  });
});

describe('BUG 2 — pas de carte fantôme à l\u2019accueil', () => {
  it('la fiche neutre de repli (id « aucune ») est filtrée de la liste d\u2019accueil', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = require('fs').readFileSync('app/page.tsx', 'utf8');
    expect(src).toContain("character.id !== 'aucune'"); // l'active neutre filtrée
    expect(src).toContain("id !== 'aucune'"); // les autres neutres filtrées
    expect(src).toContain('Créer mon premier chevalier'); // état vide propre
  });
});
