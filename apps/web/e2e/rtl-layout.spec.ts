import { expect, test } from '@playwright/test';
import { declineCookies } from './helpers';

// Flow 3: Arabic pages render right-to-left without sideways scrolling at each breakpoint.
// Screenshots are attached to the report for visual review; pixel baselines are not committed
// because fonts render differently between machines (see docs/progress.md).
const widths = [360, 768, 1280];
const pages = ['/ar', '/ar/services', '/ar/lp/labor-lawyer', '/ar/contact'];

for (const width of widths) {
  test(`Arabic pages are RTL and fit at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of pages) {
      await page.goto(path);
      if (path === pages[0]) await declineCookies(page);
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} scrolls sideways at ${width}px`).toBeLessThanOrEqual(0);
      // In RTL the main heading starts at the right edge of its box.
      const heading = page.getByRole('heading', { level: 1 }).first();
      expect(await heading.evaluate((el) => getComputedStyle(el).direction)).toBe('rtl');
      await testInfo.attach(`${path.replaceAll('/', '_')}-${width}.png`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    }
  });
}

test('English pages are LTR', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
