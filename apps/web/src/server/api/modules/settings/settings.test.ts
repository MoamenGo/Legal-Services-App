import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bearer } from '@/server/test/auth';
import { createTestDb, insertUser, testEnv } from '@/server/test/d1';
import { api } from '../../app';

let ctx: Awaited<ReturnType<typeof createTestDb>>;
let admin = '';
let intake = '';
beforeAll(async () => {
  ctx = await createTestDb();
  admin = await insertUser(ctx.db, { role: 'admin', email: 'admin@example.test' });
  intake = await insertUser(ctx.db, { role: 'intake', email: 'intake@example.test' });
});
afterAll(() => ctx.dispose());

const values = {
  phone: '0551234567',
  whatsapp: '+966 55 123 4567',
  email: 'office@example.test',
  address_ar: 'الرياض، حي تجريبي',
  address_en: '',
  hours_ar: 'الأحد إلى الخميس',
  hours_en: '',
};

describe('settings', () => {
  it('starts empty, saves normalized values and serves them publicly', async () => {
    const empty = (await (
      await api.request('/api/settings/public', {}, testEnv(ctx.db))
    ).json()) as { settings: Record<string, unknown> };
    expect(empty.settings.phone).toBeNull();

    const res = await api.request(
      '/api/admin/settings',
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json', ...(await bearer(admin, 'admin')) },
        body: JSON.stringify(values),
      },
      testEnv(ctx.db),
    );
    expect(res.status).toBe(200);
    const { settings } = (await (
      await api.request('/api/settings/public', {}, testEnv(ctx.db))
    ).json()) as { settings: Record<string, unknown> };
    expect(settings).toMatchObject({
      phone: '+966551234567',
      whatsapp: '+966551234567',
      address_en: null,
    });

    const row = await ctx.db
      .prepare("select diff from audit_log where action = 'settings.update'")
      .first<{ diff: string }>();
    expect(JSON.parse(row!.diff).phone).toEqual([null, '+966551234567']);
  });

  it('is admin only and validates', async () => {
    const put = async (who: string, role: 'admin' | 'intake', body: unknown) =>
      api.request(
        '/api/admin/settings',
        {
          method: 'PUT',
          headers: { 'content-type': 'application/json', ...(await bearer(who, role)) },
          body: JSON.stringify(body),
        },
        testEnv(ctx.db),
      );
    expect((await put(intake, 'intake', values)).status).toBe(403);
    expect((await put(admin, 'admin', { ...values, phone: '123' })).status).toBe(400);
  });
});
