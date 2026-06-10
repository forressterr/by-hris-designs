# Phase 2 — Contact-form Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move contact-form submission server-side behind `POST /api/contact`, which runs honeypot + BotID + request-timer + validation + per-IP rate-limit, persists each enquiry to Upstash Redis (30-day TTL), and forwards to the inbox via FormSubmit — removing the inbox from the client bundle.

**Architecture:** A small `src/lib/contact/` core (pure validators, typed config, Upstash client + rate-limiter + store) consumed by a thin `src/pages/api/contact.ts` imperative shell. `ContactForm.tsx` imports the shared validators (deleting its local copies) and POSTs JSON to the route. BotID basic is wired via `instrumentation-client.ts` + a `withBotId` next.config wrapper; the function is pinned to `fra1` via `vercel.json`.

**Tech Stack:** Next.js 15 (Pages Router), React 19, strict TS, `@upstash/redis`, `@upstash/ratelimit`, `botid`, FormSubmit.

**Spec:** `docs/superpowers/specs/2026-06-10-phase2-contact-hardening-design.md`

**No test framework this phase** (deferred to Phase 5 per the roadmap). Verification = `npm run check` (lint · format · typecheck · audit-high · build) + a manual curl/REST matrix on `npm run build && npm run start`. Validators are pure → unit-test-ready for Phase 5.

**Conventions:** branch + PR; commits authored `h.goretsov <gorecov4@gmail.com>`, conventional messages, no AI trailer; `npm run check` gate before the PR; don't merge until check + CI + Vercel preview all green.

---

## File map

| File                             | Create/Modify | Responsibility                                                                                            |
| -------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------- |
| `src/lib/contact/validation.ts`  | Create        | Pure validators + `EnquiryInput`/`FieldName`/`FormErrors` types + constants (extracted from ContactForm). |
| `src/lib/contact/types.ts`       | Create        | `StoredEnquiry`, `ContactApiResponse`.                                                                    |
| `src/lib/contact/config.ts`      | Create        | `getContactConfig()` — fail-fast typed env.                                                               |
| `src/lib/contact/redis.ts`       | Create        | Lazy Upstash client + `checkRateLimit()` + `storeEnquiry()`.                                              |
| `src/pages/api/contact.ts`       | Create        | The route — pipeline orchestrator.                                                                        |
| `src/instrumentation-client.ts`  | Create        | `initBotId` (BotID basic) for `/api/contact`.                                                             |
| `vercel.json`                    | Create        | `regions: ["fra1"]`.                                                                                      |
| `next.config.js`                 | Modify        | Wrap with `withBotId`.                                                                                    |
| `src/components/ContactForm.tsx` | Modify        | Import shared validators; POST `/api/contact`; send `elapsedMs`; interpret `{ ok }`.                      |
| `.env.local` / `.env.example`    | Modify        | Add `CONTACT_FORMSUBMIT_ENDPOINT`.                                                                        |

---

## Task 1: Branch, dependencies, env

**Files:** Modify `.env.local`, `.env.example`.

- [ ] **Step 1: Branch from clean `main`.**

```bash
git checkout main && git pull --ff-only
git checkout -b feat/phase2-contact-hardening
```

- [ ] **Step 2: Install runtime deps (exact-pinned via `.npmrc`).**

```bash
npm i botid @upstash/redis @upstash/ratelimit
```

Expected: three deps added to `package.json` with exact versions (no `^`).

- [ ] **Step 3: Add the FormSubmit endpoint to `.env.local`** (Upstash URL+token already present). Append:

```
# FormSubmit AJAX endpoint (inbox kept out of the repo + client bundle).
CONTACT_FORMSUBMIT_ENDPOINT="https://formsubmit.co/ajax/h.goretsov@gmail.com"
```

- [ ] **Step 4: Document it in `.env.example`** — replace the two commented Upstash lines block's trailing section so all three vars are listed. The file's `Phase 2` block should read:

```
# Phase 2 — contact API route (src/pages/api/contact.ts).
# Database provisioned 2026-06-10: Upstash Redis `by-hris-contact-database`
# (free tier, GCP europe-west1). Upstash values: console → database →
# Details → REST API. Set all three in Vercel (Production + Preview, token
# marked Sensitive) and in .env.local for local dev. The all-access Upstash
# token gets swapped for an ACL-scoped token during/after Phase 2.
# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=
# CONTACT_FORMSUBMIT_ENDPOINT=
```

