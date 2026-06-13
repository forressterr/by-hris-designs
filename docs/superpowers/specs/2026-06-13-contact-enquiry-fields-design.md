# Contact enquiry fields + Resend templates — Design Spec

**Date:** 2026-06-13 · **Status:** approved (brainstorm) · **Roadmap:** `docs/superpowers/BACKLOG.md` → "Queued — Contact enquiry fields + Resend templates" (the last roadmap feature).

## Goal & context

Expand the `/contact` form from 3 fields to 7 and deliver enquiries through the user's two **Resend templates** (a styled internal notification + an auto-reply to the enquirer). The footer form (every page) stays the quick 3. Today `ContactForm` has name/email/message + a `variant` prop, and `email.ts` sends a plain-text notification; this adds the optional fields, the template wiring, and a courtesy auto-reply — all degrading gracefully when a template ID isn't configured.

Verified against the installed SDK (`resend@6.12.4`): `emails.send` accepts a template variant —
`{ template: { id: string; variables?: Record<string, string | number> }, to, from?, subject?, replyTo? }` — mutually exclusive with `html`/`text`/`react`.

## Locked decisions

- **Required:** Name, Email, Message. **Optional:** Company, Subject, Budget, Timeline.
- **Character policy — every field is text/numbers only; links, URLs, HTML, and markdown are rejected.** The form has **no file inputs** and the route reads only named text fields from JSON, so files/attachments are structurally impossible. The server re-validates as the gate (the client checks are UX only).
- **Footer stays the quick 3** (name/email/message) via a new `detailed` prop; `/contact` passes `detailed`.
- **Budget/Timeline are free-text** (allow numbers + units/currency, e.g. "~€5k", "Q3 2026") — not dropdowns.
- **Graceful templates:** if `RESEND_TEMPLATE_NOTIFY` is unset, fall back to today's plain-text notify; if `RESEND_TEMPLATE_AUTOREPLY` is unset, skip the auto-reply. The success contract is unchanged.

## Fields & per-field validation

| Field    | Required | Accepts                                           | Validator                    | Max  |
| -------- | -------- | ------------------------------------------------- | ---------------------------- | ---- |
| Name     | ★        | letters (+ space, apostrophe, hyphen), 2–3 parts  | `validateName` (existing)    | —    |
| Email    | ★        | email format                                      | `validateEmail` (existing)   | —    |
| Message  | ★        | text + numbers, no links/HTML/markdown            | `validateMessage` (existing) | 1500 |
| Company  | —        | text + numbers + basic punctuation, no links/HTML | `validateOptionalText` (new) | 100  |
| Subject  | —        | text + numbers + basic punctuation, no links/HTML | `validateOptionalText` (new) | 150  |
| Budget   | —        | numbers + text/units, no links/HTML               | `validateOptionalText` (new) | 60   |
| Timeline | —        | numbers + text, no links/HTML                     | `validateOptionalText` (new) | 60   |

`validateOptionalText(raw, maxLen)`: empty → valid (optional); else reject if it matches the existing link / domain / HTML-tag / markdown-link patterns (reused from `validateMessage`), or exceeds `maxLen`; otherwise valid. This is a **blocklist** of the dangerous shapes (links/HTML/markdown) rather than a rigid char-allowlist, so legitimate punctuation, diacritics, and currency symbols pass while "no links/html/files" is fully enforced.

## Module changes

