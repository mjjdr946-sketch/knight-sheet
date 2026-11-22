import { defineConfig } from '@playwright/test';

/**
 * Config Playwright (HOTFIX 2-bis, exigence vibe-coder) : test E2E navigateur
 * réel du parcours création → scellement → reload → fiche visible. Les tests
 * unitaires passaient (286) alors que la recette prod échouait — la brèche
 * est systématiquement entre le store et l'UI du wizard.
 *
 * Serveur : `next dev` sur le port 3855, DB SQLite temporaire isolée
 * (KNIGHT_DB_PATH), SANS SHEET_PASSWORD → accès libre (équivalent dev).
 * Lancer : PLAYWRIGHT_BROWSERS_PATH=… npx playwright test
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 180_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL: 'http://localhost:3855',
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
  },
  webServer: {
    command: 'npx next dev -p 3855',
    url: 'http://localhost:3855/api/comptes',
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      KNIGHT_DB_PATH: '/tmp/knight-e2e.db',
    },
  },
});