- [ ] **Step 5: Verify `.env.local` stays ignored.**

```bash
git check-ignore .env.local   # expect: .env.local
```

- [ ] **Step 6: Commit** (deps + env.example only; `.env.local` is ignored).

```bash
git add package.json package-lock.json .env.example
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "build: add botid, upstash redis + ratelimit; document contact env"
```

---

## Task 2: Shared validation module

**Files:** Create `src/lib/contact/validation.ts`, `src/lib/contact/types.ts`.

This is the verbatim logic from `ContactForm.tsx` (lines ~33–121 today), lifted into a shared module so client and server validate identically.

- [ ] **Step 1: Create `src/lib/contact/validation.ts`.**

```ts
// Shared contact-form validation — the single source of truth used by both
// the client (live UX validation in ContactForm) and the server (the
// /api/contact security gate). Pure functions, no I/O.

export const MAX_MESSAGE_LENGTH = 1500;

export type FieldName = 'name' | 'email' | 'message';

export interface EnquiryInput {
  name: string;
  email: string;
  message: string;
}

export interface FormErrors {
  name: string | null;
  email: string | null;
  message: string | null;
}

// Allow letters from any script (\p{L}) plus apostrophes and hyphens so
// names like "O'Brien" and "Mary-Jane" pass.
const NAME_PART_PATTERN = /^[\p{L}][\p{L}'-]*$/u;

// Pragmatic email check: at least one char before @, a domain with a dot,
// and a 2+ char TLD. type="email" + this catches every normal typo.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// URL / domain detection — keep loose. Any obvious link should bounce.
const URL_SCHEME_PATTERN = /\b(?:https?:\/\/|ftp:\/\/|www\.)/i;
const DOMAIN_LIKE_PATTERN =
  /\b[\w-]+\.(?:com|org|net|io|dev|app|co|uk|de|nl|fr|info|biz|edu|gov|me|tech|xyz|ly|us|to|ai|cc|gg|tv)(?:\b|\/)/i;
const HTML_TAG_PATTERN = /<[^>\s][^>]*>/;
const MARKDOWN_LINK_PATTERN = /\[[^\]]*]\([^)]+\)/;

export function validateName(raw: string): string | null {
  const value = raw.trim();
  if (!value) return 'Please enter your name.';
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return 'Please enter at least 2 names (e.g. John Doe).';
  }
  if (parts.length > 3) {
    return 'Up to 3 names, please.';
  }
  for (const part of parts) {
    if (!NAME_PART_PATTERN.test(part)) {
      return 'Names should contain letters only (apostrophes and hyphens are fine).';
    }
  }
  return null;
}

export function validateEmail(raw: string): string | null {
  const value = raw.trim();
  if (!value) return 'Please enter your email.';
  if (!EMAIL_PATTERN.test(value)) {
    return 'Please enter a valid email (e.g. example@example.com).';
  }
  return null;
}

export function validateMessage(raw: string): string | null {
  const value = raw.trim();
  if (!value) return 'Please write a message.';
  if (value.length > MAX_MESSAGE_LENGTH) {
    return `Keep it under ${MAX_MESSAGE_LENGTH} characters (currently ${value.length}).`;
  }
  if (URL_SCHEME_PATTERN.test(value) || DOMAIN_LIKE_PATTERN.test(value)) {
    return 'Please don’t include links or domains.';
  }
  if (HTML_TAG_PATTERN.test(value)) {
    return 'HTML tags aren’t allowed.';
  }
  if (MARKDOWN_LINK_PATTERN.test(value)) {
    return 'Please don’t include markdown links.';
  }
  return null;
}

export const VALIDATORS: Record<FieldName, (raw: string) => string | null> = {
  name: validateName,
  email: validateEmail,
  message: validateMessage,
};

export function validateEnquiry(values: EnquiryInput): FormErrors {
  return {
    name: VALIDATORS.name(values.name),
    email: VALIDATORS.email(values.email),
    message: VALIDATORS.message(values.message),
  };
}
```

- [ ] **Step 2: Create `src/lib/contact/types.ts`.**

