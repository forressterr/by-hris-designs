// A thin adapter around Vercel BotID's server check. Its one job is to produce
// a verdict and survive the SDK's throws: checkBotId throws off-platform (local
// `next start`) and during a BotID outage, which must never crash the contact
// route. Splitting it out keeps the route's pipeline shell readable, like
// validation.ts / redis.ts.

import * as Sentry from '@sentry/nextjs';
import { checkBotId } from 'botid/server';
import type { IncomingHttpHeaders } from 'http';

export type BotIdVerdict = 'bot' | 'human' | 'error';

/**
 * Evaluate BotID for a request. Never throws: an off-platform call or a BotID
 * outage resolves to 'error' (the caller fails open). 'error' is captured to
 * Sentry so outages stay visible.
 */
export async function evaluateBotId(
  headers: IncomingHttpHeaders,
): Promise<BotIdVerdict> {
  try {
    const { isBot } = await checkBotId({ advancedOptions: { headers } });
    return isBot ? 'bot' : 'human';
  } catch (err) {
    Sentry.captureException(err);
    return 'error';
  }
}
