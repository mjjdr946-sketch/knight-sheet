import { test, expect } from '@playwright/test';

/**
 * MICRO-HOTFIX (rendu réel) — en-tête factice sur compte sans chevalier :
 * page applicative + compte neuf → header ALLÉGÉ « Bienvenue… » SANS
 * jauges ; page applicative + fiche → header complet (nom, armure, jauges).
 * (Le header GaugeBar vit dans le layout /personnage — l'accueil n'en a pas.)
 */

test('compte sans fiche → page applicative avec header allégé sans jauges', async ({ page }) => {
  await page.goto('/quijoue');
  await page.getByRole('button', { name: '+ Créer un nouveau compte' }).click();
  await page.locator('input').first().fill(`e2e-header-${Date.now()}`);
  await page.getByRole('button', { name: 'Créer', exact: true }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/quijoue'), { timeout: 60_000 });

  // page applicative SANS fiche : header allégé, pas de nom/armure factice, pas de jauges
  await page.goto('/personnage/combat');
  await expect(page.getByText(/Bienvenue, .* — crée ton premier chevalier/)).toBeVisible();
  await expect(page.getByText('ÉCUYER')).toHaveCount(0); // pas de palier factice
  await expect(page.getByText('PS', { exact: true })).toHaveCount(0); // jauge PS absente
  // le lien vers l'assistant est proposé (pas sur la page wizard elle-même)
  await expect(page.getByRole('link', { name: /Créer mon premier chevalier/ })).toBeVisible();
});

test('compte avec fiche → page applicative avec header complet et jauges', async ({ page }) => {
  // compte + fiche créés via le wizard (parcours réel)
  await page.goto('/quijoue');
  await page.getByRole('button', { name: '+ Créer un nouveau compte' }).click();
  await page.locator('input').first().fill(`e2e-header-f-${Date.now()}`);
  await page.getByRole('button', { name: 'Créer', exact: true }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/quijoue'), { timeout: 60_000 });
  await page.getByRole('button', { name: /Créer mon premier chevalier/ }).click();
  await page.getByRole('button', { name: 'Démarrer la création' }).click();
  await page.locator('input').first().fill('Header Complet E2E');
  for (let i = 0; i < 9; i++) {
    await page.getByRole('button', { name: 'Étape suivante' }).click();
  }
  await page.getByRole('button', { name: /Sceller et jouer/ }).click();
  await page.waitForURL((u) => u.pathname === '/', { timeout: 30_000 });

  // page applicative avec fiche : header complet
  await page.goto('/personnage/combat');
  await expect(page.getByText('Header Complet E2E')).toBeVisible();
  await expect(page.getByText('PS', { exact: true })).toBeVisible();
  await expect(page.getByText('PA', { exact: true })).toBeVisible();
});

test('it. 20 §3 : GET retardé → « Chargement » affiché, JAMAIS « pas encore de chevalier » avant la réponse', async ({ page }) => {
  // créer un compte + une fiche (le compte AURA une fiche en base)
  await page.goto('/quijoue');
  await page.getByRole('button', { name: '+ Créer un nouveau compte' }).click();
  await page.locator('input').first().fill(`e2e-course-${Date.now()}`);
  await page.getByRole('button', { name: 'Créer', exact: true }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/quijoue'), { timeout: 60_000 });
  await page.getByRole('button', { name: /Créer mon premier chevalier/ }).click();
  await page.getByRole('button', { name: 'Démarrer la création' }).click();
  await page.locator('input').first().click();
  await page.locator('input').first().pressSequentially('Course Accueil');
  for (let i = 0; i < 9; i++) {
    await page.getByRole('button', { name: 'Étape suivante' }).click();
  }
  await page.getByRole('button', { name: /Sceller et jouer/ }).click();
  await page.waitForURL((u) => u.pathname === '/', { timeout: 30_000 });

  // retarder le prochain GET des fiches de 800 ms
  await page.route('**/api/chevaliers*', async (route) => {
    await new Promise((r) => setTimeout(r, 800));
    await route.continue();
  });
  await page.reload();
  // pendant le chargement : SPINNER, jamais l'état vide
  await expect(page.getByText('Chargement des chevaliers…')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText(/pas encore de chevalier/)).toHaveCount(0);
  // après la réponse : la fiche est affichée
  await expect(page.getByText('Course Accueil').first()).toBeVisible({ timeout: 10_000 });
});