```ts
import type { EnquiryInput, FieldName } from './validation';

/** An enquiry as persisted to Redis. */
export interface StoredEnquiry extends EnquiryInput {
  id: string;
  createdAt: string; // ISO-8601
}

/** The /api/contact JSON response contract. */
export type ContactApiResponse =
  | { ok: true }
  | { ok: false; error: string; fields?: Partial<Record<FieldName, string>> };
```

- [ ] **Step 3: Typecheck.**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Commit.**

```bash
git add src/lib/contact/validation.ts src/lib/contact/types.ts
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "feat: add shared contact validation module and enquiry types"
```

---

## Task 3: Config + Redis layer

**Files:** Create `src/lib/contact/config.ts`, `src/lib/contact/redis.ts`.

- [ ] **Step 1: Create `src/lib/contact/config.ts`.**

```ts
// Typed, fail-fast access to the contact route's environment. Throws a clear
// error if a required var is missing; never logs the secret values.

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export interface ContactConfig {
  upstashUrl: string;
  upstashToken: string;
  formsubmitEndpoint: string;
}

export function getContactConfig(): ContactConfig {
  return {
    upstashUrl: requireEnv('UPSTASH_REDIS_REST_URL'),
    upstashToken: requireEnv('UPSTASH_REDIS_REST_TOKEN'),
    formsubmitEndpoint: requireEnv('CONTACT_FORMSUBMIT_ENDPOINT'),
  };
}
```

- [ ] **Step 2: Create `src/lib/contact/redis.ts`.**

```ts
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
```

- [ ] **Step 3: Typecheck.**

Run: `npm run typecheck`
Expected: no errors (verifies `@upstash/*` types resolve and `Ratelimit.limit` returns a `{ success }`-bearing type).

- [ ] **Step 4: Commit.**

```bash
git add src/lib/contact/config.ts src/lib/contact/redis.ts
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "feat: add contact config and upstash redis/ratelimit layer"
```

---

## Task 4: The API route

**Files:** Create `src/pages/api/contact.ts`.

- [ ] **Step 1: Create `src/pages/api/contact.ts`.**

```ts
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

  // 2. BotID (basic). In dev this returns isBot:false (no challenge infra);
  //    real detection runs on Vercel.
  const bot = await checkBotId({ advancedOptions: { headers: req.headers } });
  if (bot.isBot) {
    res.status(403).json({ ok: false, error: 'Access denied.' });
    return;
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
```

- [ ] **Step 2: Typecheck + build** (build confirms the API route compiles as a serverless function).

Run: `npm run typecheck && npm run build`
Expected: no errors; build output lists `ƒ /api/contact` (or `λ`) among the routes.

- [ ] **Step 3: Commit.**

```bash
git add src/pages/api/contact.ts
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "feat: add server-side /api/contact route with bot, timer, rate-limit, store, forward"
```

---

## Task 5: BotID client init, next.config wrapper, region pin

**Files:** Create `src/instrumentation-client.ts`, `vercel.json`; Modify `next.config.js`.

- [ ] **Step 1: Create `src/instrumentation-client.ts`** (Next.js runs this on the client; `src/` location matches the `src/pages` layout).

```ts
import { initBotId } from 'botid/client/core';

// Register the paths BotID protects. Basic mode (deep-analysis is a paid
// tier). Covers the contact page and the footer form on every page, since
// both POST to /api/contact.
initBotId({
  protect: [
    {
      path: '/api/contact',
      method: 'POST',
      advancedOptions: { checkLevel: 'basic' },
    },
  ],
});
```

- [ ] **Step 2: Wrap `next.config.js` with `withBotId`** — change the import section and the export, preserving the existing config:

Change the top of the file from:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
```

to:

```js
import { withBotId } from 'botid/next/config';

