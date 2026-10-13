import { sql } from 'drizzle-orm';
import { createDb } from '@/server/db/client';
import { leads } from '@/server/db/schema';
import type { AuthUser } from '../../env';
import { whereFor } from '../admin-leads/service';

export const funnelGroups = ['campaign', 'term', 'landingPage'] as const;
export type FunnelGroup = (typeof funnelGroups)[number];

const groupPath: Record<FunnelGroup, string> = {
  campaign: '$.utm_campaign',
  term: '$.utm_term',
  landingPage: '$.landingPage',
};

const inStatuses = (...statuses: string[]) =>
  sql`sum(case when ${leads.status} in (${sql.join(
    statuses.map((s) => sql`${s}`),
    sql`, `,
  )}) then 1 else 0 end)`.mapWith(Number);

/**
 * Leads per campaign, keyword or landing page and how far they got. Each stage counts leads that
 * reached it or a later one, so the columns read as a funnel (AGENTS.md section 5).
 */
export async function funnel(
  d1: D1Database,
  { from, to, groupBy }: { from?: string; to?: string; groupBy: FunnelGroup },
  user: AuthUser,
) {
  const key = sql<string | null>`json_extract(${leads.source}, ${groupPath[groupBy]})`;
  const rows = await createDb(d1)
    .select({
      key,
      leads: sql`count(*)`.mapWith(Number),
      contacted: inStatuses('contacted', 'qualified', 'consultation_booked', 'retained'),
      qualified: inStatuses('qualified', 'consultation_booked', 'retained'),
      booked: inStatuses('consultation_booked', 'retained'),
      retained: inStatuses('retained'),
      lost: inStatuses('lost'),
      spam: inStatuses('spam'),
      value:
        sql`coalesce(sum(case when ${leads.status} = 'retained' then ${leads.value} end), 0)`.mapWith(
          Number,
        ),
    })
    .from(leads)
    .where(whereFor({ from, to }, user))
    .groupBy(key)
    .orderBy(sql`count(*) desc`)
    .limit(200);
  return rows;
}
