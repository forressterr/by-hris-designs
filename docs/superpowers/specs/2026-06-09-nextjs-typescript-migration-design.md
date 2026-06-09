# Next.js + TypeScript Migration (Faithful Port) — Design Spec

- **Date:** 2026-06-09
- **Status:** Design approved → pending implementation plan
- **Project:** By_Hris Designs portfolio (React 18.3 + Vite 5, react-router-dom 6)
- **Source:** User "Big Changes" rework request — codebase to Next.js, `.jsx` → TypeScript. This is **Phase 1 of a multi-phase roadmap** (see _Roadmap context_); it is the foundation the later server-side phases ride on.

## Context

The site is a client-rendered SPA: React 18.3.1 + Vite 5 + react-router-dom 6, ~7,500 LOC across ~45 `.jsx`/`.js` files. It is deployed on Vercel at `https://www.byhris.cc`, already has client-side SEO (per-route `document.title` + canonical), route-level code-splitting (`React.lazy` per route in `App.jsx`), and esbuild JS/CSS minification (`vite.config.js`). Styling is a single 3,741-line global stylesheet (`src/styles/index.css`).

The user has chosen to migrate to Next.js **first**, as the foundation for later phases (contact-form server hardening, Redis, CMS, observability) that all require server-side code the current static SPA lacks. This spec covers **only** the framework + language migration.

## Goals

- Port the app to **Next.js (Pages Router) + TypeScript (`strict: true`)**.
- **Zero intended change** to behavior, layout, animation, copy, or visuals. The site must look, work, and feel identical.
- Keep the existing global stylesheet (`src/styles/index.css`) **verbatim** — imported once in `_app.tsx`.
- Preserve the route-level page transition (`AnimatePresence mode="wait"`) exactly.
- Preserve the no-flash theming, per-route titles, and per-route canonical URLs (the migration moves these to idiomatic Next mechanisms but keeps identical user-visible output).
- Keep `src/data/projects.js` as the single source of truth.
- Carry the existing quality gate forward and strengthen it with a TypeScript typecheck.

## Non-goals (this phase — each is its own later phase)

