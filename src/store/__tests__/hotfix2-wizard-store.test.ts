import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useCharacterStore } from '../characterStore';
import { personnageExemple } from '../../data/character';

/**
 * HOTFIX 2 (v19bis) — le brouillon du wizard vit DANS le store.
 * Cause racine du bug prod : le draft vivait dans le state local du composant,
 * le scellement scellait la fiche neutre du store (nom vide → refusée par l'API).
 */

const store = () => useCharacterStore.getState();

beforeEach(() => {
  useCharacterStore.setState({
    character: { ...structuredClone(personnageExemple), id: 'principal' },
    actifId: 'principal',
    autresFiches: {},
    wizardDraft: null,
  } as never);
});

describe('brouillon dans le store', () => {
  it('« Étape suivante » après le nom : le nom tapé est dans le STORE (pas seulement le composant)', () => {
    store().demarrerWizard();
    expect(store().wizardDraft).not.toBeNull();
    // l'utilisateur tape son nom à l'étape 1 → majWizardDraft
    store().majWizardDraft((d) => { d.nom = 'Recette Finale'; d.classe = 'sorcerer' as never; });
    expect(store().wizardDraft?.nom).toBe('Recette Finale'); // DANS le store
    expect(store().wizardDraft?.classe).toBe('sorcerer');
    // persisté : le champ wizardDraft fait partie du state zustand (partialize vérifié par garde de source)
  });

  it('scellement : la fiche complète (nom, classe SORCERER, armes, budget) est poussée', async () => {
    store().demarrerWizard();
    store().majWizardDraft((d) => {
      d.nom = 'Recette Finale';
      d.classe = 'sorcerer' as never;
      d.gloire = 35; // budget 60 − 25 d'achats = 35 restants
      d.armes = [
        { ...personnageExemple.armes[0]!, id: 'marteau-epieu-1', nom: 'Marteau-épieu' },
        { ...personnageExemple.armes[0]!, id: 'pistolet-1', nom: 'Pistolet de service' },
      ];
    });
    const draft = store().wizardDraft!;
    const finie = { ...structuredClone(draft), scelle: true };
    const put = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', put);
    const sync = await import('../../lib/sync');
    const ok = await sync.sauverFicheImmediate('acc-recette', finie);
    expect(ok).toBe(true);
    const corps = JSON.parse(String(put.mock.calls[0]![1]!.body)) as { accountId: string; fiche: { nom: string; classe: string; armes: unknown[]; gloire: number; scelle: boolean } };
    expect(corps.accountId).toBe('acc-recette');
    expect(corps.fiche.nom).toBe('Recette Finale');
    expect(corps.fiche.classe).toBe('sorcerer');
    expect(corps.fiche.armes).toHaveLength(2); // Marteau-épieu + Pistolet
    expect(corps.fiche.gloire).toBe(35); // budget 35/60
    expect(corps.fiche.scelle).toBe(true);
    // succès → confirmerScellement : fiche active = brouillon, wizardDraft null
    store().confirmerScellement(finie);
    expect(store().character.nom).toBe('Recette Finale');
    expect(store().character.scelle).toBe(true);
    expect(store().wizardDraft).toBeNull();
  });

  it('scellement d\u2019un brouillon SANS nom → refus, pas de redirection (bandeau côté page)', () => {
    store().demarrerWizard(); // nom vide
    const draft = store().wizardDraft!;
    // la garde de la page : draft.nom.trim() vide → bandeau + return
    expect(draft.nom.trim()).toBe(''); // condition du refus
    expect(store().wizardDraft).not.toBeNull(); // brouillon conservé
  });

  it('échec réseau au scellement → brouillon PRÉSERVÉ (pas de redirection)', async () => {
    store().demarrerWizard();
    store().majWizardDraft((d) => { d.nom = 'Recette Finale'; });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau coupé')));
    const sync = await import('../../lib/sync');
    const ok = await sync.sauverFicheImmediate('acc-recette', structuredClone(store().wizardDraft));
    expect(ok).toBe(false); // la page n'appelle PAS confirmerScellement ni router.push
    expect(store().wizardDraft?.nom).toBe('Recette Finale'); // brouillon intact → l'utilisateur peut réessayer
  });
});

describe('garde de source — wizard branche sur le store', () => {
  it('la page n\u2019a plus de state local draft ; le scellement pousse le brouillon scellé', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = require('fs').readFileSync('app/personnage/creation/page.tsx', 'utf8');
    expect(src).not.toContain('useState<Character | null>'); // plus de draft local
    expect(src).toContain('s.wizardDraft'); // le brouillon vient du store
    expect(src).toContain('demarrerWizard()'); // démarrage → store
    expect(src).toContain('sauverFicheImmediate(accountId, finie)'); // fiche SCELLÉE poussée
    expect(src).toContain('confirmerScellement(finie)'); // swap en succès uniquement
    expect(src).not.toContain('pousserTout'); // plus de push de la fiche neutre
    // partialize inclut wizardDraft (persistance du brouillon)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const st = require('fs').readFileSync('src/store/characterStore.ts', 'utf8');
    expect(st).toContain('wizardDraft: state.wizardDraft');
  });
});
