import { getCloudflareContext } from '@opennextjs/cloudflare';
import { api } from '@/server/api/app';

const handler = async (request: Request) => {
  const { env, ctx } = getCloudflareContext();
  // ctx lets the API finish background jobs after the response (waitUntil).
  return api.fetch(request, env, ctx);
};

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
