import { expect, test } from '@playwright/test';
import ar from '../messages/ar.json' with { type: 'json' };
import { declineCookies, events, fakePhone, signIn, stubTurnstile } from './helpers';

// Flows 1 and 4 of AGENTS.md section 11, in order: the admin step works on the lead the visitor sent.
test.describe.configure({ mode: 'serial' });

const name = `عميل اختبار ${Date.now()}`;
let leadId = '';

test('a visitor from an ad sends the form and generate_lead carries the attribution', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await stubTurnstile(page);
  await page.goto(
    '/ar/lp/labor-lawyer?utm_source=google&utm_medium=cpc&utm_campaign=e2e-labor&utm_term=%D9%85%D8%AD%D8%A7%D9%85%D9%8A&gclid=E2E-gclid-1',
  );
  await declineCookies(page);

  const form = page.locator('form').first();
  await form.getByLabel(ar.form.name).fill(name);
  await form.getByLabel(ar.form.phone).fill(fakePhone());
  await form.getByLabel(ar.form.caseType).selectOption('labor');
  await form.getByLabel(ar.form.message).fill('رسالة اختبار آلي، بيانات وهمية.');
  await form.getByRole('checkbox').first().check();
  // The first click loads the captcha; the form submits once it has a token.
  await expect(async () => {
    await form.getByRole('button', { name: ar.form.submit }).click();
    await page.waitForURL('**/ar/thank-you**', { timeout: 5_000 });
  }).toPass({ timeout: 30_000 });

  leadId = new URL(page.url()).searchParams.get('lead') ?? '';
  expect(leadId).not.toBe('');
  await expect.poll(() => events(page, 'generate_lead')).toHaveLength(1);
  const [lead] = await events(page, 'generate_lead');
  expect(lead).toMatchObject({
    lead_id: leadId,
    case_type: 'labor',
    form_location: expect.any(String),
    language: 'ar',
  });
});

test('staff open the lead, see the ad source, and qualifying it queues the Ads conversion', async ({
  page,
}) => {
  test.skip(!leadId, 'needs the lead from the previous test');
  await signIn(page);
  await page.goto(`/admin/lead?id=${leadId}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
  await expect(page.getByText('E2E-gclid-1')).toBeVisible();
  await expect(page.getByText('e2e-labor')).toBeVisible();

  await page.selectOption('#status', 'qualified');
  await page.click('form button[type=submit]');
  await expect(page.getByText(ar.admin.lead.saved)).toBeVisible();
  // The job runs at once; with no Ads account configured it ends as "not enabled", which still
  // proves it was queued for this lead.
  await expect(page.getByText(ar.admin.jobs.ads_conversion)).toBeVisible();
});