/** @type {import('next').NextConfig} */
const nextConfig = {
```

and change the final line from:

```js
export default nextConfig;
```

to:

```js
export default withBotId(nextConfig);
```

- [ ] **Step 3: Create `vercel.json`** (pin the function next to the DB in Belgium; visible + version-controlled, unlike a dashboard setting).

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "regions": ["fra1"]
}
```

- [ ] **Step 4: Typecheck + build** (build confirms the `withBotId` wrapper + instrumentation-client compile and the rewrites install).

Run: `npm run typecheck && npm run build`
Expected: no errors; build completes; no warning about an unknown `vercel.json` key.

- [ ] **Step 5: Commit.**

```bash
git add src/instrumentation-client.ts next.config.js vercel.json
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "feat: wire BotID basic and pin contact function to fra1"
```

---

## Task 6: Rewire ContactForm

**Files:** Modify `src/components/ContactForm.tsx`.

The form keeps its UI (status machine, honeypot input, toast, idle-timer fix) but: imports the shared validators (deleting local copies), stamps mount time, POSTs JSON to `/api/contact` with `elapsedMs`, and reads the `{ ok }` contract.

- [ ] **Step 1: Replace the imports + delete the local validation block.** Change the top of the file — replace everything from the first `import` line down to the end of the `runAllValidations` function (the `// ----` separator line just before `export default function ContactForm`) with:

```ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { MotionProps } from 'framer-motion';
import Toast from './Toast';
import {
  MAX_MESSAGE_LENGTH,
  VALIDATORS,
  validateEnquiry,
} from '../lib/contact/validation';
import type {
  EnquiryInput,
  FieldName,
  FormErrors,
} from '../lib/contact/validation';

type FormTouched = { name: boolean; email: boolean; message: boolean };
type ToastState = { kind: 'success' | 'error'; message: string };

// ----------------------------------------------------------------------------
```

This removes the old `FORMSUBMIT_ENDPOINT` constant, the local `FieldName`/`FormValues`/`FormErrors` types, all the regex patterns, `validateName/Email/Message`, `VALIDATORS`, and `runAllValidations` (now imported). `FormTouched`/`ToastState` are kept as the form's UI-only types.

- [ ] **Step 2: Retype the values state.** Change:

```ts
  const [values, setValues] = useState<FormValues>({
```

to:

```ts
  const [values, setValues] = useState<EnquiryInput>({
```

- [ ] **Step 3: Add a mount-time ref** for the request-timer. Immediately after the `idleTimer`/`scheduleIdle`/unmount-cleanup block (the `useEffect(() => () => window.clearTimeout(idleTimer.current), []);` line), add:

```ts
// Stamp when the form mounted; the elapsed-since-mount time is sent to the
// server, which rejects implausibly fast submits as bots.
const mountedAt = useRef<number>(0);
useEffect(() => {
  mountedAt.current = Date.now();
}, []);
```

- [ ] **Step 4: Use the imported `VALIDATORS` in change/blur** — these already reference `VALIDATORS[field]`, which now resolves to the import, so no change is needed there. Confirm `handleChange` and `handleBlur` still read `VALIDATORS[field](...)`.

- [ ] **Step 5: Replace the submit handler's network section.** In `handleSubmit`, replace the block that currently runs validations and POSTs to FormSubmit — from `const nextErrors = runAllValidations(values);` down to the closing of the `catch (_err) { ... }` — with:

```ts
const nextErrors = validateEnquiry(values);
setErrors(nextErrors);
setTouched({ name: true, email: true, message: true });
const hasErrors = Object.values(nextErrors).some(Boolean);
if (hasErrors) {
  const firstInvalid = (['name', 'email', 'message'] as FieldName[]).find(
    (f) => nextErrors[f],
  );
  if (firstInvalid) {
    const el = form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`);
    if (el && typeof el.focus === 'function') el.focus();
  }
  showToast(
    'error',
    'A few things to fix first — check the highlighted fields below.',
  );
  return;
}

// Entering 'sending' invalidates any pending status-reset from a previous
// submit — it must not fire while this request is in flight.
window.clearTimeout(idleTimer.current);
setStatus('sending');