| File                             | Change                                                                                                                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/contact/validation.ts`  | Add the 4 optional fields to `EnquiryInput`, `FieldName`, `FormErrors`; add `validateOptionalText` + the 4 validators; extend `VALIDATORS` + `validateEnquiry`. Export `REQUIRED_FIELDS` / `OPTIONAL_FIELDS` for the form to iterate. |
| `src/lib/contact/types.ts`       | `StoredEnquiry` already extends `EnquiryInput` (gains the 4 fields automatically) + add optional `sourcePage`.                                                                                                                        |
| `src/lib/contact/config.ts`      | Add `getResendTemplates()` → `{ notify?: string; autoReply?: string }` from `RESEND_TEMPLATE_NOTIFY` / `RESEND_TEMPLATE_AUTOREPLY`.                                                                                                   |
| `src/lib/contact/email.ts`       | `sendEnquiryEmail` → template variant when `notify` set, else plain-text fallback; new `sendAutoReplyEmail`; pure `buildTemplateVariables(enquiry)`.                                                                                  |
| `src/pages/api/contact.ts`       | Parse + validate the 4 fields; derive `sourcePage` from `Referer`; store the richer enquiry; call notify + auto-reply.                                                                                                                |
| `src/components/ContactForm.tsx` | Add `detailed?: boolean`; render the 4 fields only when `detailed`; extend `values`/`errors`/`touched` to 7 fields; send all fields (footer sends the extras empty).                                                                  |
| `src/pages/contact.tsx`          | `<ContactForm variant="light" detailed />`.                                                                                                                                                                                           |
| `.env.example`                   | Document `RESEND_TEMPLATE_NOTIFY` / `RESEND_TEMPLATE_AUTOREPLY`.                                                                                                                                                                      |

`Footer.tsx` is unchanged (`variant="dark"`, no `detailed`).

## Resend template variable mapping

`buildTemplateVariables(enquiry)` → `Record<string, string>` (the SDK allows `string | number`; we send strings; empty optionals → `"—"`):

| Variable           | Value                                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `name_sender`      | name                                                                                                                  |
| `email_sender`     | email                                                                                                                 |
| `company_sender`   | company or `"—"`                                                                                                      |
| `subject_sender`   | subject or `"—"`                                                                                                      |
| `project_budget`   | budget or `"—"`                                                                                                       |
| `project_timeline` | timeline or `"—"`                                                                                                     |
| `message`          | message with `\n` → `<br>`                                                                                            |
| `submitted_at`     | `createdAt` formatted human-readable (e.g. `Intl.DateTimeFormat('en-GB', { dateStyle:'medium', timeStyle:'short' })`) |
| `source_page`      | `Referer` pathname or `"—"` (lowercase `s` — exact)                                                                   |

Auto-reply (subset): `your_name` ← name; `project_topic` ← subject or `"your project"`; `response_time` ← `"1–2 working days"` (constant).

> Variable **names are case-sensitive** and must match the templates exactly. They come from the templates the user built (captured in the BACKLOG "Queued" section). The templates must be **Published** to send by ID.

## Email behaviour (`email.ts`)

- **Notify:** if `RESEND_TEMPLATE_NOTIFY` set → `resend.emails.send({ template:{ id, variables }, from: CONTACT_NOTIFY_FROM, to: CONTACT_NOTIFY_TO, replyTo: enquiry.email })` (pass `from` to force the verified sender). Else → today's plain-text send. Returns `true` only on accepted send; never throws.
- **Auto-reply:** if `RESEND_TEMPLATE_AUTOREPLY` set → `resend.emails.send({ template:{ id, variables:{ your_name, project_topic, response_time } }, from: CONTACT_NOTIFY_FROM, to: enquiry.email, replyTo: CONTACT_NOTIFY_TO })`. Else skip. Never throws; failure is logged only.

## Route pipeline (`api/contact.ts`) — additions only

Steps 1–5 (honeypot → BotID → timer → validation → rate-limit) unchanged except validation now covers 7 fields. Then:

- Build `enquiry` with the 4 new fields (trimmed) + `sourcePage` (from `Referer`).
- `storeEnquiry` (stores the richer record).
- `emailed = await sendEnquiryEmail(enquiry)` (notify). `void sendAutoReplyEmail(enquiry)` — **fire-and-forget**, awaited only enough to log; its outcome does **not** affect the response.
- **Success contract unchanged:** `200` if `stored || emailed`; else `502`.

## Form (`ContactForm.tsx`)

- New prop `detailed?: boolean` (default `false`). The footer omits it (quick 3); `/contact` sets it (all 7).
- `values`/`errors`/`touched` cover all 7 keys; the 4 optional fields render inside `{detailed && (…)}`.
- On submit, send all 7 (the footer's 4 extras are empty strings → server validates as optional → `"—"` in templates).
- Keep the honeypot, status machine, toast, char-counter, request-timer. Reuse the existing `field`/`field--invalid` styling for the new inputs (no new CSS expected; verify spacing on `/contact`).

## Verification

- `npm run check` — TypeScript enforces every field contract end-to-end (validation → types → route → form).
- `npm run test:e2e` — stubs `/api/contact`, so it stays green; add a light assertion that `/contact` renders the 4 extra fields and the footer does not.
- **Local:** prod server + a submit with the new fields → confirm `200`, the enquiry stored with the fields, and the route logs no errors. (Template rendering can't be fully checked locally without sending.)
- **Operator (you):** add the 2 template IDs to Vercel; on the preview/prod, submit a real enquiry → **confirm both emails arrive and render correctly** (notify with all fields; auto-reply to the enquirer). This is the only check of the actual template output.

## Scope / non-goals (YAGNI)

Budget/Timeline dropdowns · admin UI · enquiry index/pagination · extra template variables beyond the table · changing the footer to full · file uploads (explicitly excluded).

## Self-review

- **Placeholders:** none — fields, validators, max lengths, variable names, and SDK shape are all concrete.
- **Consistency:** `EnquiryInput`/`FieldName`/`FormErrors` extended in one place (`validation.ts`) and flow unchanged into `types.ts`, the route, and the form; `RESEND_TEMPLATE_NOTIFY`/`_AUTOREPLY` spelled identically in config, `.env.example`, and the mapping.
- **Requirement coverage:** required = name/email/message; optional = the 4 new; every field rejects links/HTML/markdown; no file inputs → no files; footer quick-3; graceful fallback; success contract unchanged. All map to a module change above.
- **Scope:** one focused feature, one PR.
