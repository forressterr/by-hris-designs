import type { NextApiRequest, NextApiResponse } from 'next';
import * as Sentry from '@sentry/nextjs';
import { checkBotId } from 'botid/server';
import {
  validateEnquiry,
  type EnquiryInput,
  type FieldName,
} from '../../lib/contact/validation';
import { checkRateLimit, storeEnquiry } from '../../lib/contact/redis';
import { sendEnquiryEmail } from '../../lib/contact/email';
import type {
  ContactApiResponse,
  StoredEnquiry,
} from '../../lib/contact/types';

// A human cannot fill name + email + message in under this; faster = bot.
const MIN_FILL_MS = 2500;

function getClientIp(req: NextApiRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0]?.trim() || 'unknown';
  if (Array.isArray(fwd)) return fwd[0] ?? 'unknown';
  return 'unknown';
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ContactApiResponse>,
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, error: 'Method not allowed.' });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;

  // 1. Honeypot — humans can't see `_honey`; any value = bot. Silent success.
  if (str(body._honey).length > 0) {
    res.status(200).json({ ok: true });
    return;
  }

  // 2. BotID (basic) — MONITOR MODE (does not block). The client-side
  //    challenge (instrumentation-client `initBotId`) is not issuing tokens in
  //    production, so checkBotId() returns isBot:true for real browsers too — a
  //    hard block rejected legitimate visitors. We log the verdict but allow the
  //    request through; the honeypot, request-timer, per-IP rate-limit and
  //    server-side validation remain the active bot defenses. Re-enable blocking
  //    only once the client challenge is confirmed working in production (see
  //    BACKLOG Phase 2). checkBotId also throws off-platform (local `next start`,
  //    or a BotID outage) — caught here.
  try {
    const bot = await checkBotId({ advancedOptions: { headers: req.headers } });
    if (bot.isBot) {
      console.warn(
        '[contact] BotID flagged this request as a bot (monitor mode — not blocking)',
      );
    }
  } catch (err) {
    console.error(
      '[contact] BotID check unavailable:',
      err instanceof Error ? err.message : err,
    );
    Sentry.captureException(err);
  }

  // 3. Request-timer — implausibly fast submit = bot. Silent success so the
  //    threshold isn't leaked.
  const elapsedMs = typeof body.elapsedMs === 'number' ? body.elapsedMs : 0;
  if (elapsedMs < MIN_FILL_MS) {
    res.status(200).json({ ok: true });
    return;
  }

  // 4. Validation (defense in depth — the client already validated for UX).
  const input: EnquiryInput = {
    name: str(body.name),
    email: str(body.email),
    message: str(body.message),
  };
  const errors = validateEnquiry(input);
  const fields = Object.fromEntries(
    Object.entries(errors).filter(([, v]) => v),
  ) as Partial<Record<FieldName, string>>;
  if (Object.keys(fields).length > 0) {
    res.status(400).json({
      ok: false,
      error: 'A few things to fix first — check the highlighted fields.',
      fields,
    });
    return;
  }

  // 5. Rate limit (fail-open: a Redis hiccup must not block real visitors).
  try {
    const { success } = await checkRateLimit(getClientIp(req));
    if (!success) {
      res.status(429).json({
        ok: false,
        error: 'Too many messages — please try again in a few minutes.',
      });
      return;
    }
  } catch (err) {
    console.error(
      '[contact] rate-limit check failed, allowing through:',
      err instanceof Error ? err.message : err,
    );
    Sentry.captureException(err);
  }

  const enquiry: StoredEnquiry = {
    id: `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    name: input.name.trim(),
    email: input.email.trim(),
    message: input.message.trim(),
    createdAt: new Date().toISOString(),
  };

  // 6. Capture the enquiry two ways — a durable Redis record AND an email
  //    notification. Both are best-effort; the enquiry counts as received if
  //    EITHER succeeds, so one unconfigured/failing dependency can't take the
  //    form down. (storeEnquiry returns false when Upstash isn't configured;
  //    sendEnquiryEmail returns false when Resend isn't configured or fails.)
  let stored = false;
  try {
    stored = await storeEnquiry(enquiry);
  } catch (err) {
    console.error(
      '[contact] enquiry store failed:',
      err instanceof Error ? err.message : err,
    );
    Sentry.captureException(err);
  }
  const emailed = await sendEnquiryEmail(enquiry);

  // 7. Only ask the visitor to retry if we captured the enquiry NOWHERE.
  if (!stored && !emailed) {
    res.status(502).json({
      ok: false,
      error: 'Could not send your message just now — please try again.',
    });
    return;
  }

  res.status(200).json({ ok: true });
}
