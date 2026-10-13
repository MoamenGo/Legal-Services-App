/**
 * Prints SQL that creates the first admin if no user has that email yet. The deploy workflow runs it
 * when the ADMIN_EMAIL and ADMIN_PASSWORD repository secrets exist, so a fresh deploy can be signed
 * into without anyone handling a password hash. Only the hash is printed, never the password.
 */
import { hashPassword } from '../src/server/lib/password.ts';
import { uuidv7 } from '../src/server/lib/uuid.ts';
import { q } from './sql.ts';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? '';
const name = process.env.ADMIN_NAME?.trim() || 'Admin';

if (!email || !/^[^\s@]+@[^\s@]+$/.test(email))
  throw new Error('ADMIN_EMAIL is missing or invalid');
if (password.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters');

const hash = await hashPassword(password);
process.stdout.write(
  `INSERT INTO users (id, name, email, password_hash, role, active) VALUES (${q(uuidv7())}, ${q(name)}, ${q(email)}, ${q(hash)}, 'admin', 1) ON CONFLICT(email) DO NOTHING;\n`,
);
