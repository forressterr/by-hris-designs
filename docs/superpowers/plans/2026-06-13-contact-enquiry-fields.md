# Contact enquiry fields + Resend templates — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand `/contact` to 7 fields (3 required + 4 optional, all text/numbers, links/HTML/markdown rejected) and deliver enquiries via the two Resend templates (notify + auto-reply), with graceful plain-text fallback. Footer stays the quick 3.

**Architecture:** Extend the shared `src/lib/contact/` core (validation, types, config, email) then thread the new fields through the route + form. The footer (`variant="dark"`) renders the quick 3; `/contact` passes a new `detailed` prop to render all 7. Email switches to the template variant when a template ID is configured, else falls back to today's plain text.

**Tech Stack:** Next.js 15 (Pages Router), React 19, strict TS, `resend@6.12.4` (template send variant), `@upstash/redis`.

**Spec:** `docs/superpowers/specs/2026-06-13-contact-enquiry-fields-design.md`

**Branch:** `feat/contact-enquiry-fields` (already created; spec commit is on it).

**Testing note:** No unit-test runner (Playwright E2E only; `e2e/contact.spec.ts` stubs `/api/contact`). Verification = `npm run check` (TypeScript enforces every field contract) + `npm run test:e2e` (+ a light assertion that `/contact` shows the 4 fields) + a local prod-server smoke + the operator's real-email eyeball on preview. Consistent with the Phase 2/5 convention.

**Conventions:** commits authored `h.goretsov <gorecov4@gmail.com>`, conventional messages (header ≤ 100 chars), no AI trailer; `npm run check` green before the PR; merge is the user's call.

---

## Task 1: Validation — 4 optional fields + `validateOptionalText`

**Files:** Modify `src/lib/contact/validation.ts`.

- [ ] **Step 1: Rewrite `src/lib/contact/validation.ts`** to the full content below (extends the field set, factors the forbidden-content check into a shared helper used by both the message and the optional fields, and exports the required/optional lists):

```ts
// Shared contact-form validation — the single source of truth used by both
// the client (live UX validation in ContactForm) and the server (the
// /api/contact security gate). Pure functions, no I/O.

export const MAX_MESSAGE_LENGTH = 1500;

export type FieldName =
  | 'name'
  | 'email'
  | 'message'
  | 'company'
  | 'subject'
  | 'budget'
  | 'timeline';

export interface EnquiryInput {
  name: string;
  email: string;
  message: string;
  company: string;
  subject: string;
  budget: string;
  timeline: string;
}

export type FormErrors = Record<FieldName, string | null>;

/** Required = the original three; the rest are optional (empty is valid). */
export const REQUIRED_FIELDS: FieldName[] = ['name', 'email', 'message'];
export const OPTIONAL_FIELDS: FieldName[] = [
  'company',
  'subject',
  'budget',
  'timeline',
];

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

// Every field rejects links, HTML, and markdown — the universal "text/numbers
// only, no links/html" rule. Returns the specific message or null.
function forbiddenContentError(value: string): string | null {
  if (URL_SCHEME_PATTERN.test(value) || DOMAIN_LIKE_PATTERN.test(value)) {
    return 'Please don’t include links or domains.';
  }
  if (HTML_TAG_PATTERN.test(value)) return 'HTML tags aren’t allowed.';
  if (MARKDOWN_LINK_PATTERN.test(value))
    return 'Please don’t include markdown links.';
  return null;
}

export function validateName(raw: string): string | null {
  const value = raw.trim();
  if (!value) return 'Please enter your name.';
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return 'Please enter at least 2 names (e.g. John Doe).';
  if (parts.length > 3) return 'Up to 3 names, please.';
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
  return forbiddenContentError(value);
}

/**
 * Optional free-text field: empty is valid; otherwise it must be within
 * `maxLength` and contain no links, HTML, or markdown (text/numbers only).
 */
export function validateOptionalText(
  raw: string,
  maxLength: number,
): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (value.length > maxLength) {
    return `Keep it under ${maxLength} characters (currently ${value.length}).`;
  }
  return forbiddenContentError(value);
}

export const validateCompany = (raw: string): string | null =>
  validateOptionalText(raw, 100);
export const validateSubject = (raw: string): string | null =>
  validateOptionalText(raw, 150);
export const validateBudget = (raw: string): string | null =>
  validateOptionalText(raw, 60);
export const validateTimeline = (raw: string): string | null =>
  validateOptionalText(raw, 60);

export const VALIDATORS: Record<FieldName, (raw: string) => string | null> = {
  name: validateName,
  email: validateEmail,
  message: validateMessage,
  company: validateCompany,
  subject: validateSubject,
  budget: validateBudget,
  timeline: validateTimeline,
};

export function validateEnquiry(values: EnquiryInput): FormErrors {
  return {
    name: VALIDATORS.name(values.name),
    email: VALIDATORS.email(values.email),
    message: VALIDATORS.message(values.message),
    company: VALIDATORS.company(values.company),
    subject: VALIDATORS.subject(values.subject),
    budget: VALIDATORS.budget(values.budget),
    timeline: VALIDATORS.timeline(values.timeline),
  };
}
```