- **Tailwind CSS** (#3) — `index.css` stays untouched.
- **next/image** — plain `<img>` tags stay as-is (11 files); image optimization is deferred.
- **Perf lazy-loading** (#4 remainder) — beyond what already exists; the only dynamic imports added this phase are `ssr: false` wrappers for SSR **correctness**, not performance.
- **Nav-bar width fix** (#8) — deferred (trivial CSS, own phase).
- **Contact-form server hardening** (#6/#7), **Redis** (#9), **headless CMS** (#10), **Sentry** (#13), **E2E + cron** (#11/#12).
- No app behavior, feature, copy, or visual-design changes of any kind.

## Decisions

1. **Pages Router** (not App Router). Rationale: (a) the site has a real route-level exit animation ([Layout.jsx:63](../../../src/components/Layout.jsx)) that ports 1:1 to the documented Pages Router `_app.tsx` + `AnimatePresence` keyed on `router.asPath` pattern, whereas App Router needs the fragile "FrozenRouter" workaround; (b) ~16 of ~45 files touch browser globals and 11 animate — the app is almost entirely client-interactive, so App Router's Server Components benefit goes largely unused while its costs still apply. Pages Router is the lower-risk, higher-fidelity fit for this specific app.
2. **Faithful port only.** Framework + language change exclusively. Every enhancement is deferred to keep this diff small and provably parity-preserving.
3. **`strict: true` TypeScript.** Full `.jsx`/`.js` → `.tsx`/`.ts` conversion with real types. Catches real bugs (the `projects.js` data shape, component props, framer-motion variants). No `allowJs` end-state.
4. **Stack pin: Next.js 15 (latest) + React 19** — _decided at review._ The user opted to start on the current modern stack rather than the conservative 14.2 / React-18 half-step, accepting that the React 18→19 major lands inside this migration. Mitigation: the parity pass explicitly exercises the heavier third-party deps (`@xyflow/react`, `lucide-react`, `framer-motion`) on React 19 before merge; Pages Router is unaffected by Next 15's App-Router-only async-request-API changes. "Update to newer as soon as it works" → once route-by-route parity is verified and merged, keep dependencies current on their latest patches/minors.
5. **SSG for project pages.** `[slug].tsx` uses `getStaticPaths` + `getStaticProps` over the local `projects.js` data → every project page is pre-rendered static HTML. All other routes have no dynamic data → Next's Automatic Static Optimization makes them static automatically. No runtime data fetching anywhere. This is strictly better than today's client-only render and changes nothing user-visible.
6. **Keep `src/` layout.** Use Next's `src/pages/` convention; components/lib/data/styles stay where they are. Minimal file movement.

## Roadmap context (informative — not built this phase)

| Phase             | Sub-project                                         | Items                                                                            |
| ----------------- | --------------------------------------------------- | -------------------------------------------------------------------------------- |
| **1 (this spec)** | Next.js + TypeScript faithful port                  | #1, #2                                                                           |
| 2                 | Contact-form hardening via Next API routes          | hidden captcha + request-timer + proxy (#6), rate limiter (#7), Redis store (#9) |
| 3                 | Tailwind CSS                                        | #3                                                                               |
| 4                 | Headless CMS (Sanity candidate)                     | #10                                                                              |
| 5                 | Observability & automation                          | Sentry (#13), E2E-in-CI (#11), randomized cron (#12)                             |
| (fast-follows)    | Nav-width fix (#8), perf lazy-load (#4), next/image | —                                                                                |

## Design

### Routing map (react-router → Pages Router)

| Current route → file                 | Next file                                   |
| ------------------------------------ | ------------------------------------------- |
| `/` → `pages/Home.jsx`               | `src/pages/index.tsx`                       |
| `/works` → `Works.jsx`               | `src/pages/works.tsx`                       |
| `/projects/:slug` → `Project.jsx`    | `src/pages/projects/[slug].tsx`             |
| `/about` → `About.jsx`               | `src/pages/about.tsx`                       |
| `/labs` → `Labs.jsx`                 | `src/pages/labs.tsx`                        |
| `/contact` → `Contact.jsx`           | `src/pages/contact.tsx`                     |
| `*` → `NotFound.jsx`                 | `src/pages/404.tsx`                         |
| `App.jsx` (router)                   | _deleted_ — file-system routing replaces it |
| `Layout.jsx` (shell + transition)    | `src/pages/_app.tsx`                        |
| `index.html` `<head>` + theme script | `src/pages/_document.tsx`                   |
| `main.jsx` (root render)             | _deleted_ — Next owns the entry             |

Components remain in `src/components`, libs in `src/lib`, data in `src/data`, styles in `src/styles`.

### `_app.tsx` — the Layout port

Wraps every page, top-down: `ErrorBoundary` → `ThemeProvider` → (`Header`, animated page region, `Footer`). The animated region reproduces [Layout.jsx](../../../src/components/Layout.jsx) verbatim:

- `<AnimatePresence mode="wait" initial={false}>` wrapping a `motion.div` keyed on `router.asPath` (replaces `pathname`).
- Identical `EASE`, `enter`/`exit`/`initial` variants and `useReducedMotion` handling.
- `Breadcrumbs` in its `.container`, then `<Component {...pageProps} />` (replaces `<Outlet />`).
- The Layout's per-route `useEffect` (scroll-to-top + `document.title` + `applyCanonical`) is **replaced** by: per-page `next/head` for title/canonical (see SEO), and a small `router.events`/`asPath` effect in `_app.tsx` for scroll-to-top.
- `<Analytics />` + `<SpeedInsights />` switch from `@vercel/analytics/react` / `@vercel/speed-insights/react` to the `/next` entry points.

### `_document.tsx`

Holds the parts of `index.html` that are not per-page:

- `<Html lang="en">`, `<body>` structure.
- The **no-flash inline theme `<script>`** lifted from `index.html` (same no-deps logic as `theme.js`: read `localStorage['theme-mode']`, resolve `system` via `matchMedia`, set `data-theme` / `data-theme-mode` on `<html>` before paint). This is the canonical Next equivalent of the existing pattern.
- Font `<link>` / `preconnect` tags and the static OG/Twitter defaults currently in `index.html`.

### SEO / `<head>`

- Each page renders `next/head` with its `<title>` and self-referential `<link rel="canonical">`, computed from the existing **pure** helpers `titleForPath` / `canonicalForPath` (reused unchanged). For `[slug]`, title/canonical come from the statically-resolved project.
- Static, site-wide OG/Twitter tags live in `_document.tsx` (or a default `<Head>` in `_app.tsx`).
- `applyCanonical` (DOM-mutating) is retired; `SITE_URL`, `normalize`, `canonicalForPath`, `titleForPath` are kept.

### Data flow

`src/data/projects.js` stays the single source of truth, imported directly (it is bundled static data). `[slug].tsx`:

- `getStaticPaths` → one path per `projects[].slug` (`fallback: false`).
- `getStaticProps` → resolve the project by slug, pass as props (404 for unknown slug).

### SSR-safety (the one real migration risk)

Pages Router server-renders every component on first request — there is no `"use client"` directive. Plan:

- `theme.js` already guards `window`/`matchMedia` and try/catches `localStorage` → SSR-safe ✓. `ThemeContext` only touches the DOM inside effects ✓.
- **Audit** the ~16 files that reference browser globals (`window`, `document`, `localStorage`, `navigator`, `matchMedia`). The expectation (well-built SPA) is that nearly all access sits in `useEffect`/event handlers (SSR-safe); any render-time or module-load access is guarded with `typeof window !== 'undefined'` or moved into an effect.
- Genuinely browser-only widgets are wrapped in `next/dynamic(() => import(...), { ssr: false })` for **correctness**: at minimum `LabsCanvas` (`@xyflow/react`, DOM-measuring) and the `LiveTime` clock (renders current time → would hydration-mismatch). This is SSR-hazard avoidance, **not** the deferred performance lazy-load.
- Theme-dependent UI that could differ between server (`mode: 'system'` → `light`) and client (real `localStorage`) — `ThemeToggle`, `LiveTime` — renders a stable placeholder until mounted (`useEffect`-set `mounted` flag) to avoid hydration warnings. Painted colors are already correct pre-hydration via the `_document` inline script + CSS `data-theme`.

### Build & tooling

- **`package.json` scripts:** `dev: next dev`, `build: next build`, `start: next start`; `lint` stays `eslint .` (extend the existing flat config rather than switching to `next lint`); new `typecheck: tsc --noEmit`. Remove `preview`. `check` becomes `lint && format:check && typecheck && npm audit --audit-level=high && build`.
- **`next.config.js`** (ESM — `package.json` is `"type": "module"`): `reactStrictMode: true` (matches current `<StrictMode>`); `async headers()` re-exporting the 4 security headers from `vercel.json` (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`). Automatic SWC minify + code-splitting close item #5 with no config.
- **`tsconfig.json`:** new, `strict: true`, Next-recommended (`jsx: preserve`, `moduleResolution: bundler`, `incremental`, `isolatedModules`, `esModuleInterop`). Relative imports kept (no `@/*` alias this phase, to minimize churn).
- **ESLint:** add `eslint-config-next`; reconcile with the existing flat config (`eslint.config.js`) — keep `eslint-config-prettier` last; lint scope extends to `{js,jsx,ts,tsx}`. Drop `eslint-plugin-react-refresh` (Vite-HMR-specific; unused by Next).
- **Prettier:** unchanged config; `.prettierignore` adds `.next`. `lint-staged` globs become `*.{js,jsx,ts,tsx}` for the eslint+prettier step.
- **husky:** `.husky/pre-commit` unchanged (runs `lint-staged`).

### `vercel.json` / `public/` / `index.html`

- `vercel.json`: **remove** the SPA history rewrite (`/(.*)` → `/index.html`) — Next owns routing. The security headers move to `next.config.js`; `vercel.json` can be reduced to empty/removed (Vercel auto-detects Next).
- `public/` assets (`sitemap.xml`, `robots.txt`, `og-image.jpg`, the CV/Résumé HTML) carry over untouched and are served identically.
- `public/_headers`, `public/_redirects` (Netlify/Cloudflare fallback): now inert on a Next build; left in place (harmless) per prior decision.
- `index.html`: **deleted** — Next owns the document; its contents migrate to `_document.tsx` (static head) and per-page `next/head` (dynamic head).

## New / changed / deleted files

- **New:** `src/pages/_app.tsx`, `src/pages/_document.tsx`, `src/pages/index.tsx`, `works.tsx`, `about.tsx`, `labs.tsx`, `contact.tsx`, `projects/[slug].tsx`, `404.tsx`; `next.config.js`; `tsconfig.json`; `next-env.d.ts` (generated); a shared `src/types/` for the project/profile data shapes; this spec.
- **Changed:** all `src/**/*.jsx` → `*.tsx` and `*.js` → `*.ts` (typed); `package.json` (deps, scripts, lint-staged); `package-lock.json`; `eslint.config.js`; `.prettierignore`; `vercel.json`.
- **Deleted:** `src/App.jsx`, `src/main.jsx`, `index.html`, `vite.config.js` (removed only **after** the Next build is verified — see Rollback).
- **Untouched:** `src/styles/index.css`, `src/data/projects.js` content (renamed to `.ts` + typed, data unchanged), everything under `public/`.

## Commit strategy

Sequenced so each commit is independently reviewable and the tree stays green:

1. `chore: scaffold Next.js (Pages Router) + TypeScript config` — add `next`, `tsconfig.json`, `next.config.js`, scripts; React/Next deps; remove Vite dep last.
2. `feat: port app shell to _app/_document` — Layout → `_app.tsx`, `index.html` head + theme script → `_document.tsx`, providers, transition.
3. `feat: port routes to file-system routing` — pages + `[slug]` SSG; delete `App.jsx`/`main.jsx`.
4. `refactor: convert components and libs to TypeScript (strict)` — typing pass; may be split per area if large.
5. `chore: update lint/format/check tooling for TS + Next` — eslint-config-next, `tsc --noEmit` in `check`, lint-staged globs.
6. `chore: remove Vite config and index.html` — only after route-by-route verification passes.

All commits authored as `h.goretsov <gorecov4@gmail.com>`, **no AI co-author trailer** (project convention). Work happens on a feature branch; `main` stays releasable until parity is verified.

## Risks & mitigations

| Risk                                      | Mitigation                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Route exit-animation breaks under Next    | Documented `_app.tsx` + `AnimatePresence` keyed on `router.asPath`; verify enter **and** exit explicitly against current site |
| Theme flash / hydration mismatch          | Inline theme script in `_document` (parity with existing `index.html` script); placeholder-until-mounted on theme/clock UI    |
| SSR crash from browser globals            | Audit the 16 files; guard render/module-time access; `ssr:false` for Labs canvas + `LiveTime`                                 |
| CSS FOUC / load-order change              | Global import in `_app.tsx`; verify no flash vs current                                                                       |
| React 19 major lands inside the migration | Parity pass verifies `@xyflow/react`, `lucide-react`, `framer-motion` on React 19 before merge; bump/pin per-dep as needed    |
| `strict` TS surfaces many errors          | Type incrementally per commit; `projects.ts` shape typed first (it feeds titles/SEO/routing)                                  |
| Lost SEO parity (titles/canonical/OG)     | Reuse pure helpers; per-route verification of `<title>`/canonical/OG                                                          |

## Verification (how we prove "faithful")

Run against the current production/dev site as the reference. Gate:

1. `tsc --noEmit` — clean (0 type errors).
2. `next build` — clean (no errors/warnings); confirm `[slug]` pages are statically generated.
3. `next start` (or `next dev`) — every route renders: `/`, `/works`, `/projects/<each slug>`, `/about`, `/labs`, `/contact`, a 404.
4. **Page transition** animates in _and_ out on navigation (the `mode="wait"` exit hold is present); reduced-motion path verified.
5. **Theme**: toggle cycles light → dark → system; **no flash** on hard reload in any mode; cross-tab sync still works.
6. **Per-route `<title>` + canonical** match the current values; site-wide OG/Twitter tags present.
7. **Interactive widgets** all work: contact form (validation, honeypot, FormSubmit POST, toast), Labs canvas (xyflow), slideshow, light-pull toggle, screen-switcher crossfade, marquee, breadcrumbs.
8. **Console clean** (0 warnings/errors, incl. no hydration warnings) on every route.
9. **Responsive + dark-mode parity** at mobile/tablet/desktop/ultrawide breakpoints.
10. `npm run check` — full gate (lint, format, typecheck, audit-high, build) passes.

Screenshots used where the preview tooling allows; per the known gotcha (preview screenshots can render blank), fall back to `next build` + DOM inspection for the affected routes. Formal automated tests are deferred to the E2E phase (#11).

## Rollback

All work is on a feature branch. `vite.config.js` and the Vite toolchain are removed only in the **final** commit, after route-by-route parity verification. If parity cannot be reached, the branch is simply not merged; `main` (Vite) remains the deployed source of truth.
