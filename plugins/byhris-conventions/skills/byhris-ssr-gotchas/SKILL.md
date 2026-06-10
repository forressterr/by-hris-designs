---
name: byhris-ssr-gotchas
description: Use when writing or editing code that touches window, document, localStorage, timers, Date, random values, or browser-only libraries in by-hris-designs. Use when debugging a hydration mismatch or a blank preview screenshot. Use when verifying animations or page transitions.
---

# By_Hris SSR & Preview Gotchas

Next.js prerenders every page; this app is client-heavy. These are the established patterns — reuse them instead of inventing new ones.

## The Iron Rule

**Code that depends on the browser renders nothing on the server: `ssr: false` for whole widgets, a mounted-gate for client-only values.**

## Patterns

- **Browser-only widget** (canvas, viewport math, drag physics): load with `next/dynamic(() => import('...'), { ssr: false })`.
- **Render output depends on a client-only value** (time, localStorage, matchMedia): mounted-gate — render a stable placeholder until `useEffect` sets `mounted`. Precedents: `Parallax`, `ThemeToggle`, `LiveTime`.
- **Theme**: the no-flash inline script in `_document.tsx` applies the stored theme before React mounts. It deliberately duplicates `src/lib/theme.ts` logic (no imports available there) — keep the two in sync when touching theme resolution.

## Verification gotchas

- React StrictMode (on in dev) **breaks AnimatePresence exit animations** — page-transition bugs seen under `npm run dev` are usually not real. Verify via `npm run build && npm run start`.
- Dev-preview screenshots can render blank for the same reason. Verify with the production build plus HTML/console inspection, and prefer a manual visual pass over driving the browser.
- **Pages Router is deliberate** (route-exit `AnimatePresence mode="wait"` in `_app.tsx`, keyed on `router.asPath`). Do not propose migrating to the App Router.
