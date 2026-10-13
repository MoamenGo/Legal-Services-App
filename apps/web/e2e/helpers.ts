import { expect, type BrowserContext, type Page } from '@playwright/test';

export type DataLayerEntry = Record<string, unknown>;

/** `window.dataLayer` as plain objects; gtag-style `arguments` entries become arrays. */
export const dataLayer = (page: Page) =>
  page.evaluate(() =>
    ((window as unknown as { dataLayer?: unknown[] }).dataLayer ?? []).map((entry) =>
      entry && typeof entry === 'object' && 'length' in entry
        ? Array.from(entry as ArrayLike<unknown>)
        : entry,
    ),
  );

export const events = async (page: Page, name: string) =>
  ((await dataLayer(page)) as DataLayerEntry[]).filter(
    (entry) => !Array.isArray(entry) && entry.event === name,
  );

export async function cookie(context: BrowserContext, name: string) {
  const found = (await context.cookies()).find((c) => c.name === name);
  return found ? decodeURIComponent(found.value) : undefined;
}

/** Closes the consent banner the way a visitor who declines would, so it does not cover the page. */
export async function declineCookies(page: Page) {
  await page.getByRole('dialog').getByRole('button', { name: 'الضرورية فقط' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

export async function signIn(page: Page, email = 'admin@example.com') {
  await page.goto('/admin/login');
  await page.fill('#email', email);
  await page.fill('#password', process.env.SEED_PASSWORD ?? 'local-dev-password');
  await page.click('button[type=submit]');
  await page.waitForURL('**/admin');
}

/** A fake Saudi mobile number that is unique per run, so tests can find their own lead. */
export const fakePhone = () => `055${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`;

/**
 * Serves a stand-in for the Turnstile widget that solves at once with Cloudflare's documented
 * dummy token. The server still verifies the token with Turnstile's test secret, so the API's
 * captcha check runs for real; only the third-party widget UI is skipped.
 */
export async function stubTurnstile(page: Page) {
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `(() => {
        let solve = () => {};
        window.turnstile = {
          render(el, options) {
            solve = () => setTimeout(() => options.callback('XXXX.DUMMY.TOKEN.XXXX'), 50);
            solve();
            return 'stub';
          },
          reset() { solve(); },
        };
      })();`,
    }),
  );
}
