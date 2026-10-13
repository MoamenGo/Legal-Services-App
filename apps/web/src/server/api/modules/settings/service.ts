import { settingKeys, type Settings } from '@app/schemas';
import { createDb } from '@/server/db/client';
import { settings } from '@/server/db/schema';

export async function readSettings(d1: D1Database): Promise<Settings> {
  const rows = await createDb(d1).select().from(settings);
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return Object.fromEntries(
    settingKeys.map((key) => [key, (stored[key] as string | null | undefined) ?? null]),
  ) as Settings;
}

export async function writeSettings(d1: D1Database, values: Settings) {
  const db = createDb(d1);
  const now = new Date();
  const upsert = (key: keyof Settings) =>
    db
      .insert(settings)
      .values({ key, value: values[key], updatedAt: now })
      .onConflictDoUpdate({ target: settings.key, set: { value: values[key], updatedAt: now } });
  // One batch, so a save never leaves the site with half old and half new details.
  const [first, ...rest] = settingKeys;
  await db.batch([upsert(first!), ...rest.map(upsert)]);
}