- [ ] **Step 2: Typecheck.** Run `npm run typecheck` — expect errors in `ContactForm.tsx` / `api/contact.ts` (they construct `EnquiryInput` with only 3 keys — fixed in Tasks 5–6). The `validation.ts` file itself must be error-free. (Proceed; the consumers are updated next.)

- [ ] **Step 3: Commit.**

```bash
git add src/lib/contact/validation.ts
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "feat: add optional contact fields + shared optional-text validator"
```

---

## Task 2: Types — `sourcePage` on the stored record

**Files:** Modify `src/lib/contact/types.ts`.

- [ ] **Step 1: Update `src/lib/contact/types.ts`** — `StoredEnquiry` auto-gains the 4 new fields via `EnquiryInput`; add `sourcePage`:

```ts
import type { EnquiryInput, FieldName } from './validation';

/** An enquiry as persisted to Redis. */
export interface StoredEnquiry extends EnquiryInput {
  id: string;
  createdAt: string; // ISO-8601
  sourcePage: string; // page the form was submitted from (Referer path) or '—'
}

/** The /api/contact JSON response contract. */
export type ContactApiResponse =
  | { ok: true }
  | { ok: false; error: string; fields?: Partial<Record<FieldName, string>> };
```

- [ ] **Step 2: Commit.**

```bash
git add src/lib/contact/types.ts
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "feat: add sourcePage to StoredEnquiry"
```

---

## Task 3: Config — template-ID getter

**Files:** Modify `src/lib/contact/config.ts`.

- [ ] **Step 1: Append to `src/lib/contact/config.ts`** (after `isBotIdEnforced`):

```ts
/**
 * Resend template IDs (optional). When a template ID is absent the email layer
 * degrades — notify falls back to plain text, auto-reply is skipped.
 */
export function getResendTemplates(): { notify?: string; autoReply?: string } {
  return {
    notify: process.env.RESEND_TEMPLATE_NOTIFY,
    autoReply: process.env.RESEND_TEMPLATE_AUTOREPLY,
  };
}
```

- [ ] **Step 2: Commit.**

```bash
git add src/lib/contact/config.ts
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "feat: add Resend template-id config getter"
```

---

## Task 4: Email — template send (notify + auto-reply) with fallback

**Files:** Rewrite `src/lib/contact/email.ts`.

- [ ] **Step 1: Replace `src/lib/contact/email.ts`** with:

