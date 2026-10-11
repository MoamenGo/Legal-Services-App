import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/** Every API error uses this shape: { error: { code, message, details? } }. */
export const apiError = (
  c: Context,
  status: ContentfulStatusCode,
  code: string,
  message: string,
  details?: unknown,
) => c.json({ error: { code, message, ...(details === undefined ? {} : { details }) } }, status);
