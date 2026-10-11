import { getCloudflareContext } from '@opennextjs/cloudflare';
import { api } from '@/server/api/app';

const handler = async (request: Request) => api.fetch(request, getCloudflareContext().env);

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