```ts
// Email for a contact enquiry, via Resend (server-side; unlike FormSubmit it
// isn't IP-blocked from datacenters). Best-effort: never throws; returns false
// when email isn't configured or the send fails, so the route can fall back to
// the Redis store as the durable record.
//
// When RESEND_TEMPLATE_NOTIFY is set the notification is sent via the styled
// Resend template; otherwise it falls back to a plain-text send. A separate
// auto-reply to the enquirer is sent only when RESEND_TEMPLATE_AUTOREPLY is set.

import { Resend } from 'resend';
import {
  CONTACT_NOTIFY_FROM,
  CONTACT_NOTIFY_TO,
  getResendApiKey,
  getResendTemplates,
} from './config';
import type { StoredEnquiry } from './types';

const DATE_FMT = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const orDash = (value: string): string => value.trim() || '—';

// The `message` variable is interpolated into the template as raw HTML, so
// escape it first (validation already blocks tags/links, this is defense in
// depth) then turn newlines into <br>.
function messageHtml(message: string): string {
  const escaped = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(/\n/g, '<br>');
}

/** Variables for the internal-notification template (names are case-sensitive). */
function notifyVariables(enquiry: StoredEnquiry): Record<string, string> {
  return {
    name_sender: enquiry.name,
    email_sender: enquiry.email,
    company_sender: orDash(enquiry.company),
    subject_sender: orDash(enquiry.subject),
    project_budget: orDash(enquiry.budget),
    project_timeline: orDash(enquiry.timeline),
    message: messageHtml(enquiry.message),
    submitted_at: DATE_FMT.format(new Date(enquiry.createdAt)),
    source_page: orDash(enquiry.sourcePage),
  };
}

/** Send the enquiry to the inbox. Returns true only if Resend accepted it. */
export async function sendEnquiryEmail(
  enquiry: StoredEnquiry,
): Promise<boolean> {
  const apiKey = getResendApiKey();
  if (!apiKey) return false;
  const { notify } = getResendTemplates();

  try {
    const resend = new Resend(apiKey);
    const { data, error } = notify
      ? await resend.emails.send({
          from: CONTACT_NOTIFY_FROM,
          to: CONTACT_NOTIFY_TO,
          replyTo: enquiry.email,
          template: { id: notify, variables: notifyVariables(enquiry) },
        })
      : await resend.emails.send({
          from: CONTACT_NOTIFY_FROM,
          to: CONTACT_NOTIFY_TO,
          replyTo: enquiry.email,
          subject: `Contact Form Enquiry — ${enquiry.name}`,
          text: `From: ${enquiry.name} <${enquiry.email}>\n\n${enquiry.message}`,
        });
    if (error) {
      console.error('[contact] Resend notify failed:', error.message);
      return false;
    }
    return Boolean(data?.id);
  } catch (err) {
    console.error(
      '[contact] Resend notify threw:',
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}

/**
 * Send the courtesy auto-reply to the enquirer. Best-effort + fire-and-forget:
 * skipped when no template is configured; never throws; its result must not
 * affect whether the enquiry counts as received.
 */
export async function sendAutoReplyEmail(
  enquiry: StoredEnquiry,
): Promise<void> {
  const apiKey = getResendApiKey();
  const { autoReply } = getResendTemplates();
  if (!apiKey || !autoReply) return;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: CONTACT_NOTIFY_FROM,
      to: enquiry.email,
      replyTo: CONTACT_NOTIFY_TO,
      template: {
        id: autoReply,
        variables: {
          your_name: enquiry.name,
          project_topic: enquiry.subject.trim() || 'your project',
          response_time: '1–2 working days',
        },
      },
    });
    if (error)
      console.error('[contact] Resend auto-reply failed:', error.message);
  } catch (err) {
    console.error(
      '[contact] Resend auto-reply threw:',
      err instanceof Error ? err.message : err,
    );
  }
}
```

- [ ] **Step 2: Typecheck.** Run `npm run typecheck` — `email.ts` must be clean (confirms the `template` send variant typechecks). Consumer errors elsewhere are expected until Task 5.

- [ ] **Step 3: Commit.**

```bash
git add src/lib/contact/email.ts
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "feat: send contact emails via Resend templates with plain-text fallback + auto-reply"
```

---

## Task 5: Route — parse the new fields, derive sourcePage, send both emails

**Files:** Modify `src/pages/api/contact.ts`.

- [ ] **Step 1: Add the auto-reply import.** Change the email import line:

```ts
import { sendEnquiryEmail } from '../../lib/contact/email';
```

to:

```ts
import { sendEnquiryEmail, sendAutoReplyEmail } from '../../lib/contact/email';
```

- [ ] **Step 2: Add a Referer→path helper.** Just after the `getClientIp` function, add:

