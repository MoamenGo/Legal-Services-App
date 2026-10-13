/**
 * Fills the LOCAL D1 database with fake users and leads for development (AGENTS.md rule 2: never real
 * data). Safe to rerun: fixed ids and INSERT OR IGNORE. It never targets the remote database.
 *
 *   pnpm seed            then sign in at /admin/login with admin@example.com and SEED_PASSWORD
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { caseTypes, preferredContacts } from '@app/schemas/constants';
import { hashPassword } from '../src/server/lib/password.ts';
import { q } from './sql.ts';

const password = process.env.SEED_PASSWORD ?? 'local-dev-password';
const DAY = 24 * 60 * 60;
const now = Math.floor(Date.now() / 1000);
const id = (prefix: string, n: number) =>
  `00000000-0000-7000-8000-${prefix}${String(n).padStart(12 - prefix.length, '0')}`;

const users = [
  { id: id('a', 1), name: 'مدير تجريبي', email: 'admin@example.com', role: 'admin' },
  { id: id('a', 2), name: 'موظف استقبال تجريبي', email: 'intake@example.com', role: 'intake' },
  { id: id('a', 3), name: 'محامٍ تجريبي', email: 'lawyer@example.com', role: 'lawyer' },
  { id: id('a', 4), name: 'Test Lawyer', email: 'lawyer2@example.com', role: 'lawyer' },
];

const names = [
  'عبدالله التجريبي',
  'نورة الاختبار',
  'خالد المثال',
  'سارة النموذج',
  'فهد التجربة',
  'ريم العينة',
  'Test Client',
  'Sample Person',
  'محمد الوهمي',
  'هند الافتراضية',
];
const statuses = [
  'new',
  'new',
  'new',
  'contacted',
  'qualified',
  'consultation_booked',
  'retained',
  'lost',
  'spam',
];
const campaigns = ['labor-riyadh', 'commercial-riyadh', undefined];
const lawyers = [users[2]!.id, users[3]!.id, null];

const statements: string[] = [];
const hash = await hashPassword(password);
for (const u of users) {
  statements.push(
    `INSERT OR IGNORE INTO users (id, name, email, password_hash, role, active) VALUES (${q(u.id)}, ${q(u.name)}, ${q(u.email)}, ${q(hash)}, ${q(u.role)}, 1);`,
  );
}

for (let i = 1; i <= 40; i++) {
  const campaign = campaigns[i % campaigns.length];
  const created = now - ((i * 37) % 60) * DAY - ((i * 3) % 24) * 3600;
  const source = campaign
    ? {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: campaign,
        utm_term: 'محامي عمالي',
        gclid: `TEST-gclid-${i}`,
        landingPage: `/ar/lp/${campaign.split('-')[0]}-lawyer`,
        device: i % 3 ? 'mobile' : 'desktop',
      }
    : { referrer: 'https://www.google.com/', landingPage: '/ar', device: 'mobile' };
  const language = i % 4 === 0 ? 'en' : 'ar';
  statements.push(
    `INSERT OR IGNORE INTO leads (id, name, phone, email, case_type, message, preferred_contact, language, source, status, assigned_to, privacy_accepted_at, marketing_consent, created_at, updated_at) VALUES (` +
      [
        q(id('b', i)),
        q(names[i % names.length]!),
        // +9665000000xx: valid Saudi mobile shape, not a real subscriber.
        q(`+9665000000${String(i).padStart(2, '0')}`),
        q(i % 3 === 0 ? `client${i}@example.com` : null),
        q(caseTypes[i % caseTypes.length]!),
        q(
          language === 'ar'
            ? 'رسالة تجريبية لأغراض التطوير فقط.'
            : 'Fake message for development only.',
        ),
        q(preferredContacts[i % preferredContacts.length]!),
        q(language),
        q(JSON.stringify(source)),
        q(statuses[i % statuses.length]!),
        q(lawyers[i % lawyers.length] ?? null),
        created,
        i % 2,
        created,
        created,
      ].join(', ') +
      ');',
  );
}

// One fake article (published) and fake firm details, so the CMS pages have something to show.
const article = {
  title: { ar: 'مقال تجريبي: مكافأة نهاية الخدمة', en: 'Sample article: end of service award' },
  summary: { ar: 'نص تجريبي لأغراض التطوير فقط.', en: 'Placeholder text for development only.' },
  body: {
    ar: '## مقدمة\nهذا نص تجريبي لأغراض التطوير فقط، وليس معلومات قانونية.\n\n- بند أول\n- بند ثانٍ',
    en: '## Introduction\nPlaceholder text for development only, not legal information.\n\n- First item\n- Second item',
  },
};
statements.push(
  `INSERT OR IGNORE INTO articles (id, slug, title, summary, body, tags, published, published_at, author_id) VALUES (${q(id('c', 1))}, 'sample-article', ${q(JSON.stringify(article.title))}, ${q(JSON.stringify(article.summary))}, ${q(JSON.stringify(article.body))}, '["تجريبي"]', 1, ${now}, ${q(users[0]!.id)});`,
);
const settings = {
  phone: '+966500000999',
  whatsapp: '+966500000999',
  email: 'office@example.com',
  address_ar: 'الرياض (عنوان تجريبي)',
  address_en: 'Riyadh (sample address)',
  hours_ar: 'الأحد إلى الخميس، 9 ص إلى 5 م (تجريبي)',
  hours_en: 'Sun to Thu, 9am to 5pm (sample)',
};
for (const [key, value] of Object.entries(settings)) {
  statements.push(
    `INSERT OR IGNORE INTO settings (key, value) VALUES (${q(key)}, ${q(JSON.stringify(value))});`,
  );
}

mkdirSync('.wrangler', { recursive: true });
writeFileSync('.wrangler/seed.sql', statements.join('\n') + '\n');
execFileSync(
  'npx',
  ['wrangler', 'd1', 'execute', 'DB', '--local', '--file', '.wrangler/seed.sql'],
  { stdio: 'inherit' },
);
console.info(
  `Seeded ${users.length} users and 40 leads. Sign in as admin@example.com with SEED_PASSWORD (default: ${password === 'local-dev-password' ? password : 'the value you set'}).`,
);
