// Upstash Redis access for the contact route: a per-IP sliding-window rate
// limiter and a best-effort enquiry store. Clients are created lazily so the
// build doesn't require env vars to be present at module-evaluation time.

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { getContactConfig } from './config';
import type { StoredEnquiry } from './types';

// 30 days — enquiries auto-expire, so nothing accumulates (steady-state).
export const ENQUIRY_TTL_SECONDS = 60 * 60 * 24 * 30;

let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

function clients(): { redis: Redis; ratelimit: Ratelimit } {
  if (!redis || !ratelimit) {
    const { upstashUrl, upstashToken } = getContactConfig();
    redis = new Redis({ url: upstashUrl, token: upstashToken });
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '10 m'),
      prefix: 'ratelimit:contact',
      analytics: false,
    });
  }
  return { redis, ratelimit };
}

/** Per-IP sliding window: 5 submits / 10 minutes. */
export function checkRateLimit(ip: string): Promise<{ success: boolean }> {
  return clients().ratelimit.limit(ip);
}

/** Persist one enquiry with a 30-day TTL. Key: `enquiry:<id>`. */
export async function storeEnquiry(enquiry: StoredEnquiry): Promise<void> {
  await clients().redis.set(`enquiry:${enquiry.id}`, enquiry, {
    ex: ENQUIRY_TTL_SECONDS,
  });
}