```ts
function getSourcePage(req: NextApiRequest): string {
  const ref = req.headers.referer;
  if (typeof ref !== 'string' || !ref) return '—';
  try {
    return new URL(ref).pathname || '—';
  } catch {
    return '—';
  }
}
```

- [ ] **Step 3: Build the full `EnquiryInput` in the validation step.** Replace the existing `const input: EnquiryInput = { name, email, message }` block with all 7 fields:

```ts
const input: EnquiryInput = {
  name: str(body.name),
  email: str(body.email),
  message: str(body.message),
  company: str(body.company),
  subject: str(body.subject),
  budget: str(body.budget),
  timeline: str(body.timeline),
};
```

(`validateEnquiry(input)` now covers all 7; the `fields` error map already iterates `Object.entries(errors)`, so it surfaces the new fields automatically.)

- [ ] **Step 4: Extend the stored enquiry + send both emails.** Replace the `const enquiry: StoredEnquiry = { … }` literal and the email send (the `const emailed = await sendEnquiryEmail(enquiry);` line) with:

```ts
const enquiry: StoredEnquiry = {
  id: `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
  name: input.name.trim(),
  email: input.email.trim(),
  message: input.message.trim(),
  company: input.company.trim(),
  subject: input.subject.trim(),
  budget: input.budget.trim(),
  timeline: input.timeline.trim(),
  createdAt: new Date().toISOString(),
  sourcePage: getSourcePage(req),
};
```

…and where the email is sent:

```ts
const emailed = await sendEnquiryEmail(enquiry);
// Courtesy auto-reply — fire-and-forget; its outcome must not change the
// success contract (received = stored OR notify-emailed).
void sendAutoReplyEmail(enquiry);
```

(Keep the existing store block above it and the `if (!stored && !emailed) … 502` contract below it unchanged.)

- [ ] **Step 5: Typecheck + build.** Run `npm run typecheck && npm run build` — expect no errors; build lists `ƒ /api/contact`.

- [ ] **Step 6: Commit.**

```bash
git add src/pages/api/contact.ts
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "feat: parse enquiry fields, derive source page, send notify + auto-reply"
```

---

## Task 6: ContactForm — `detailed` prop + the 4 optional fields

**Files:** Modify `src/components/ContactForm.tsx`.

- [ ] **Step 1: Add the `detailed` prop.** Change the component signature:

```ts
export default function ContactForm({
  variant = 'light',
}: {
  variant?: 'light' | 'dark';
}) {
```

to:

```ts
export default function ContactForm({
  variant = 'light',
  detailed = false,
}: {
  variant?: 'light' | 'dark';
  detailed?: boolean;
}) {
```

- [ ] **Step 2: Widen the touched type + all three initial states to 7 fields.** Change:

```ts
type FormTouched = { name: boolean; email: boolean; message: boolean };
```

to:

```ts
type FormTouched = Record<FieldName, boolean>;

const EMPTY_VALUES: EnquiryInput = {
  name: '',
  email: '',
  message: '',
  company: '',
  subject: '',
  budget: '',
  timeline: '',
};
const NO_ERRORS: FormErrors = {
  name: null,
  email: null,
  message: null,
  company: null,
  subject: null,
  budget: null,
  timeline: null,
};
const NOT_TOUCHED: FormTouched = {
  name: false,
  email: false,
  message: false,
  company: false,
  subject: false,
  budget: false,
  timeline: false,
};
```

Then change the three `useState` initialisers to use them:

```ts
const [values, setValues] = useState<EnquiryInput>(EMPTY_VALUES);
const [errors, setErrors] = useState<FormErrors>(NO_ERRORS);
const [touched, setTouched] = useState<FormTouched>(NOT_TOUCHED);
```

- [ ] **Step 3: Update the submit handler's touched-all + reset + POST.** In `handleSubmit`:
  - Replace `setTouched({ name: true, email: true, message: true });` with `setTouched({ name: true, email: true, message: true, company: true, subject: true, budget: true, timeline: true });`
  - Replace the first-invalid list `(['name', 'email', 'message'] as FieldName[])` with `(['name', 'email', 'message', 'company', 'subject', 'budget', 'timeline'] as FieldName[])`
  - In the success branch, replace the three reset calls with `setValues(EMPTY_VALUES); setTouched(NOT_TOUCHED); setErrors(NO_ERRORS);`
  - In the `fetch` body, add the four fields after `message`:

```ts
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          message: values.message.trim(),
          company: values.company.trim(),
          subject: values.subject.trim(),
          budget: values.budget.trim(),
          timeline: values.timeline.trim(),
          _honey: (data.get('_honey') || '').toString(),
          elapsedMs: Date.now() - mountedAt.current,
        }),
