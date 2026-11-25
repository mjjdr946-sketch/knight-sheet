import { test, expect } from '@playwright/test';

/**
 * HOTFIX 2-bis — test E2E NAVIGATEUR RÉEL du scénario de recette prod
 * (exigence vibe-coder : les tests unitaires ne couvraient pas ce chemin).
 *
 * Parcours : compte → wizard 10 étapes → « 🔒 Sceller et jouer » →
 * fiche visible dans GET /api/chevaliers?accountId=… (et après reload).
 */

const COMPTE = `e2e-vesper-${Date.now()}`;
const NOM = 'Dame Vesper E2E';

test('recette fidèle v21 : F5 au milieu du wizard → reprise du brouillon → scellement → fiche porte le nom', async ({ page }) => {
  // §1.4 (prompt v21) : un E2E SANS rechargement ne couvre pas le scénario réel.
  const COMPTE_RELOAD = `e2e-reload-${Date.now()}`;
  const NOM_RELOAD = 'Vesper Recharge E2E';

  // création de compte
  await page.goto('/quijoue');
  await page.getByRole('button', { name: '+ Créer un nouveau compte' }).click();
  await page.locator('input').first().fill(COMPTE_RELOAD);
  await page.getByRole('button', { name: 'Créer', exact: true }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/quijoue'), { timeout: 60_000 });
  await page.getByRole('button', { name: /Créer mon premier chevalier/ }).click();

  // wizard : démarrer, taper le nom PARTIELLEMENT…
  await page.getByRole('button', { name: 'Démarrer la création' }).click();
  const champNom = page.locator('input').first();
  await champNom.click(); // focus
  await champNom.pressSequentially('Vesper Recharge'); // FRAPPE CLAVIER réelle (mises en garde §1)

  // …RECHARGER la page au milieu de la saisie (scénario réseau mobile réel)
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  // le brouillon persisté doit être repris — étape 1 restaurée, nom prérempli
  await expect(page.locator('input').first()).toHaveValue('Vesper Recharge', { timeout: 30_000 });

  // compléter le nom, avancer jusqu'à l'étape 10, sceller
  await page.locator('input').first().click();
  await page.locator('input').first().pressSequentially(' E2E'); // complète au clavier
  for (let i = 0; i < 9; i++) {
    await page.getByRole('button', { name: 'Étape suivante' }).click();
  }
  await page.getByRole('button', { name: /Sceller et jouer/ }).click();
  await page.waitForURL((u) => u.pathname === '/', { timeout: 30_000 });

  // la fiche en base porte le NOM COMPLET
  const comptes = await (await page.request.get('/api/comptes')).json() as { comptes: { id: string; nom: string }[] };
  const compte = comptes.comptes.find((c) => c.nom === COMPTE_RELOAD);
  expect(compte).toBeTruthy();
  const fiches = await (await page.request.get(`/api/chevaliers?accountId=${compte!.id}`)).json() as { fiches: { nom: string }[] };
  expect(fiches.fiches.find((f) => f.nom === NOM_RELOAD), 'la fiche porte le nom saisi AVANT le reload').toBeTruthy();
});

test('hotfix 3 : nom saisi en RETOUR ARRIÈRE (étape 10 → étape 1) → scellement → fiche au bon nom', async ({ page }) => {
  // scénario exact de la recette vibe-coder : le parcours est fait SANS nom,
  // puis retour à l'étape 1 pour saisir le nom, puis scellement.
  const COMPTE_BACK = `e2e-back-${Date.now()}`;
  const NOM_BACK = 'Aldric de Virelay';

  await page.goto('/quijoue');
  await page.getByRole('button', { name: '+ Créer un nouveau compte' }).click();
  await page.locator('input').first().fill(COMPTE_BACK);
  await page.getByRole('button', { name: 'Créer', exact: true }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/quijoue'), { timeout: 60_000 });
  await page.getByRole('button', { name: /Créer mon premier chevalier/ }).click();
  await page.getByRole('button', { name: 'Démarrer la création' }).click();
  // avancer jusqu'à l'étape 10 SANS nom
  for (let i = 0; i < 9; i++) {
    await page.getByRole('button', { name: 'Étape suivante' }).click();
  }
  // retour arrière jusqu'à l'étape 1 (bouton de navigation du wizard, PAS « ← Accueil »)
  const boutonBack = page.getByRole('button', { name: '←', exact: true });
  for (let i = 0; i < 9; i++) {
    await boutonBack.click();
  }
  // saisie RÉELLE du nom (clavier, pas d'event dispatché programmatique)
  const champNom = page.locator('input').first();
  await champNom.click();
  await champNom.pressSequentially(NOM_BACK); // frappe clavier réelle
  // le store est câblé : la valeur tapée est dans le champ (contrôlé)
  await expect(champNom).toHaveValue(NOM_BACK);
  // avancer jusqu'à l'étape 10 et sceller
  for (let i = 0; i < 9; i++) {
    await page.getByRole('button', { name: 'Étape suivante' }).click();
  }
  await page.getByRole('button', { name: /Sceller et jouer/ }).click();
  await page.waitForURL((u) => u.pathname === '/', { timeout: 30_000 });

  // la fiche serveur porte le nom saisi en retour arrière
  const comptes = await (await page.request.get('/api/comptes')).json() as { comptes: { id: string; nom: string }[] };
  const compte = comptes.comptes.find((c) => c.nom === COMPTE_BACK);
  expect(compte).toBeTruthy();
  const fiches = await (await page.request.get(`/api/chevaliers?accountId=${compte!.id}`)).json() as { fiches: { nom: string }[] };
  expect(fiches.fiches.find((f) => f.nom === NOM_BACK), 'nom saisi en retour arrière persisté').toBeTruthy();
});

test('IT. 22 §7 : XP → achat → Équiper → l’arme apparaît dans Combat → attaque', async ({ page }) => {
  // scénario fidèle du micro-hotfix : la fiche scellée reçoit des XP (action
  // de jeu active), PUIS achète et équipe — le KO initial venait de l'achat
  // avec gloire 0 (refus silencieux du test, pas du câblage).
  await page.goto('/quijoue');
  await page.getByRole('button', { name: '+ Créer un nouveau compte' }).click();
  await page.locator('input').first().fill(`e2e-achat-${Date.now()}`);
  await page.getByRole('button', { name: 'Créer', exact: true }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/quijoue'), { timeout: 60_000 });
  await page.getByRole('button', { name: /Créer mon premier chevalier/ }).click();
  await page.getByRole('button', { name: 'Démarrer la création' }).click();
  await page.locator('input').first().click();
  await page.locator('input').first().pressSequentially('Acheteur E2E');
  for (let i = 0; i < 9; i++) {
    await page.getByRole('button', { name: 'Étape suivante' }).click();
  }
  await page.getByRole('button', { name: /Sceller et jouer/ }).click();
  await page.waitForURL((u) => u.pathname === '/', { timeout: 30_000 });

  // Feuille : +15 PG (l'input XP par défaut est 10 → taper 15)
  await page.goto('/personnage/feuille');
  // l'alert() natif de la Feuille bloque le test — l'accepter automatiquement
  page.on('dialog', (dialog) => dialog.accept());
  const inputXP = page.locator('input[type=number]').first();
  await inputXP.fill('15');
  await page.getByRole('button', { name: 'Ajouter des XP' }).click();
  // la gloire passe à 15 (les XP sont persistés via la sync)
  await page.getByText('15 PG').first().waitFor({ state: 'visible', timeout: 30_000 });

  // Équipement : acheter le Couteau de combat (15 PG) → gloire 0
  await page.goto('/personnage/equipement');
  await page.getByRole('button', { name: /Catalogue d'armes/ }).click();
  await page.getByRole('button', { name: /Acheter 15 PG/ }).first().click();

  // Équiper l'INSTANCE de l'inventaire (le correctif id réel)
  await page.getByRole('button', { name: 'Équiper' }).first().click();
  await expect(page.getByText('équipée').first()).toBeVisible();

  // Combat : l'arme équipée apparaît
  await page.goto('/personnage/combat');
  await expect(page.getByText('Acheteur E2E').first()).toBeVisible();

  // GET la fiche serveur : l'arme est équipée
  const comptes = await (await page.request.get('/api/comptes')).json() as { comptes: { id: string; nom: string }[] };
  const compte = comptes.comptes.find((c) => c.nom.startsWith('e2e-achat-'));
  const fiches = await (await page.request.get(`/api/chevaliers?accountId=${compte!.id}`)).json() as { fiches: { nom: string; armes: { equipee: boolean }[] }[] };
  expect(fiches.fiches[0]!.armes.some((a) => a.equipee)).toBeTruthy();
});

test('recette complète : création de compte → wizard → scellement → fiche dans l’API', async ({ page }) => {
  // ── 1. Sas (accès libre en dev sans SHEET_PASSWORD) → « Qui joue ? »
  await page.goto('/quijoue');
  await page.getByRole('button', { name: '+ Créer un nouveau compte' }).click();
  await page.locator('input').first().fill(COMPTE);
  await page.getByRole('button', { name: 'Créer', exact: true }).click();

  // ── 2. Redirection vers l'accueil (état vide) → wizard
  await page.waitForURL((u) => !u.pathname.startsWith('/quijoue'), { timeout: 60_000 });
  await page.getByRole('button', { name: /Créer mon premier chevalier/ }).click();
  await page.waitForURL(/\/personnage\/creation/);

  // ── 3. Wizard : Démarrer → nom → 9 × « Étape suivante »
  await page.getByRole('button', { name: 'Démarrer la création' }).click();
  const champNom = page.locator('input').first();
  await champNom.click();
  await champNom.pressSequentially(NOM); // frappe clavier réelle
  for (let i = 0; i < 9; i++) {
    await page.getByRole('button', { name: 'Étape suivante' }).click();
  }

  // ── 4. Scellement — la redirection n'a lieu QUE si le serveur confirme
  await page.getByRole('button', { name: /Sceller et jouer/ }).click();
  await page.waitForURL((u) => u.pathname === '/', { timeout: 30_000 });
  // AUCUN message d'erreur ne doit être visible (role="alert" vide = route announcer Next, ignoré)
  await expect(page.getByText(/Non sauvegardé|Erreur|Brouillon perdu|requis/)).toHaveCount(0);

  // ── 5. La fiche est dans l'API (compte → id via /api/comptes)
  const comptes = await (await page.request.get('/api/comptes')).json() as { comptes: { id: string; nom: string }[] };
  const compte = comptes.comptes.find((c) => c.nom === COMPTE);
  expect(compte, 'le compte E2E doit exister côté serveur').toBeTruthy();
  const fiches = await (await page.request.get(`/api/chevaliers?accountId=${compte!.id}`)).json() as { fiches: { nom: string; scelle?: boolean }[] };
  const fiche = fiches.fiches.find((f) => f.nom === NOM);
  expect(fiche, `la fiche « ${NOM} » doit être persistée côté serveur`).toBeTruthy();
  expect(fiche!.scelle).toBe(true);

  // ── 6. RELOAD : la fiche reste visible (persistée, pas seulement locale)
  await page.reload();
  await expect(page.getByText(NOM).first()).toBeVisible({ timeout: 30_000 });
});

test('it. 20 §3 : cycle ouvrir/fermer du panneau adversaire — le contenu se ré-affiche', async ({ page }) => {
  // compte + fiche
  await page.goto('/quijoue');
  await page.getByRole('button', { name: '+ Créer un nouveau compte' }).click();
  await page.locator('input').first().fill(`e2e-adv-${Date.now()}`);
  await page.getByRole('button', { name: 'Créer', exact: true }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/quijoue'), { timeout: 60_000 });
  await page.getByRole('button', { name: /Créer mon premier chevalier/ }).click();
  await page.getByRole('button', { name: 'Démarrer la création' }).click();
  await page.locator('input').first().click();
  await page.locator('input').first().pressSequentially('Cycle Adversaire');
  for (let i = 0; i < 9; i++) {
    await page.getByRole('button', { name: 'Étape suivante' }).click();
  }
  await page.getByRole('button', { name: /Sceller et jouer/ }).click();
  await page.waitForURL((u) => u.pathname === '/', { timeout: 30_000 });
  await page.goto('/personnage/combat');

  // cycle ouvrir → fermer → rouvrir
  await page.getByRole('button', { name: /Préparer l'adversaire/ }).click();
  await expect(page.getByRole('button', { name: 'Créer un adversaire' })).toBeVisible();
  await page.getByRole('button', { name: /Masquer l'adversaire/ }).click();
  await page.getByRole('button', { name: /Préparer l'adversaire/ }).click();
  // le contenu (Créer un adversaire / types) DOIT se ré-afficher
  await expect(page.getByRole('button', { name: 'Créer un adversaire' })).toBeVisible();
  // créer l'adversaire → le panneau passe en mode édition
  await page.getByRole('button', { name: 'Créer un adversaire' }).click();
  await expect(page.getByText('Adversaire', { exact: false }).first()).toBeVisible();
});
