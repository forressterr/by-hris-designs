import type { NextApiRequest, NextApiResponse } from 'next';
import { checkBotId } from 'botid/server';
import {
  validateEnquiry,
  type EnquiryInput,
  type FieldName,
} from '../../lib/contact/validation';
import { getContactConfig } from '../../lib/contact/config';
import { checkRateLimit, storeEnquiry } from '../../lib/contact/redis';
import type {
  ContactApiResponse,
  StoredEnquiry,
} from '../../lib/contact/types';

// A human cannot fill name + email + message in under this; faster = bot.
const MIN_FILL_MS = 2500;

// FormSubmit rejects submissions that arrive without a web Origin/Referer
// ("Make sure you open this page through a web server"). A browser sends these
// automatically; a server-side fetch must set them. Use the site's canonical
// origin — the domain the FormSubmit endpoint was activated from.
const SITE_ORIGIN = 'https://www.byhris.cc';

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

  // 2. BotID (basic). Resilient: off-platform (local `next start`) or during a
  //    BotID outage, checkBotId throws (it needs Vercel's x-vercel-oidc-token)
  //    — fail open, since the honeypot, timer and rate-limit still defend.
  //    Real bot detection runs on Vercel.
  try {
    const bot = await checkBotId({ advancedOptions: { headers: req.headers } });
    if (bot.isBot) {
      res.status(403).json({ ok: false, error: 'Access denied.' });
      return;
    }
  } catch (err) {
    console.error(
      '[contact] BotID check unavailable, allowing through:',
      err instanceof Error ? err.message : err,
    );
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
  }

  // 6. Store (best-effort backup — the email is the real notification).
  const enquiry: StoredEnquiry = {
    id: `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    name: input.name.trim(),
    email: input.email.trim(),
    message: input.message.trim(),
    createdAt: new Date().toISOString(),
  };
  try {
    await storeEnquiry(enquiry);
  } catch (err) {
    console.error(
      '[contact] enquiry store failed (continuing to email):',
      err instanceof Error ? err.message : err,
    );
  }

  // 7. Forward to the inbox via FormSubmit (fail-closed: tell the user).
  try {
    const { formsubmitEndpoint } = getContactConfig();
    const forward = await fetch(formsubmitEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Origin: SITE_ORIGIN,
        Referer: `${SITE_ORIGIN}/contact`,
      },
      body: JSON.stringify({
        name: enquiry.name,
        email: enquiry.email,
        message: enquiry.message,
        _subject: `Contact Form Enquiry — ${enquiry.name}`,
        _replyto: enquiry.email,
        _template: 'table',
        _captcha: 'false',
      }),
    });
    const json: unknown = await forward.json().catch(() => ({}));
    const delivered =
      forward.ok &&
      typeof json === 'object' &&
      json !== null &&
      'success' in json &&
      ((json as { success: unknown }).success === true ||
        (json as { success: unknown }).success === 'true');
    if (!delivered) {
      res.status(502).json({
        ok: false,
        error: 'Could not deliver your message — please try again.',
      });
      return;
    }
  } catch (err) {
    console.error(
      '[contact] FormSubmit forward failed:',
      err instanceof Error ? err.message : err,
    );
    res.status(502).json({
      ok: false,
      error: 'Could not reach the inbox just now — please try again.',
    });
    return;
  }

  res.status(200).json({ ok: true });
}
