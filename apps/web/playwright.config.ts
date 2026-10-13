import { defineConfig, devices } from '@playwright/test';

const port = 8787;
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;

/**
 * End-to-end flows from AGENTS.md section 11, run against the built Worker on a local D1 with
 * seed data. Prepare once with `pnpm e2e:prepare`, then `pnpm e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    locale: 'ar-SA',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // A system Chromium can be used where Playwright's download is not available.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : {},
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npx opennextjs-cloudflare populateCache local && npx wrangler dev --port ${port} --ip 127.0.0.1`,
        url: `${baseURL}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
