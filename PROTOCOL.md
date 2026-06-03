# By_Hris Designs — Pre-Deploy Health & Quality Protocol

Run before every deploy. The four checks below are automated via `npm run check`.

## Automated gate — `npm run check`

1. **Lint** — `npm run lint` exits clean (no errors).
2. **Format** — `npm run format:check` reports all files styled.
3. **Audit** — `npm audit --audit-level=high` finds no high/critical.
   - _Known/accepted:_ 2 moderate (esbuild via Vite), dev-server only, not in the
     deployed static build. They sit below the `high` gate by design.
4. **Build** — `npm run build` completes with no errors/warnings.

## Manual checks

5. **Console-clean** — open the build preview; 0 warnings/errors in the browser
   console on each route (`/`, `/works`, `/about`, `/labs`, `/contact`, a
   `/projects/:slug`, and an unknown path for the 404).
6. **Titles / meta / links** — per-route `document.title` updates on navigation;
   Open Graph / Twitter / canonical meta present; no broken internal links.
7. **Lighthouse** (Chrome DevTools, incognito) — Performance / Accessibility /
   Best Practices / SEO all pass at the target threshold.
8. **Animation check** — verify framer-motion crossfades via
   `npm run build && npm run preview`, **not** `npm run dev` (React StrictMode
   breaks AnimatePresence exit animations in dev).

## Pre-commit (automatic)

A husky + lint-staged pre-commit hook runs `eslint --fix` + `prettier --write` on
staged files, so most issues are fixed before they ever land.
