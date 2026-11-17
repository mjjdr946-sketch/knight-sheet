import { describe, it, expect, beforeEach } from 'vitest';
import { useCharacterStore } from '../characterStore';
import { personnageExemple } from '../../data/character';
import { computeDerived } from '../../engine/stats';

/**
 * Itération 7 — TEST D'INTÉGRATION du parcours COMPLET (prompt v9, exigence
 * non négociable) : créer → jouer → sceller → déverrouiller → dupliquer →
 * supprimer. Un seul test, séquentiel, état réel du store.
 */

const S = () => useCharacterStore.getState();

describe('PARCOURS COMPLET — créer → jouer → sceller → déverrouiller → dupliquer → supprimer', () => {
  beforeEach(() => {
    const character = structuredClone(personnageExemple);
    useCharacterStore.setState({
      character,
      derived: computeDerived(character),
      actifId: character.id,
      autresFiches: {},
      combatSession: { opposition: 0, typeOpposition: 'contact', historique: [], tour: 1, tirsCeTour: 0, contactsDepenses: 0 },
    } as never);
  });

  it('parcours intégral sans crash et avec invariants respectés', () => {
    // ─── 1. CRÉER (wizard) : la fiche active d'origine reste intacte ────────
    const origineNom = S().character.nom;
    const nouvelle = { ...structuredClone(personnageExemple), id: 'fiche-parcours', nom: 'Lancelot du Lac', scelle: true };
    S().ajouterFiche(nouvelle);
    expect(S().autresFiches['fiche-parcours']!.nom).toBe('Lancelot du Lac');
    expect(S().character.nom).toBe(origineNom); // l'originale intacte

    // ─── 2. JOUER : charger la nouvelle fiche (l'ancienne est sauvegardée) ──
    S().chargerFiche('fiche-parcours');
    expect(S().actifId).toBe('fiche-parcours');
    expect(S().character.nom).toBe('Lancelot du Lac');
    // l'ancienne est bien revenue dans la liste
    expect(Object.keys(S().autresFiches).length).toBeGreaterThan(0); // l'ancienne est sauvée dans la liste
    expect(S().derived.ps).toBeDefined(); // dérivées recalculées

    // ─── 3. SCELLER : édition bloquée, jeu actif ────────────────────────────
    S().sceller();
    expect(S().character.scelle).toBe(true);
    const pe = S().character.jauges.pe.current;
    S().ajusterJauge('pe', -2); // jeu OK même scellé
    expect(S().character.jauges.pe.current).toBe(pe - 2);
    const cdfAvant = S().character.metaArmor.cdfTotal;
    S().changerArmure('wizard'); // édition BLOQUÉE
    expect(S().character.metaArmor.cdfTotal).toBe(cdfAvant);

    // ─── 4. DÉVERROUILLER : reliaison du verrou possible ────────────────────
    S().deverrouiller();
    expect(S().character.scelle).toBe(false);
    S().changerArmure('wizard'); // maintenant autorisé
    expect(S().character.metaArmor.modele).toBe('wizard');

    // ─── 5. DUPLIQUER : copie indépendante ─────────────────────────────────
    const copieId = S().dupliquerFiche(S().actifId!);
    expect(copieId).toBeTruthy();
    expect(S().autresFiches[copieId!]?.nom).toContain('(copie)');
    expect(S().autresFiches[copieId!]?.scelle).toBe(S().character.scelle);

    // ─── 6. SUPPRIMER : retour propre à une fiche restante ─────────────────
    S().supprimerFiche('fiche-parcours');
    expect(S().actifId).not.toBe('fiche-parcours');
    expect(S().autresFiches['fiche-parcours']).toBeUndefined();
    expect(S().character.choixDerivees).toBeDefined(); // jamais de TypeError

    // l'état final reste jouable
    expect(S().derived.ps.max).toBeGreaterThan(0);
  });
});
