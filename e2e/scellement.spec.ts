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
  await champNom.fill(NOM);
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
