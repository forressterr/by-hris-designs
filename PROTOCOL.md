# By_Hris Designs — Pre-Deploy Health & Quality Protocol

Run before every deploy. The checks below are automated via `npm run check`.

## Automated gate — `npm run check`

1. **Lint** — `npm run lint` exits clean (no errors).
2. **Format** — `npm run format:check` reports all files styled.
3. **Typecheck** — `npm run typecheck` (`tsc --noEmit`) reports no type errors.
4. **Audit** — `npm audit --audit-level=high` finds no high/critical.
   - _Known/accepted:_ a few moderate advisories (Next.js build-tool deps),
     dev/build-only, not in the deployed runtime. They sit below the `high`
     gate by design.
5. **Build** — `npm run build` (`next build`) completes with no errors; confirm
   the project pages prerender as static (SSG).

## Manual checks

6. **Console-clean** — open the production build (`npm run start`); 0
   warnings/errors (incl. no hydration warnings) in the browser console on each
   route (`/`, `/works`, `/about`, `/labs`, `/contact`, a `/projects/:slug`, and
   an unknown path for the 404).
7. **Titles / meta / links** — per-route `<title>` + canonical render in the
   served HTML; Open Graph / Twitter meta present; no broken internal links.
8. **Lighthouse** (Chrome DevTools, incognito) — Performance / Accessibility /
   Best Practices / SEO all pass at the target threshold.
9. **Animation check** — verify the framer-motion page transition + crossfades
   via `npm run build && npm run start`, **not** `npm run dev` (React
   StrictMode, on by default via `next.config.js`, breaks AnimatePresence exit
   animations in dev).

## Pre-commit (automatic)

A husky + lint-staged pre-commit hook runs `eslint --fix` + `prettier --write` on
staged files, so most issues are fixed before they ever land.
