# By_Hris Designs — Rework Backlog / Roadmap

> Forward plan for the "Big Changes" rework. **Phase 1 (Next.js + TypeScript) is
> MERGED to `main` (PR #1) and LIVE in production** at https://www.byhris.cc as of
> 2026-06-09 — Vite→Next 15 + React 19, Pages Router, strict TS. Post-merge, a Vercel
> Framework-Preset fix (it was stuck on `vite`, breaking the deploy with a missing
> `dist` output error) got production green, and preview deployments were verified
> healthy. The migration branch has been deleted. **Phases 2 & 3 are MERGED + live**
> (contact-form hardening PR #3; Hybrid Tailwind PR #7), **SEO/metadata + /works
> routing** is merged (PR #8), and **all fast-follows are done** (PRs #9–12).
> **Phase 4 (Sanity CMS) was BUILT then ABANDONED + reverted 2026-06-12** (a CMS is
> overkill for this rarely-changing static portfolio; nothing merged, `main`
> untouched). **Phase 5 (health & integrity) is IN PROGRESS — Sentry first.** — see
> each phase's section below for status.
>
> **How to run each item:** one `superpowers` cycle per phase —
> `brainstorming → writing-plans → executing-plans` (or subagent-driven) — with the
> spec + plan saved under `docs/superpowers/{specs,plans}/`. Work on a branch per
> phase, open a PR, and **don't merge until verified**. Commits authored
> `h.goretsov <gorecov4@gmail.com>`, no AI co-author trailer, message describes only
> the changes. Run `npm run check` (lint + format + typecheck + audit-high + build)
> as the gate before every PR.
>
> **Hard dependency:** Phases 2 and 5 (anything server-side or framework-level)
> need **Phase 1 merged to `main`** first — ✅ now satisfied (Phase 1 merged + live).
> Phases 3 and 4 also assume the Next.js base is live — likewise satisfied.
>
> **Pre-Phase-2 baseline (DONE 2026-06-10):** house-rules skills installed
> (Claude Code plugin) + the repo is its own plugin marketplace
> (`.claude-plugin/` + `plugins/byhris-conventions`); ground-floor procedures
> adopted npm-adapted (editorconfig/gitattributes/vscode, commitlint +
> dependency-sync hooks, exact pins, CI mirroring `npm run check`, stricter
> tsconfig incl. `noUncheckedIndexedAccess`); house-rules quality pass applied
> (contact-form timer race fixed, dead code/stale comments removed, `any`
> banned with 3 justified boundary exceptions). Plan:
> `docs/superpowers/plans/2026-06-10-house-rules-ground-floor-baseline.md`.

---

## Phase 2 — Contact-form integrity (server-side) + Redis enquiry store

> **STATUS: MERGED + LIVE in production 2026-06-10** (PR #3 `fae0ec2`, plus
> hotfixes `68971d9`/`7e9fe0d`/`56a64d6`). `POST /api/contact` is live (region
> `fra1`); the client-side FormSubmit endpoint is retired. Pipeline: honeypot →
> BotID → request-timer → validation → rate-limit → **capture (store + email)**.
> **Success contract: an enquiry counts as received if it was stored OR emailed**
> — one missing/failing dependency can't 502 the form. Verified on production:
> site 200, region `fra1`, Upstash store working (30-day TTL), visitors get
> success.
>
> **Three things changed from the original plan during the live rollout:**
>
> 1. **Email transport: FormSubmit → Resend.** FormSubmit blocks Vercel's
>    datacenter IPs (the server fetch throws on every prod submit; works only
>    from a browser/residential IP). Switched to **Resend**; `byhris.cc` is a
>    **verified Resend domain** (DKIM/SPF/MX at GoDaddy), so it sends from
>    `notifications@byhris.cc` → `h.goretsov@gmail.com` (enquirer = replyTo).
> 2. **BotID is in MONITOR MODE (not blocking).** The client challenge wasn't
>    issuing tokens in prod, so `checkBotId()` flagged real browsers as bots and
>    403'd everyone. Now it logs but allows; honeypot + timer + rate-limit +
>    validation are the active defenses. Re-enable blocking once the client
>    challenge is confirmed working.
> 3. **Config degrades gracefully** (no fail-fast) so a missing env var can't
>    take the form down.
>
> **DONE:** `RESEND_API_KEY` in Vercel (Prod+Preview) + `byhris.cc` verified →
> email notifications live (from `notifications@byhris.cc` → `h.goretsov@gmail.com`);
> Upstash store + rate-limit live; MFA enabled. **Phase 2 functionally complete.**
>
> **Hardening — PR #17 MERGED 2026-06-13** (`docs/superpowers/{specs,plans}/2026-06-13-phase2-hardening*`):
> (1) BotID **enforce toggle** `CONTACT_BOTID_ENFORCE` (default off = monitor) + per-request verdict
> telemetry (`botid.verdict` tag + log) shipped — blocking is now one Vercel env flip away, with a
> safe Preview-first decide-path. (2) Upstash **ACL-scoped token** scope + runbook documented
> (`ACL SETUSER … +@read +@write +@scripting -@dangerous ~enquiry:* ~ratelimit:contact:*` → `ACL RESTTOKEN`).
> **▶ REMAINING = operator (no code):** run the BotID Preview→Prod decide-path; mint + swap the ACL token
> in Vercel (also the post-April-2026-incident rotation); propagate the rotated `RESEND_API_KEY` to
> Vercel + `.env.local`. (Earlier original-build spec/plan: `…/2026-06-10-phase2-contact-hardening*`.)

### Original scope (for reference)

**Original asks:** Vercel hidden captcha (bot captcha + request-timer + "proxy"); a
rate limiter on enquiries; a Redis DB to manage/answer incoming enquiries.

**Why now / context:** the contact form (`src/components/ContactForm.tsx`) currently
POSTs **client-side** straight to FormSubmit.co — there is no server. Phase 1 added
the Next.js server foundation, so this is now unblocked. There's already a honeypot and client-side validation to build on.

**Scope / suggested approach (all server-side, in a Next API route):**

- **Proxy endpoint** — add `src/pages/api/contact.ts` (Pages-Router API route). The
  form POSTs here instead of FormSubmit; the route forwards to the inbox. This hides
  the email/endpoint from the client bundle (resolves the long-standing "FormSubmit
  alias" item) and is where all the checks below live.
- **Hidden captcha** — integrate **Vercel BotID** (`@vercel/botid`, invisible
  challenge) and verify server-side in the route. (Cloudflare Turnstile is the
  fallback if BotID isn't preferred.)
- **Request-timer** — client stamps a "form rendered at" time; the route rejects
  submissions that arrive implausibly fast (classic bot tell). Pairs with the honeypot.
- **Rate limiter** — per-IP sliding-window limit via **`@upstash/ratelimit` + Upstash
  Redis** in the route (e.g. N submits / 10 min).
- **Redis enquiry store** — persist each enquiry to **Upstash Redis** (the same
  instance backing the rate limiter) with a status field, and/or forward to email.
  "Manage/answer" → at minimum store + email; a small admin view can be a follow-up.

**Dependencies:** Phase 1 merged · Upstash Redis (REST URL + token as Vercel env
vars) · Vercel BotID enabled on the project · decide email transport (keep proxied
FormSubmit, or switch to Resend/email API).

**Acceptance:** humans submit fine; bots blocked (BotID + honeypot + timer); rapid
repeats rate-limited; enquiries land in Redis + reach the inbox; no email/endpoint in
the client bundle.

**~~Open questions~~ RESOLVED (user decisions, 2026-06-10):** **keep FormSubmit,
proxied server-side** (swap to Resend stays possible later without touching the
form) · **Upstash Redis confirmed** (one instance backs the rate limiter + the
enquiry store; user creates the account and adds REST URL + token as Vercel env
vars) · **enquiry management = store + email only** (each enquiry persists to
Redis with a status field AND reaches the inbox; an admin view stays a possible
follow-up, not in scope).

**User-side unblockers before executing:** ~~create the Upstash database~~ ✅
(`by-hris-contact-database` — credentials live-verified 2026-06-10 via REST
PING + write/read/del round-trip; stored locally in the gitignored
`.env.local`) · **REMAINING: add the two env vars in the Vercel dashboard**
(Production + Preview, token marked Sensitive) · ~~enable BotID~~ — turns out
this is **not a dashboard task**: BotID _basic_ mode is configured purely in
code (`initBotId` client paths + `checkBotId()` in the route — Vercel's docs
use `/api/contact` with `checkLevel: 'basic'` as the example); the project
setting only governs the paid _deepAnalysis_ tier. Phase 2 defaults to basic
(paired with honeypot + request-timer + rate limit); revisit deepAnalysis only
if bots actually get through.

**Upstash provisioned (2026-06-10):** `by-hris-contact-database` — free tier,
GCP `europe-west1` (Belgium), TLS in transit. Security posture from Upstash's
"Strengthen Your Database Security" checklist (decided 2026-06-10):

- **Account MFA → enable now** (user-side, free; Upstash console → Settings).
- **Redis ACL → a Phase 2 execution step, not now:** once the route's exact
  command set is known (rate-limiter Lua/EVAL + enquiry reads/writes), create
  an ACL user restricted to those commands and the `ratelimit:*`/`enquiry:*`
  key prefixes, mint a REST token for that user, and put THAT in Vercel — the
  deployed app then can't `FLUSHALL` or touch other keys. (Scoping before the
  command set is known risks NOPERM breakage mid-build.)
- **Paywalled items — skipped, with reasons:** IP allowlist (also impractical:
  Vercel functions have no stable egress IPs without enterprise Secure
  Compute) · protect-credentials (single-owner account + MFA covers it) ·
  encryption-at-rest (mitigate instead: minimal-PII enquiry records + a
  retention/TTL purge for answered enquiries — see steady-state-purge) ·
  SOC-2 (compliance attestation, N/A for a personal portfolio).
- **Function region:** pin the contact route near the DB (e.g. `fra1`) —
  Vercel's default `iad1` would put a transatlantic round-trip on every Redis
  call.

---

## Phase 3 — Tailwind CSS

**Original ask:** convert the hand-built CSS to **Tailwind**, _without changing how
the app looks, works, or feels_.

**Why now / context:** styling is a single **3,741-line** `src/styles/index.css`
(global, BEM-ish classes + CSS custom-property design tokens like `--ink`, `--bg`,
`--line`). A literal 1:1 rewrite to utilities is large and **high-risk for low
user-visible payoff** given the "no visual change" constraint.

> **STATUS: MERGED + LIVE (PR #7, 2026-06-11).** Hybrid Tailwind v4 — no-Preflight
> selective import + `@theme inline` token bridge; Breadcrumbs migrated as the proof
> component. The Hybrid design below is the historical record.

**Concrete findings (from exploring the CSS):** `index.css` = 3,741 lines, single
file imported once in `_app.tsx`; tokens in `:root` (line ~73); **dark mode via
~20+ scattered `[data-theme='dark']` overrides**; **11 irregular breakpoints**
(600/699/700/720/767/768/800/899/900/1024/1100px); 5 `@keyframes`; 0 `@font-face`
(fonts via Google Fonts `<link>` in `_document.tsx`); 30 components; no existing
tailwind/postcss config. Those irregular breakpoints + scattered dark-mode rules
are exactly where a full utility rewrite would silently break parity → Hybrid.

**The Hybrid design (presented, pending final approval in the new chat):**

- **Tailwind v4 via `@tailwindcss/postcss`** (exact-pinned) + a `postcss.config.mjs`;
  CSS-first config (no `tailwind.config.js`).
- **DISABLE Preflight** — the crux of zero-visual-change. Don't `@import "tailwindcss"`
  (it ships Preflight, a reset that would restyle headings/lists/buttons). Instead
  import layers selectively at the top of `index.css`:
  `@layer theme, base, components, utilities;` +
  `@import 'tailwindcss/theme.css' layer(theme);` +
  `@import 'tailwindcss/utilities.css' layer(utilities);`. Utilities are JIT, so
  unused = no CSS; existing `index.css` untouched → setup changes nothing on screen.
- **Token bridge via `@theme`** referencing the existing vars:
  `@theme { --color-ink: var(--ink); --color-bg: var(--bg); --color-line: var(--line); … }`.
  Since `[data-theme='dark']` already overrides `--ink` et al., Tailwind color
  utilities (`bg-ink`, `text-line`) **flip in dark mode automatically** — no
  `dark:` needed for color. Still register
  `@custom-variant dark (&:where([data-theme='dark'] *))` for the rare explicit case.
- **Screens:** register the site's primary breakpoints (700/900/1024px) as custom
  `@theme` screens for NEW code; don't replicate all 11 — existing media queries
  in `index.css` stay as-is.
- **Proof, not big-bang:** migrate ONE simple component (e.g. `Breadcrumbs` or the
  `Logo` wrapper) to utilities and visually diff it light + dark, to prove the
  bridge yields pixel-identical output. Everything else stays on `index.css` and
  migrates organically when touched.
- **Out of scope (YAGNI):** rewriting the other 29 components, deleting `index.css`,
  replicating all 11 breakpoints, any visual change.

**Dependencies:** Phase 1 merged (✅).
**Acceptance:** zero visual change across every route × light/dark/breakpoints
(verify via `npm run build && npm run start` + per-route inspection); the proof
component's before/after pixel-diff matches; `npm run check` green; Tailwind
available for new code. No test framework (Phase 5).

---

## Phase 4 — Headless CMS (Works · Projects · Labs)

> **STATUS: BUILT then ABANDONED + REVERTED (2026-06-12).** A full Sanity CMS was
> built (embedded Studio, typed GROQ, on-demand revalidation, the `caseStudy: any`
> retired) — then the user decided a headless CMS is overkill for this
> rarely-changing static portfolio. Reverted entirely: PR #13 closed, branch
> deleted, **nothing merged**, `main` untouched. Recoverable at git `e7feba3`;
> durable Sanity gotchas (pin v5; dot-less doc IDs) are in the session memory.
> Don't re-pitch a CMS unless asked.

**Original ask:** a headless CMS for content edited often — Works, Projects, and the
Labs sub-pages.

**Why now / context:** content lives in **`src/data/projects.ts`** (~1,341 lines, the
single source of truth). The per-project `caseStudy` field is still typed
`Record<string, any>` (the last loose `any` from Phase 1) — a CMS schema retires it.

**Scope / suggested approach:**

- **Sanity** is the recommended CMS (first-class support in this environment — Sanity
  MCP + skills available; see the `sanity:*` skills). Model schemas for `Project`
  (slug, name, dates, the caseStudy sections), Labs nodes, and Works.
- Migrate `projects.ts` → Sanity Content Lake; fetch in `getStaticProps` with **ISR**
  so pages stay static/fast.
- Run **Sanity TypeGen** to generate types → replaces `caseStudy: Record<string, any>`
  with real types (tightens the last `any`).

**Dependencies:** Phase 1 merged · Sanity project + dataset + env vars · decide which
content moves to the CMS vs stays in code.
**Acceptance:** content editable in Sanity Studio; pages render from the CMS (SSG/ISR);
typed via TypeGen; **no visual change**.
**Open questions:** Sanity vs Contentful/Payload? · which content sets migrate first? ·
keep `projects.ts` as a fallback during migration?

---

## Phase 5 — Health & integrity: Sentry · E2E-in-CI · scheduled cron

> **STATUS: IN PROGRESS (2026-06-12).** Delivered as 3 incremental sub-projects:
> **(1) Sentry** — errors + performance, PII-scrubbed, source maps on Vercel only
> (branch `feat/phase5-sentry`) → **(2) Playwright E2E-in-CI** → **(3) randomised
> daily cron**. Spec: `docs/superpowers/specs/2026-06-12-phase5-sentry-design.md`.

**Original asks:** Sentry to catch production errors; E2E checks run via Git daily; a
CRON job scheduler with a **randomised start** for automated processes (the daily E2E).

**Scope / suggested approach:**

- **Sentry** — `@sentry/nextjs` (wizard sets up client + server + edge); capture API
  route errors too; upload source maps; DSN as a Vercel env var.
- **E2E** — **Playwright** smoke suite for the key flows (every route loads, nav +
  active states, contact form submit, theme toggle no-flash, Labs canvas mounts). Run
  in **GitHub Actions** on push/PR.
- **Scheduled / randomised cron** — a GitHub Actions `schedule:` workflow runs the E2E
  **daily**; add a **random jitter** (e.g. a first step that sleeps a randomised
  offset, or randomise the cron minute) so runs don't fire at a fixed instant. (For
  app-side scheduled jobs, **Vercel Cron** is the alternative.)

**Dependencies:** Phase 1 merged · GitHub Actions enabled · Sentry account + DSN ·
notification channel for failures.
**Acceptance:** prod errors surface in Sentry; E2E runs on PRs + daily (randomised
start) and fails loudly; the app has its first automated test coverage.
**Open questions:** E2E scope (smoke vs broad)? · failure notifications (email/Slack)? ·
GH Actions vs Vercel Cron for the "automated processes"?

---

## Fast-follows (small, low-risk — can be batched any time after Phase 1 merges)

> **STATUS (2026-06-13):** mostly done. The polish round
> (`docs/superpowers/{specs,plans}/2026-06-13-polish-deps-responsive*`) shipped the safe
> dependency bumps + a responsive spot-check (no issues found); next/image + lazy-load were
> already satisfied. Remaining: the nav-bar-width **design call** + the two deferred dependency
> **majors**.

- ✅ **`next/image`** — DONE (already in place): no raw `<img>` JSX remains; 7 components use
  `next/image` (`ProjectCard`, `SlideShow`, `ScrollViewport`, `ScreenSwitcher`, `AnnotatedImage`,
  `works.tsx`, `works/[slug].tsx`).
- ✅ **Component-level perf lazy-load** (#4 remainder) — DONE (already in place): the heaviest
  client-only pieces are `ssr:false` dynamic imports (`LiveTime`, `LabsCanvas`); nothing else
  warrants deferring.
- ◑ **Dependency currency** — safe bumps **shipped** (`tailwindcss` + `@tailwindcss/postcss`
  4.3.0→4.3.1, `lucide-react` 1.17→1.18; React already current). **Deferred majors (researched
  2026-06-13):** `eslint`/`@eslint/js` 9→**10** is **BLOCKED** — `eslint-plugin-react@7.37.5` (latest)
  caps its eslint peer at `^9.7`; no ESLint-10-compatible release exists yet (`typescript-eslint@8.61`,
  `eslint-plugin-react-hooks`, `@eslint/js@10` are all ready). Revisit when `eslint-plugin-react` ships
  ESLint 10 support. `next` 15→**16** is **dependency-feasible** (react 19.2.7 ✓, `@sentry/nextjs@10.57`
  peer `^16.0.0-0` ✓, `botid` peer `next:*` ✓) but deferred to a **dedicated session** — a framework
  major needs the Next codemod + full re-verification (build · E2E · Sentry · BotID · contact route).
- ✅ **Responsive spot-check** — verified 2026-06-13: zero horizontal overflow on all six pages at
  360/390/414px; at 2560px body text stays capped (~700–780px) and only the hero headline is
  intentionally large. No fixes needed.
- ✅ **Nav-bar width = body width** (Medium change #8) — DONE (already in place): `.site-header__inner`
  is capped to `--container-max` (1440px) + centred, matching `.container` / `.page-canvas`. Verified
  2026-06-13 at 2560px — header inner, container, and page-canvas all share identical edges (left 560 /
  right 2000); the logo + nav line up exactly with the body column (the frosted bar stays full-bleed).
  The earlier "open design call" note was a misread of a scaled screenshot.

---

## Queued — Contact enquiry fields + Resend templates (DEFERRED 2026-06-10)

**Ask:** richer contact enquiries + use the user's 3 Resend dashboard templates.
Deferred by the user mid-work ("leave for later"); parked here. Phase 2's contact
form is fully live without it (plain-text email from `notifications@byhris.cc`).

**The 3 templates** (built by the user in the Resend dashboard; HTML exports are in
the chat history of the 2026-06-10 session):

- **Internal notification** (form → owner). Vars (case-sensitive): `name_sender`,
  `email_sender`, `company_sender`, `subject_sender`, `project_budget`,
  `project_timeline`, `message`, `submitted_at`, `Source_page` (capital S).
- **Auto-reply** (form → enquirer). Vars: `your_name`, `project_topic`, `response_time`.
- **Manual reply** (owner replies by hand) — NOT form-driven; a tool the user uses
  in the Resend dashboard / mail client. Don't wire it.
- **Keep the "Trust me bro," / "Test me bro," sign-offs as-is** (deliberate touch —
  don't edit the template copy).

**Decision MADE: Option B — expand the form** to collect the extra fields (the
templates expect more than the current name/email/message).

- **Fields** (★ required; rest optional; ALL plain text, validated no-links/no-HTML
  like the message): Name★, Email★, Company, Subject, Budget, Timeline, Message★.
- **Variable mapping:** `name_sender`/`your_name` ← name; `email_sender` ← email;
  `company_sender` ← company; `subject_sender` **and** `project_topic` ← subject
  (empty → auto-reply says "your project"); `project_budget` ← budget;
  `project_timeline` ← timeline; `message` ← message (convert `\n`→`<br>` for the
  raw-HTML template var); `submitted_at` ← formatted `createdAt`; `Source_page` ←
  derive from the request `Referer`; `response_time` = constant "1–2 working days";
  empty optionals → "—".
- **OPEN design fork (decide first):** the `ContactForm` is in the **footer of every
  page** AND on `/contact`. Recommendation: contact page = full form (all fields);
  **footer stays the quick 3** (name/email/message) via a `detailed` prop — footer
  enquiries send "—" for the extras. (Veto options: both full, or both quick.)

**Resend template-by-ID mechanics** (verified against docs): `emails.send` accepts
`template: { id, variables }` instead of `html`/`text`; template must be
**Published**; variable names are **case-sensitive**; `from`/`subject`/`reply_to`
you pass override the template's. Plan: store the 2 template IDs as env vars
(`RESEND_TEMPLATE_NOTIFY`, `RESEND_TEMPLATE_AUTOREPLY`) → Vercel + `.env.local`;
graceful fallback to plain-text if absent.

**BLOCKED ON USER:** the **two template IDs/aliases** (internal-notification +
auto-reply) — the user hadn't provided them when this was deferred.

**Touches:** `validation.ts` (new field validators), `types.ts` (`EnquiryInput` +
`StoredEnquiry` gain the fields), `ContactForm.tsx` (new inputs + `detailed` prop),
`api/contact.ts` (parse/validate/store + Referer), `email.ts` (`sendEnquiryEmail`
→ notify template; add `sendAutoReplyEmail` → auto-reply template). Run as a
branch + PR. Sources: resend.com/docs/api-reference/emails/send-email +
/docs/dashboard/templates/template-variables.

---

## Cross-cutting context (decisions already made — don't re-litigate)

- **Stack:** Next.js 15 (Pages Router), React 19, TypeScript strict, framer-motion 12,
  @xyflow/react 12, Vercel hosting. Dev: `npm run dev` (**port 5170** via the preview
  launch config, or 3000 plain). Prod check: `npm run build && npm run start`.
- **Pages Router** (not App Router) — chosen for the route-exit `AnimatePresence`
  transition + the app being ~entirely client-interactive.
- **Server foundation exists now** (Next API routes) → unblocks Phase 2 + Sentry-server.
- **SSR gotchas pattern** (reuse for any new client-only/`window`/`Date` code):
  `next/dynamic({ ssr: false })` for browser-only widgets, mounted-gate for
  render output that depends on client-only values (see `Parallax`, `ThemeToggle`,
  `LiveTime`).
- **Pragmatic `any`s to retire:** polymorphic `motion[as]` cast in
  `Parallax`/`Reveal` (low priority — framer limitation); `caseStudy: Record<string,
any>` in `src/types/content.ts` (retire in Phase 4 via Sanity TypeGen).
- **Dev-preview gotcha:** screenshots can be blank under React StrictMode +
  AnimatePresence — verify via `next build` + HTML/console inspection, and prefer
  manual visual passes over driving the browser.
- **Suggested order:** merge Phase 1 → Phase 2 (the original anti-spam ask, highest
  user value) → fast-follows / Phase 3 → Phase 4 → Phase 5.
