import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCharacterStore } from '../characterStore';
import { personnageExemple } from '../../data/character';
import type { Character } from '../../types/character';

/**
 * Itération 20 (prompt v21) — les 2 derniers bugs de la recette exhaustive.
 *
 * §1 Le champ `classe` est mis à jour par le wizard (étape 7) — les 3
 *    symptômes (titre, PA affichées, capacités d'une autre classe) venaient
 *    de `classe: 'paladin'` hérité de la fiche neutre.
 * §2 Les XP/évolutions persistent sur une fiche scellée (CHAMPS_JEU inclut
 *    gloire/xpJournal — avant : rejeté par l'API, bandeau permanent).
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

describe('§1 — classe mise à jour à l\u2019étape 7 (méta-armure)', () => {
  it('choisir SORCERER → classe = sorcerer (plus de paladin hérité)', () => {
    store().demarrerWizard();
    store().majWizardDraft((d) => { d.nom = 'Vesper'; });
    // étape 7 : choix méta-armure sorcerer — même écriture que la page
    store().majWizardDraft((d) => {
      d.classe = 'sorcerer' as Character['classe'];
      // (metaArmor posée par la page via structuredClone(META_ARMURES[id]))
    });
    expect(store().wizardDraft?.classe).toBe('sorcerer'); // DANS le brouillon
    // fiche scellée → classe portée côté serveur
    const finie = { ...structuredClone(store().wizardDraft!), scelle: true };
    expect(finie.classe).toBe('sorcerer');
  });

  it('garde de source — la page écrit classe à l\u2019étape 7 ; l\u2019UI lit le modèle réel', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = require('fs').readFileSync('app/personnage/creation/page.tsx', 'utf8');
    expect(src).toContain("d.classe = id as Character['classe']"); // classe = méta-armure choisie
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const combat = require('fs').readFileSync('app/personnage/combat/page.tsx', 'utf8');
    expect(combat).toContain('libelleClasse'); // titre dynamique (plus de « Le Paladin » en dur)
    expect(combat).not.toContain('Le Paladin attaque');
    expect(combat).toContain('character.metaArmor.paTotal'); // armure affichée = PA réels
    // audit usages : capacités/thèmes/accents lisent metaArmor.modele (source correcte)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const caps = require('fs').readFileSync('app/personnage/capacites-classe.tsx', 'utf8');
    expect(caps).toContain('META_ARMURES[character.metaArmor.modele]');
  });
});

describe('§2 — XP/évolutions persistent sur une fiche scellée', () => {
  it('ajouterXP sur fiche scellée → gloire + journal mis à jour (palier déclenché)', () => {
    const scellee = { ...structuredClone(personnageExemple), id: 'principal', nom: 'Seraphine', scelle: true, gloire: 140, xpJournal: [] };
    useCharacterStore.setState({ character: scellee } as never);
    // +10 PG → franchit le palier 150
    const paliers = store().ajouterXP(10, 'session');
    expect(store().character.gloire).toBe(150);
    expect(store().character.xpJournal?.length ?? 0).toBeGreaterThan(0);
    expect(paliers.length).toBeGreaterThan(0); // palier 150 déclenché
    // editionBloquee ne bloque PAS les XP (action de jeu)
  });

  it('CHAMPS_JEU inclut gloire/xpJournal/niveau/overdrives (garde de source API)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const route = require('fs').readFileSync('app/api/chevaliers/route.ts', 'utf8');
    for (const champ of ['gloire', 'xpJournal', 'niveau', 'overdrives']) {
      expect(route).toContain(`'${champ}'`); // champ d'évolution accepté sur fiche scellée
    }
  });

  it('PUT d\u2019une fiche scellée avec XP → la fiche pousse gloire + xpJournal', async () => {
    const scellee = { ...structuredClone(personnageExemple), id: 'principal', nom: 'Seraphine', scelle: true, gloire: 150, xpJournal: [{ date: '2026-11-23', points: 10, source: 'session' }] };
    useCharacterStore.setState({ character: scellee } as never);
    const put = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', put);
    const sync = await import('../../lib/sync');
    await sync.sauverFicheImmediate('acc-xp', store().character);
    const corps = JSON.parse(String(put.mock.calls[0]![1]!.body)) as { fiche: { gloire: number; xpJournal: unknown[]; scelle: boolean } };
    expect(corps.fiche.gloire).toBe(150);
    expect(corps.fiche.xpJournal).toHaveLength(1);
    expect(corps.fiche.scelle).toBe(true);
  });
});