try {
  const res = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: values.name.trim(),
      email: values.email.trim(),
      message: values.message.trim(),
      _honey: (data.get('_honey') || '').toString(),
      elapsedMs: Date.now() - mountedAt.current,
    }),
  });
  const json: unknown = await res.json().catch(() => ({}));
  const payload = (typeof json === 'object' && json !== null ? json : {}) as {
    ok?: unknown;
    error?: unknown;
    fields?: unknown;
  };
  const ok = res.ok && payload.ok === true;

  if (ok) {
    setStatus('sent');
    setValues({ name: '', email: '', message: '' });
    setTouched({ name: false, email: false, message: false });
    setErrors({ name: null, email: null, message: null });
    scheduleIdle(4000);
    showToast(
      'success',
      'Message on the way — I’ll get back to you within 1–2 working days.',
    );
  } else {
    setStatus('error');
    scheduleIdle(5000);
    // Surface server-side field errors if present.
    if (payload.fields && typeof payload.fields === 'object') {
      setErrors((prev) => ({ ...prev, ...(payload.fields as FormErrors) }));
      setTouched({ name: true, email: true, message: true });
    }
    showToast(
      'error',
      typeof payload.error === 'string'
        ? payload.error
        : 'That didn’t go through. Give it another try in a moment.',
    );
  }
} catch (_err) {
  setStatus('error');
  scheduleIdle(5000);
  showToast(
    'error',
    'Couldn’t reach the inbox just now — try again in a moment.',
  );
}
```

Note: the existing honeypot short-circuit earlier in `handleSubmit` (the `if ((data.get('_honey') || '')...) { setStatus('sent'); scheduleIdle(4000); return; }` block) is **removed** — the server now owns honeypot handling. Keep the `const data = new FormData(form);` line (still used to read `_honey`).

- [ ] **Step 6: Delete the client honeypot short-circuit.** Remove this block from `handleSubmit` (just after `const data = new FormData(form);`):

```ts
// Honeypot trip: bots tend to fill every field. Humans can't see the
// _honey input, so any value here means a bot submitted. Pretend it
// succeeded so the bot moves on without retrying.
if ((data.get('_honey') || '').toString().length > 0) {
  setStatus('sent');
  scheduleIdle(4000);
  return;
}
```

- [ ] **Step 7: Typecheck + lint.**

Run: `npm run typecheck && npm run lint`
Expected: no errors (confirms no leftover references to the deleted `FormValues`/`runAllValidations`/`FORMSUBMIT_ENDPOINT`).

- [ ] **Step 8: Commit.**

```bash
git add src/components/ContactForm.tsx
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "refactor: post contact form to /api/contact and share validators with the server"
```

---

## Task 7: Gate + local verification

**Files:** none (verification only).

- [ ] **Step 1: Full gate.**

Run: `npm run check`
Expected: lint, format:check, typecheck, `npm audit --audit-level=high`, and build all pass; build lists `/api/contact`.

- [ ] **Step 2: Stop any preview dev server, then start the production server** (avoids the `next dev`-clobbers-`.next` gotcha):

```bash
# If a preview "Next Dev" server is running on 5170, stop it first
# (preview_stop), then:
npm run build && npm run start
```

- [ ] **Step 3: Run the curl matrix** against `http://localhost:3000/api/contact`. `.env.local` must hold all three vars. (Note: BotID does no real detection locally — every request passes the BotID gate; real bot-detection is verified on the preview deploy in Task 8. `x-forwarded-for` is absent on curl, so all requests share the `unknown` rate-limit bucket — handy for forcing 429.)

```bash
BASE=http://localhost:3000/api/contact
H='Content-Type: application/json'

# (a) method guard
curl -s -o /dev/null -w "method:%{http_code}\n" "$BASE"            # expect 405

# (b) honeypot → silent 200, no store/email
curl -s -w " honeypot:%{http_code}\n" -H "$H" -d '{"name":"Bot Bot","email":"b@b.co","message":"hi there friend","_honey":"x","elapsedMs":9000}' "$BASE"

# (c) too fast → silent 200, no store/email
curl -s -w " fast:%{http_code}\n" -H "$H" -d '{"name":"Quick Draw","email":"q@q.co","message":"hello there world","elapsedMs":10}' "$BASE"

# (d) invalid (one name) → 400 + fields
curl -s -w " invalid:%{http_code}\n" -H "$H" -d '{"name":"Madonna","email":"q@q.co","message":"hello there world","elapsedMs":9000}' "$BASE"

# (e) valid → 200, stores + emails
curl -s -w " valid:%{http_code}\n" -H "$H" -d '{"name":"Jane Doe","email":"jane@example.com","message":"Hello, I have a project in mind and would love to chat.","elapsedMs":9000}' "$BASE"

# (f) rate limit → 6 rapid valid submits, last is 429
for i in 1 2 3 4 5 6; do curl -s -o /dev/null -w "rl$i:%{http_code} " -H "$H" -d '{"name":"Jane Doe","email":"jane@example.com","message":"Another valid message here please.","elapsedMs":9000}' "$BASE"; done; echo
```

Expected: `405`, honeypot `200`, fast `200`, invalid `400`, valid `200`, and the rate-limit line ending `... rl6:429` (5×200 then 429).

