# By_Hris Designs — Rework Backlog / Roadmap

> Forward plan for the "Big Changes" rework. **Phase 1 (Next.js + TypeScript) is
> MERGED to `main` (PR #1) and LIVE in production** at https://www.byhris.cc as of
> 2026-06-09 — Vite→Next 15 + React 19, Pages Router, strict TS. Post-merge, a Vercel
> Framework-Preset fix (it was stuck on `vite`, breaking the deploy with a missing
> `dist` output error) got production green, and preview deployments were verified
> healthy. The migration branch has been deleted. **Phase 2 (contact-form
> hardening) is now also MERGED + live (PR #3); Phases 3–5 + fast-follows are
> not started** — see each phase's section below for status.
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

> **STATUS: MERGED to `main` (PR #3, merge `fae0ec2`) + deployed to production
> 2026-06-10.** `POST /api/contact` is live (region `fra1`); the client-side
> FormSubmit endpoint is retired (inbox no longer in the bundle). Verified:
> full pipeline locally against real Upstash + FormSubmit (store w/ 30-day TTL,
> email, rate-limit 429, validation, timer, honeypot); on production — region
> `fra1`, BotID active + clean (correctly 403s non-browser curl), site 200.
> Two platform fixes landed during verification: **BotID fails open** when
> off-platform/outage (`checkBotId` throws without Vercel's `x-vercel-oidc-token`),
> and the FormSubmit forward sends the site's canonical **Origin/Referer**
> (FormSubmit rejects server posts without one). **PENDING:** (1) one real
> **browser submit** on www.byhris.cc/contact to confirm BotID passes real users
> end-to-end (curl can't — BotID rejects it by design); (2) mint an Upstash
> **ACL-scoped token** + swap into Vercel; (3) enable Upstash account **MFA**.
> Spec/plan: `docs/superpowers/{specs,plans}/2026-06-10-phase2-contact-hardening*`.

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

**Scope — this is mainly a scoping decision (resolve in brainstorm):**

- **Option A — Hybrid (recommended):** add Tailwind (v4), map the existing CSS
  variables into the Tailwind theme as a token bridge, use Tailwind for _new/changed_
  code, and migrate `index.css` opportunistically. Lowest risk to parity.
- **Option B — Full 1:1 rewrite:** convert all ~45 components' classes to utilities
  and delete `index.css`. Big, risky, mostly mechanical; needs per-route visual diffs.
- Either way: Tailwind set up against the same tokens so colors/spacing/fonts are
  identical; verify visual parity per route.

**Dependencies:** Phase 1 merged.
**Acceptance:** pixel parity across routes + dark mode + breakpoints; Tailwind
available; (scope-dependent) `index.css` reduced or removed.
**Open questions:** full vs hybrid? (the pivotal call) · Tailwind v4 config approach.

---

## Phase 4 — Headless CMS (Works · Projects · Labs)

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

- **Nav-bar width = body width** (Medium change #8): match the header's inner
  max-width to the content container so the nav lines up with the body on **desktop +
  ultrawide**. Pure CSS; verify both breakpoints.
- **Component-level perf lazy-load** (#4 remainder): beyond the route-level splitting
  Next already does + the `ssr:false` widgets — defer any remaining heavy below-fold
  components. Revisit after Tailwind.
- **`next/image`**: adopt for the 11 `<img>` sites for image optimisation. Mind the
  deliberate eager-load hero decision and avoid layout shift (needs width/height or
  fill). Was intentionally deferred from the faithful port.
- **Dependency currency**: bump Next/React/etc. to latest patches once Phase 1 is
  merged + verified ("update to newer", the agreed post-merge step).

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
