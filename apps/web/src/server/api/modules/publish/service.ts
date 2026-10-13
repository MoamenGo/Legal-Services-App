export type PublishEnv = {
  /** Fine-grained GitHub token with "Actions: read and write" on this repository only. */
  GITHUB_DEPLOY_TOKEN?: string;
  /** owner/name, e.g. MoamenGo/Legal-Services-App. */
  GITHUB_REPOSITORY?: string;
};

export type PublishResult =
  { ok: true } | { ok: false; reason: 'not_configured' | 'github_error'; status?: number };

/**
 * Pages are static, so publishing content means rebuilding: this starts the Deploy workflow, which
 * exports published content from D1 before building (ADR 0005).
 */
export async function dispatchDeploy(env: PublishEnv): Promise<PublishResult> {
  if (!env.GITHUB_DEPLOY_TOKEN || !env.GITHUB_REPOSITORY)
    return { ok: false, reason: 'not_configured' };
  const res = await fetch(
    `https://api.github.com/repos/${env.GITHUB_REPOSITORY}/actions/workflows/deploy.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.GITHUB_DEPLOY_TOKEN}`,
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        'user-agent': 'legal-services-app',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
    },
  ).catch(() => null);
  if (!res || res.status !== 204) return { ok: false, reason: 'github_error', status: res?.status };
  return { ok: true };
}

/** Constant-time string comparison for the webhook secret. */
export function safeEqual(a: string, b: string) {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  let diff = left.length ^ right.length;
  for (let i = 0; i < Math.max(left.length, right.length); i++)
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return diff === 0;
}
