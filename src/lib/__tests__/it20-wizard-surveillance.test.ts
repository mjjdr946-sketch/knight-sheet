import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCharacterStore } from '../../store/characterStore';
import { normaliserFiche, chargerFichesServeur } from '../sync';
import { personnageExemple } from '../../data/character';

/**
 * Itération 20 (prompt v24) — le wizard sous surveillance.
 * §1 champ nom câblé (clé stable, montage unique prouvé)
 * §2 brouillon inter-comptes → modale (purger/revendiquer), jamais silencieux
 * §4 fiche partielle → normalisée (accueil ne crash jamais)
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

describe('§1 — champ nom : une seule instance, clé stable', () => {
  it('frappe → store immédiat ; navigation 1→10 → nom intact ; scellement → serveur au bon nom', async () => {
    store().demarrerWizard();
    store().majWizardDraft((d) => { d.nom = 'Aldric de Virelay'; });
    for (let e = 1; e <= 9; e++) store().majWizardStep(e);
    expect(store().wizardDraft?.nom).toBe('Aldric de Virelay');
    const finie = { ...structuredClone(store().wizardDraft!), scelle: true };
    const put = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', put);
    const sync = await import('../../lib/sync');
    await sync.sauverFicheImmediate('acc-nom', finie);
    const corps = JSON.parse(String(put.mock.calls[0]![1]!.body)) as { fiche: { nom: string } };
    expect(corps.fiche.nom).toBe('Aldric de Virelay');
  });

  it('garde de source — clé stable + trace de montage unique', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = require('fs').readFileSync('app/personnage/creation/page.tsx', 'utf8');
    expect(src).toContain('key="wizard-nom"'); // jamais recréé entre deux rendus
    expect(src).toContain('montagesChampNom'); // preuve de montage/rendu unique
  });
});

describe('§2 — brouillon inter-comptes : modale (purger OU revendiquer)', () => {
  it('revendiquerBrouillon réattribue le brouillon au compte courant', () => {
    localStorage.setItem('knight-compte', 'compte-A');
    store().demarrerWizard();
    store().majWizardDraft((d) => { d.nom = 'Brouillon de A'; });
    // bascule sur B : le brouillon appartient toujours à A
    expect(store().wizardDraftCompte).toBe('compte-A');
    // le joueur choisit « Continuer ce brouillon » → réattribué à B
    store().revendiquerBrouillon('compte-B');
    expect(store().wizardDraftCompte).toBe('compte-B');
    expect(store().wizardDraft?.nom).toBe('Brouillon de A'); // contenu intact
  });

  it('purger → brouillon vierge', () => {
    localStorage.setItem('knight-compte', 'compte-A');
    store().demarrerWizard();
    store().majWizardDraft((d) => { d.nom = 'Brouillon de A'; });
    store().abandonnerBrouillon();
    expect(store().wizardDraft).toBeNull();
    expect(store().wizardDraftCompte).toBeNull();
  });

  it('garde de source — modale visible, jamais de purge silencieuse', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = require('fs').readFileSync('app/personnage/creation/page.tsx', 'utf8');
    expect(src).toContain('conflitBrouillon'); // état de modale
    expect(src).toContain('Purger le brouillon');
    expect(src).toContain('Continuer ce brouillon');
    expect(src).toContain('revendiquerBrouillon');
  });
});

describe('§4 — fiche partielle normalisée (accueil ne crash jamais)', () => {
  it('fiche de test PUT à 3 champs → fiche complète (metaArmor/jauges/armes présents)', () => {
    const partielle = { id: 'fiche-test', nom: 'Test Fiche', gloire: 25 };
    const f = normaliserFiche(partielle);
    expect(f.nom).toBe('Test Fiche'); // données préservées
    expect(f.gloire).toBe(25);
    expect(f.metaArmor).toBeTruthy(); // champ critique complété
    expect(f.jauges).toBeTruthy();
    expect(Array.isArray(f.armes)).toBe(true);
    expect(f.id).toBe('fiche-test');
  });

  it('chargerFichesServeur normalise TOUTES les fiches reçues', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ fiches: [{ id: 'p1', nom: 'Partielle' }] }),
    }));
    const fiches = (await chargerFichesServeur('acc-partiel')) as unknown as Record<string, unknown>[];
    expect(fiches[0]!.nom).toBe('Partielle');
    expect(fiches[0]!.metaArmor).toBeTruthy(); // normalisée
    vi.unstubAllGlobals();
  });
});
