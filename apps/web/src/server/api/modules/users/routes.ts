import { Hono } from 'hono';
import { z } from 'zod';
import { userRoles } from '@/server/db/schema';
import { audit, diffOf } from '../../audit';
import type { ApiEnv } from '../../env';
import { apiError } from '../../errors';
import { requireAuth, requireRole } from '../../middleware/auth';
import { createUser, findUser, listUsers, updateUser } from './service';

const password = z.string().min(12).max(200);

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(200),
  role: z.enum(userRoles),
  password,
});

const patchSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    role: z.enum(userRoles).optional(),
    active: z.boolean().optional(),
    password: password.optional(),
  })
  .strict();

export const usersRoutes = new Hono<ApiEnv>();

usersRoutes.use('/admin/users', requireAuth);
usersRoutes.use('/admin/users/*', requireAuth);

/** Names for the "assign to" picker; intake staff need it too. */
usersRoutes.get('/admin/users/assignable', requireRole('admin', 'intake'), async (c) => {
  const all = await listUsers(c.env.DB);
  return c.json({
    users: all.filter((u) => u.active).map(({ id, name, role }) => ({ id, name, role })),
  });
});

usersRoutes.get('/admin/users', requireRole('admin'), async (c) =>
  c.json({ users: await listUsers(c.env.DB) }),
);

usersRoutes.post('/admin/users', requireRole('admin'), async (c) => {
  const parsed = createSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    return apiError(
      c,
      400,
      'validation_error',
      'Invalid user',
      z.flattenError(parsed.error).fieldErrors,
    );
  try {
    const id = await createUser(c.env.DB, parsed.data);
    await audit(c, 'user.create', 'user', id, { role: [null, parsed.data.role] });
    return c.json({ user: await findUser(c.env.DB, id) }, 201);
  } catch (error) {
    if (error instanceof Error && /UNIQUE/i.test(`${error.message} ${String(error.cause ?? '')}`)) {
      return apiError(c, 409, 'email_taken', 'A user with this email already exists');
    }
    throw error;
  }
});

usersRoutes.patch('/admin/users/:id', requireRole('admin'), async (c) => {
  const parsed = patchSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    return apiError(
      c,
      400,
      'validation_error',
      'Invalid update',
      z.flattenError(parsed.error).fieldErrors,
    );
  const id = c.req.param('id');
  const before = await findUser(c.env.DB, id);
  if (!before) return apiError(c, 404, 'not_found', 'User not found');
  // An admin cannot lock themselves out by deactivating or demoting their own account.
  if (
    id === c.get('user').id &&
    (parsed.data.active === false || (parsed.data.role && parsed.data.role !== 'admin'))
  ) {
    return apiError(
      c,
      400,
      'cannot_change_self',
      'You cannot deactivate or demote your own account',
    );
  }
  await updateUser(c.env.DB, id, parsed.data);
  const { password: changedPassword, ...visible } = parsed.data;
  const diff = diffOf(before, visible);
  if (changedPassword) diff.password = ['***', '***'];
  await audit(c, 'user.update', 'user', id, diff);
  return c.json({ user: await findUser(c.env.DB, id) });
});