```

- [ ] **Step 4: Render the 4 optional fields (only when `detailed`).** Insert this block between the email `</label>` and the message `<label>` (so the order is Name, Email, Company, Subject, Budget, Timeline, Message):

```tsx
{
  detailed &&
    (
      [
        {
          field: 'company',
          placeholder: 'Company (optional)',
          autoComplete: 'organization',
        },
        {
          field: 'subject',
          placeholder: 'Subject (optional)',
          autoComplete: 'off',
        },
        {
          field: 'budget',
          placeholder: 'Budget (optional, e.g. ~€5k)',
          autoComplete: 'off',
        },
        {
          field: 'timeline',
          placeholder: 'Timeline (optional, e.g. Q3 2026)',
          autoComplete: 'off',
        },
      ] as { field: FieldName; placeholder: string; autoComplete: string }[]
    ).map(({ field, placeholder, autoComplete }) => (
      <label key={field} className={fieldClass(field)}>
        <span className="visually-hidden">{placeholder}</span>
        <input
          type="text"
          name={field}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={values[field]}
          onChange={handleChange(field)}
          onBlur={handleBlur(field)}
          aria-invalid={errors[field] && touched[field] ? 'true' : 'false'}
          aria-describedby={
            errors[field] && touched[field]
              ? `contact-${field}-error`
              : undefined
          }
        />
        {errors[field] && touched[field] && (
          <span
            id={`contact-${field}-error`}
            className="field__error"
            role="alert"
          >
            {errors[field]}
          </span>
        )}
      </label>
    ));
}
```

(`handleChange`/`handleBlur`/`fieldClass` already take a `FieldName` and work unchanged for the new fields.)

- [ ] **Step 5: Typecheck + lint.** Run `npm run typecheck && npm run lint` — expect no errors (confirms the 7-field state + the new JSX are type-correct).

- [ ] **Step 6: Commit.**

```bash
git add src/components/ContactForm.tsx
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "feat: add detailed ContactForm variant with company/subject/budget/timeline"
```

---

## Task 7: Wire `/contact` to the detailed form + document env

**Files:** Modify `src/pages/contact.tsx`, `.env.example`.

- [ ] **Step 1: `src/pages/contact.tsx`** — change `<ContactForm variant="light" />` to:

```tsx
<ContactForm variant="light" detailed />
```

- [ ] **Step 2: Document the template env vars in `.env.example`** — add after the `# CONTACT_BOTID_ENFORCE=` block (inside the Phase 2 section):

```
#
# Resend templates (optional). When set, the contact route sends via these
# published templates instead of plain text; absent → plain-text notify, no
# auto-reply. IDs from the Resend dashboard → Templates.
# RESEND_TEMPLATE_NOTIFY=
# RESEND_TEMPLATE_AUTOREPLY=
```

- [ ] **Step 3: Commit.**

```bash
git add src/pages/contact.tsx .env.example
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "feat: enable detailed contact form on /contact; document template env"
```

---

## Task 8: Gate + local verification

**Files:** none (verification). Add the template IDs to `.env.local` first (local only, gitignored):

```
RESEND_TEMPLATE_NOTIFY=30e655fe-afe5-4f8a-8085-9c6bc4b8ef3f
RESEND_TEMPLATE_AUTOREPLY=1e13736c-60df-4a90-ab16-ce01203f0fdc
```

- [ ] **Step 1: Full gate.** Run `npm run check` — lint · format:check · typecheck · audit-high · build all green.

- [ ] **Step 2: Prod-server smoke.** `npm run build && npm run start`, then a valid detailed submit (BotID throws off-platform → verdict error → continues; this exercises validate → store → email):