- [ ] **Step 4: Confirm the enquiry persisted to Redis** (the valid submit in (e)):

```bash
set -a; source .env.local; set +a
curl -s "$UPSTASH_REDIS_REST_URL/keys/enquiry:*" -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
# expect a non-empty "result" array; then inspect TTL on one key:
KEY=$(curl -s "$UPSTASH_REDIS_REST_URL/keys/enquiry:*" -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" | sed -E 's/.*"(enquiry:[^"]+)".*/\1/')
curl -s "$UPSTASH_REDIS_REST_URL/ttl/$KEY" -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"   # expect ~2592000
```

Expected: at least one `enquiry:*` key; TTL near `2592000` (30 days). (Confirm the test email also arrived in the inbox.)

- [ ] **Step 5: Clean up the test enquiries** so they don't sit in the store:

```bash
set -a; source .env.local; set +a
for k in $(curl -s "$UPSTASH_REDIS_REST_URL/keys/enquiry:*" -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" | grep -oE 'enquiry:[0-9a-z-]+'); do curl -s "$UPSTASH_REDIS_REST_URL/del/$k" -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" >/dev/null; done; echo cleaned
```

- [ ] **Step 6:** No commit (verification only). If any branch misbehaved, fix the route/form and re-run from Step 1.

---

## Task 8: PR, Vercel verification, merge

**Files:** none.

- [ ] **Step 1: Push the branch.**

```bash
git push -u origin feat/phase2-contact-hardening
```

- [ ] **Step 2:** Remind the user to add the three env vars in Vercel **before** trusting the preview deploy (Settings → Environment Variables → Production + Preview; mark the token Sensitive): `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `CONTACT_FORMSUBMIT_ENDPOINT`. Without them the route 500s on the preview (config fail-fast).

- [ ] **Step 3: Open the PR** (`gh pr create`) — body: what/why, the pipeline + failure policy, the env-var requirement, and the local verification evidence from Task 7. Author commits `h.goretsov <gorecov4@gmail.com>`, no AI trailer.

- [ ] **Step 4: Verify CI green** (`gh pr checks`) and the **Vercel preview** deploy `READY`. Then exercise the real flow on the preview URL: submit the actual browser form (this is where BotID basic genuinely runs) → success toast → confirm the email arrives and an `enquiry:*` key appears in Redis. Clean up that test key afterward.

- [ ] **Step 5: Merge** only with check + CI green + preview verified. After merge: confirm the production deploy `READY` and submit once through `https://www.byhris.cc/contact` to confirm end-to-end in prod. Delete the branch.

- [ ] **Step 6: Post-merge hardening (ops, can follow immediately):** mint an Upstash **ACL-scoped token** limited to the commands the route uses (`EVAL`/`EVALSHA` for the rate limiter + `SET`/`GET` + `KEYS`/`SCAN` if used) and the `enquiry:*` / `ratelimit:contact:*` key prefixes, then replace `UPSTASH_REDIS_REST_TOKEN` in Vercel with it and redeploy. Enable Upstash account MFA. Update `docs/superpowers/BACKLOG.md` (Phase 2 done) + `~/Desktop/SESSION_HANDOFF.md`.

---

## Self-review notes

- **Spec coverage:** proxy route (T4), BotID basic (T4+T5), request-timer (T4+T6), rate-limit (T3+T4), Redis store + 30-day TTL (T3+T4), no index/no IP (T3/T4 data shape), shared validators (T2+T6), inbox out of bundle (T1 env + T6), region pin (T5), env contract (T1), fail-open/closed (T4), manual verification (T7), PR/verify/merge + ACL/MFA ops (T8). All spec sections map to a task.
- **Type consistency:** `EnquiryInput`/`FieldName`/`FormErrors` (validation.ts) → consumed unchanged by types.ts, the route, and ContactForm; `StoredEnquiry`/`ContactApiResponse` (types.ts) → used by redis.ts + route; `checkRateLimit`/`storeEnquiry`/`getContactConfig`/`ENQUIRY_TTL_SECONDS` names match across T3/T4.
- **No placeholders:** every code step is complete; the only "verify at implementation" item (exact `botid` import paths) is resolved — confirmed `botid/server` `checkBotId({ advancedOptions: { headers } })`, `botid/client/core` `initBotId`, `botid/next/config` `withBotId`.
