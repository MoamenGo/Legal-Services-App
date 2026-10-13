import { expect, test } from '@playwright/test';
import { cookie, dataLayer } from './helpers';

// Flow 5: Consent Mode v2 starts denied, and only the visitor's choice grants storage.
const consentDefault = async (page: import('@playwright/test').Page) => {
  const [first] = await dataLayer(page);
  expect(Array.isArray(first) && first[0] === 'consent' && first[1] === 'default').toBe(true);
  return (first as [string, string, Record<string, string>])[2];
};

test('storage is denied until the visitor accepts, and the choice is remembered', async ({
  page,
  context,
}) => {
  await page.goto('/ar');
  const banner = page.getByRole('dialog');
  await expect(banner).toBeVisible();
  expect(await consentDefault(page)).toMatchObject({
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  expect(await cookie(context, 'lsa_consent')).toBeUndefined();

  await banner.getByRole('button', { name: 'أوافق' }).click();
  await expect(banner).toHaveCount(0);
  const update = (await dataLayer(page)).find(
    (entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'update',
  ) as [string, string, Record<string, string>] | undefined;
  expect(update?.[2]).toMatchObject({ ad_storage: 'granted', analytics_storage: 'granted' });
  expect(await cookie(context, 'lsa_consent')).toBeTruthy();

  await page.goto('/en');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await consentDefault(page)).toMatchObject({ ad_storage: 'granted' });
});

test('declining keeps storage denied on the next page', async ({ page }) => {
  await page.goto('/ar/services');
  await page.getByRole('dialog').getByRole('button', { name: 'الضرورية فقط' }).click();
  await page.goto('/ar/contact');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await consentDefault(page)).toMatchObject({
    ad_storage: 'denied',
    analytics_storage: 'denied',
  });
});
