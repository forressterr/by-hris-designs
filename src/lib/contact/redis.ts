// Upstash Redis access for the contact route: a per-IP sliding-window rate
// limiter and a best-effort enquiry store. Both degrade to no-ops when Upstash
// isn't configured, so the contact form keeps working (delivering email) even
// with no Redis — store + rate-limit simply activate once the env is present.
// Clients are created lazily so the build never needs env vars present.

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { getUpstashConfig } from './config';
import type { StoredEnquiry } from './types';

// 30 days — enquiries auto-expire, so nothing accumulates (steady-state).
export const ENQUIRY_TTL_SECONDS = 60 * 60 * 24 * 30;

let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

function clients(): { redis: Redis; ratelimit: Ratelimit } | null {
  if (redis && ratelimit) return { redis, ratelimit };
  const cfg = getUpstashConfig();
  if (!cfg) return null;
  redis = new Redis({ url: cfg.url, token: cfg.token });
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '10 m'),
    prefix: 'ratelimit:contact',
    analytics: false,
  });
  return { redis, ratelimit };
}

/**
 * Per-IP sliding window: 5 submits / 10 minutes. Returns `{ success: true }`
 * (allow) when no limiter is configured.
 */
export function checkRateLimit(ip: string): Promise<{ success: boolean }> {
  const c = clients();
  if (!c) return Promise.resolve({ success: true });
  return c.ratelimit.limit(ip);
}

/** Persist one enquiry with a 30-day TTL. No-op when no store is configured. */
export async function storeEnquiry(enquiry: StoredEnquiry): Promise<void> {
  const c = clients();
  if (!c) return;
  await c.redis.set(`enquiry:${enquiry.id}`, enquiry, {
    ex: ENQUIRY_TTL_SECONDS,
  });
}
