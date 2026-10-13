import { expect, test } from '@playwright/test';
import { declineCookies, events } from './helpers';

// Flow 2: the sticky bar's call and WhatsApp buttons push their dataLayer events.
test('call and WhatsApp buttons fire click_to_call and whatsapp_click', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/ar/lp/labor-lawyer');
  await declineCookies(page);
  // Keep the test on the page: the real links would open the dialer or wa.me.
  await page.evaluate(() => window.addEventListener('click', (event) => event.preventDefault()));

  const bar = page.locator('nav.fixed');
  const call = bar.locator('a[data-event="click_to_call"]');
  const whatsapp = bar.locator('a[data-event="whatsapp_click"]');
  await expect(
    call,
    'seed data sets the firm phone (pnpm seed, then content:export)',
  ).toBeVisible();
  await expect(call).toHaveAttribute('href', /^tel:\+966/);
  await expect(whatsapp).toHaveAttribute('href', /^https:\/\/wa\.me\/966/);

  await call.click();
  await whatsapp.click();
  expect(await events(page, 'click_to_call')).toEqual([
    expect.objectContaining({ location: 'sticky_bar' }),
  ]);
  expect(await events(page, 'whatsapp_click')).toEqual([
    expect.objectContaining({ location: 'sticky_bar' }),
  ]);
});