```bash
BASE=http://localhost:3000/api/contact
H='Content-Type: application/json'
curl -s -w " full:%{http_code}\n" -H "$H" -H 'Referer: http://localhost:3000/contact' -d '{"name":"Jane Doe","email":"jane@example.com","message":"Hello, I have a project in mind.","company":"Acme 3","subject":"New site","budget":"~€5k","timeline":"Q3 2026","elapsedMs":9000}' "$BASE"
# link-rejection on an optional field → 400 + fields.company
curl -s -w " badco:%{http_code}\n" -H "$H" -d '{"name":"Jane Doe","email":"jane@example.com","message":"hello there world","company":"see https://x.com","elapsedMs":9000}' "$BASE"
```

Expected: `full:200`; `badco:400`. Confirm the `full` enquiry stored with the new fields (SCAN/GET an `enquiry:*` key) and the server log shows no Resend error (if the new key is in `.env.local`, the notify + auto-reply actually send — check the inbox + the enquirer address). Clean up the test key afterward.

- [ ] **Step 3: Stop the server.** `lsof -ti tcp:3000 | xargs -r kill`. No commit (verification only). Fix + re-run if anything failed.

---

## Task 9: E2E assertion, PR, operator handoff

**Files:** Modify `e2e/smoke.spec.ts` (light assertion).

- [ ] **Step 1: Add a field-presence assertion** to `e2e/smoke.spec.ts` — `/contact` shows the 4 detailed inputs; the home footer does not. Append:

```ts
test('the contact page shows the detailed enquiry fields', async ({ page }) => {
  await page.goto('/contact');
  for (const name of ['company', 'subject', 'budget', 'timeline']) {
    await expect(page.locator(`input[name="${name}"]`)).toBeVisible();
  }
});

test('the footer form stays the quick three', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('input[name="company"]')).toHaveCount(0);
});
```

- [ ] **Step 2: Run E2E.** `npm run test:e2e` — all pass (the stub for `/api/contact` is unchanged; the new tests assert field presence only).

- [ ] **Step 3: Commit, push, PR.**

```bash
git add e2e/smoke.spec.ts
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "test: assert detailed contact fields on /contact, quick-3 in footer"
git push -u origin feat/contact-enquiry-fields
gh pr create --base main --title "feat: contact enquiry fields + Resend templates" --body "<summary: 7-field /contact form (3 required + 4 optional, text/numbers only, links/HTML rejected); footer stays quick-3; Resend notify + auto-reply templates with plain-text fallback; success contract unchanged. Operator: add RESEND_TEMPLATE_NOTIFY + RESEND_TEMPLATE_AUTOREPLY to Vercel. Test plan: npm run check + e2e green; local smoke 200/400.>"
```

- [ ] **Step 4: Verify CI + Vercel** (`gh pr checks <pr> --watch`): `check` + `e2e` green, preview READY. **Operator:** add `RESEND_TEMPLATE_NOTIFY` + `RESEND_TEMPLATE_AUTOREPLY` to Vercel (Prod+Preview) before/at merge, then submit a real enquiry on the preview → confirm both emails arrive + render. Merge is the user's call. After merge: update BACKLOG (close the "Queued" item) + handoff.

---

## Self-review

- **Spec coverage:** required/optional fields → T1; per-field validation + `validateOptionalText` → T1; `sourcePage` → T2/T5; template config → T3; notify-template + fallback + auto-reply + variable mapping (incl. `source_page` lowercase) → T4; route parse/derive/store/send → T5; `detailed` form + 4 fields → T6; `/contact` wiring + env doc → T7; verification → T8/T9; operator template-IDs → T8/T9. All covered.
- **Type consistency:** `EnquiryInput` (7 string fields) / `FieldName` / `FormErrors` defined in T1 and consumed unchanged by types.ts (T2), email.ts (T4), the route (T5), and the form (T6); `EMPTY_VALUES`/`NO_ERRORS`/`NOT_TOUCHED` cover the same 7 keys; template var names match the spec table (`source_page` lowercase).
- **No placeholders:** every code step is complete; the PR body is the only `<…>` (filled at execution from the result).
