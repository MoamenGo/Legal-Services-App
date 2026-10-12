import { describe, expect, it } from 'vitest';
import { api } from './app';

const envWithDb = (works: boolean) =>
  ({
    DB: {
      prepare: () => ({
        first: async () => {
          if (!works) throw new Error('D1 down');
          return { 1: 1 };
        },
      }),
    },
  }) as unknown as CloudflareEnv;

describe('GET /api/health', () => {
  it('reports ok when D1 answers', async () => {
    const res = await api.request('/api/health', {}, envWithDb(true));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', db: 'ok' });
  });

  it('reports degraded when D1 fails', async () => {
    const res = await api.request('/api/health', {}, envWithDb(false));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: 'degraded', db: 'unavailable' });
  });
});

describe('unknown routes', () => {
  it('use the shared error shape', async () => {
    const res = await api.request('/api/nope', {}, envWithDb(true));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: { code: 'not_found', message: 'Route not found' } });
  });
});
