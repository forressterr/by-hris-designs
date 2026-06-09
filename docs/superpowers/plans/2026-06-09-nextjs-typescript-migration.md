# Next.js + TypeScript Migration (Faithful Port) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the By_Hris portfolio from Vite + React 18 + react-router to Next.js 15 (Pages Router) + React 19 + TypeScript (strict), with zero change to how the site looks, works, or feels.

**Architecture:** File-system routing under `src/pages/`. `_app.tsx` reproduces the current `Layout.jsx` shell + `AnimatePresence` page transition (keyed on `router.asPath`); `_document.tsx` holds the static `<head>` + the no-flash theme bootstrap script lifted from `index.html`. The existing 3,741-line `src/styles/index.css` is imported once in `_app.tsx` and left untouched. Migration runs in three movements: (1) scaffold the Next/TS toolchain alongside Vite, (2) an atomic cutover from react-router to Next routing, (3) a file-by-file TypeScript conversion, then decommission Vite. `allowJs: true` is a transitional setting so `.jsx` and `.tsx` coexist while the build stays green; it is flipped off at the end.

**Tech Stack:** Next.js 15 (Pages Router), React 19, TypeScript 5 (strict), framer-motion 12, @xyflow/react 12, @vercel/analytics + speed-insights (`/next`), ESLint 9 flat config + eslint-config-next, Prettier, husky + lint-staged.

**Spec:** [docs/superpowers/specs/2026-06-09-nextjs-typescript-migration-design.md](../specs/2026-06-09-nextjs-typescript-migration-design.md)

**Branch:** `feat/nextjs-typescript-migration` (already created). All commits authored as `h.goretsov <gorecov4@gmail.com>`, no AI co-author trailer.

---

## Key facts established during planning (do not re-discover)

- **Router surface (15 files).** Patterns and exact sites are listed in the [Router swap cheatsheet](#router-swap-cheatsheet). `react-router-dom` removal is **atomic** — once `main.jsx`'s `<BrowserRouter>` is gone, ANY remaining `useLocation`/`NavLink`/`Link` from react-router throws "must be used within a Router". So the cutover (Task 3) swaps every file in one commit.
- **Active class is `active`.** react-router v6 `<NavLink>` appends `active` on match; CSS targets `.site-header__link.active`, `.site-drawer__link.active`, `.footer-nav a.active`. The `NavLink` helper reproduces this.
- **Only two SSR/hydration hazards.** `LiveTime` (`new Date()` at render) and `ThemeToggle` (the sole `useTheme` consumer; server mode is always `system`). `LiveTime` → `next/dynamic({ ssr: false })` in `Header`; `LabsCanvas` (@xyflow) → `next/dynamic({ ssr: false })` in `Labs`; `ThemeToggle` → mounted-gate. Every other browser-global access is inside effects/handlers (SSR-safe). No `Math.random`, no `process.env`/`import.meta.env`.
- **Theme is already no-flash.** `index.html` lines 77–98 contain the bootstrap script; `theme.js` already guards `window`/`matchMedia`/`localStorage`. The script moves verbatim into `_document.tsx`.
- **`public/` payload** (carries over unchanged): `favicon.svg`, `og-image.jpg`, `work-overview.jpg`, `sitemap.xml`, `robots.txt`, `_headers`, `_redirects`, `Hristian-Goretsov-CV.html`, `Hristian-Goretsov-Resume.html`, and the `about/ home/ projects/` image dirs.
- **SEO helpers are pure** — `titleForPath` (pageTitle.js) and `canonicalForPath` (seo.js) are reused as-is via a new `<Seo path=…/>` component rendered per page.

---

## File structure

**New files**

- `tsconfig.json`, `next.config.js`, `.gitignore` (append) — toolchain
- `src/pages/_app.tsx` — shell + transition + providers + global CSS (replaces `Layout.jsx` + `main.jsx`)
- `src/pages/_document.tsx` — static `<head>` + theme script (replaces `index.html`)
- `src/pages/index.tsx`, `works.tsx`, `about.tsx`, `labs.tsx`, `contact.tsx`, `404.tsx`, `projects/[slug].tsx` — routes (ported from `src/pages/*.jsx`)
- `src/components/NavLink.tsx` — active-aware link (replaces react-router `NavLink`)
- `src/components/Seo.tsx` — per-page `<title>` + canonical via the pure helpers
- `src/types/content.ts` — `Project` / `Profile` data interfaces

**Deleted files** (in the final task, after parity is verified): `src/App.jsx`, `src/main.jsx`, `index.html`, `vite.config.js`

**Converted in place** (`.jsx/.js → .tsx/.ts`): all of `src/components/**`, `src/context/ThemeContext`, `src/lib/*`, `src/data/projects`.

---

## Router swap cheatsheet

Apply these mechanically. `next/link` (Next 13+) renders the `<a>` itself — put `className`/`style`/`onClick` directly on `<Link>`, and use `href` not `to`.

| react-router                                 | Next                                                             | Notes                                     |
| -------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------- |
| `import { Link } from 'react-router-dom'`    | `import Link from 'next/link'`                                   | default import                            |
| `<Link to="/x" className="c">`               | `<Link href="/x" className="c">`                                 | `to` → `href`                             |
| `import { NavLink } from 'react-router-dom'` | `import NavLink from './NavLink'` (or `'../components/NavLink'`) | local helper, `to` → `href`               |
| `useLocation().pathname`                     | `useRouter().asPath` (strip `?#`)                                | `import { useRouter } from 'next/router'` |
| `useNavigate()` → `navigate(-1)`             | `useRouter()` → `router.back()`                                  |                                           |
| `useParams().slug`                           | `getStaticProps` prop                                            | SSG; see Task 3, step P7                  |
| `<Navigate to="/x" replace/>`                | (removed)                                                        | `fallback: false` 404s invalid slugs      |
| `<Outlet/>`                                  | `<Component {...pageProps}/>`                                    | in `_app.tsx`                             |
| `motion(Link)`                               | `motion.create(Link)`                                            | framer-motion v12 custom-component API    |

---

## Task 1: Scaffold Next.js + TypeScript toolchain

Keeps Vite and react-router installed for now; nothing runs yet — this task only lands config.

**Files:**

- Create: `tsconfig.json`, `next.config.js`
- Modify: `package.json`, `.gitignore`

- [ ] **Step 1: Install Next 15 + React 19 + TypeScript**

```bash
npm install next@^15 react@^19 react-dom@^19
npm install -D typescript @types/react@^19 @types/react-dom@^19 @types/node
```

Expected: installs succeed. (Peer warnings from @xyflow/react / lucide-react about React 19 may appear — note them; resolved in Task 3 verification.)

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "checkJs": false,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", ".next/types/**/*.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

Note: `allowJs: true` is transitional (flipped off in Task 7). `next-env.d.ts` is generated on the first `next` command.

- [ ] **Step 3: Create `next.config.js`** (ESM — `package.json` is `"type": "module"`)

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 4: Append to `.gitignore`**

```
# Next.js
/.next/
/out/
next-env.d.ts
```

- [ ] **Step 5: Update `package.json` scripts**

Replace the `scripts` block's `dev`/`build`/`preview` and add `typecheck`:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "check": "npm run lint && npm run format:check && npm run typecheck && npm audit --audit-level=high && npm run build",
    "prepare": "husky"
  },
```

- [ ] **Step 6: Verify typecheck runs clean**

Run: `npx tsc --noEmit`
Expected: exits 0 (no `.ts`/`.tsx` files yet; `.jsx` not type-checked under `checkJs: false`).

- [ ] **Step 7: Commit**

```bash
git add tsconfig.json next.config.js .gitignore package.json package-lock.json
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "chore: scaffold Next.js 15 + React 19 + TypeScript toolchain"
```

---

## Task 2: Shared NavLink + Seo helpers

**Files:**

- Create: `src/components/NavLink.tsx`, `src/components/Seo.tsx`

- [ ] **Step 1: Create `src/components/NavLink.tsx`**

```tsx
import Link, { type LinkProps } from 'next/link';
import { useRouter } from 'next/router';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type NavLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    className?: string;
    children: ReactNode;
  };

/**
 * Drop-in replacement for react-router's <NavLink>: renders a next/link
 * and appends the `active` class when the current path matches `href`
 * (exact, or a sub-path), reproducing react-router v6's default.
 */
export default function NavLink({
  href,
  className = '',
  children,
  ...rest
}: NavLinkProps) {
  const { asPath } = useRouter();
  const path = asPath.split(/[?#]/)[0];
  const hrefStr = typeof href === 'string' ? href : (href.pathname ?? '');
  const isActive =
    path === hrefStr || (hrefStr !== '/' && path.startsWith(`${hrefStr}/`));

  return (
    <Link
      href={href}
      className={`${className}${isActive ? ' active' : ''}`}
      {...rest}
    >
      {children}
    </Link>
  );
}
```

- [ ] **Step 2: Create `src/components/Seo.tsx`**

```tsx
import Head from 'next/head';
import { titleForPath } from '../lib/pageTitle';
import { canonicalForPath } from '../lib/seo';

/**
 * Per-page <title> + self-referential canonical, reusing the existing
 * pure helpers verbatim. Reproduces the old Layout.jsx per-route effect
 * (document.title + applyCanonical) but server-rendered.
 */
export default function Seo({ path }: { path: string }) {
  return (
    <Head>
      <title>{titleForPath(path)}</title>
      <link rel="canonical" href={canonicalForPath(path)} />
    </Head>
  );
}
```

Note: imports resolve to `pageTitle.js` / `seo.js` via `allowJs` (typed in Task 5; no change needed here).

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/NavLink.tsx src/components/Seo.tsx
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "feat: add NavLink and Seo helpers for Next routing"
```

---

## Task 3: Cut over from react-router to Next routing (atomic)

The app does not run between the first and last step of this task (react-router removal is all-or-nothing). **Verify at the end, then commit once.** Components remain `.jsx` (typed in Task 6); new shell/route files are `.tsx`.

**Files:**

- Create: `src/pages/_document.tsx`, `src/pages/_app.tsx`, `src/pages/{index,works,about,labs,contact,404}.tsx`, `src/pages/projects/[slug].tsx`
- Modify: `src/components/Header.jsx`, `Footer.jsx`, `Breadcrumbs.jsx`, `LabsCover.jsx`, `ProjectCard.jsx`, `ServiceCard.jsx`, `ThemeToggle.jsx`, `package.json`
- Delete: `src/App.jsx`, `src/main.jsx`

### Shell

- [ ] **Step S1: Create `src/pages/_document.tsx`**

```tsx
import { Html, Head, Main, NextScript } from 'next/document';

// Lifted verbatim from index.html (lines 77–98). Runs synchronously in
// <head> before first paint so data-theme is set with no flash.
const THEME_SCRIPT = `(function () {
  try {
    var mode = localStorage.getItem('theme-mode') || 'system';
    if (mode !== 'light' && mode !== 'dark' && mode !== 'system') { mode = 'system'; }
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var effective = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;
    var root = document.documentElement;
    root.setAttribute('data-theme', effective);
    root.setAttribute('data-theme-mode', mode);
  } catch (_e) {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.setAttribute('data-theme-mode', 'system');
  }
})();`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="theme-color" content="#ffffff" />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#0e0e0e"
        />
        <meta
          name="description"
          content="By_Hris Designs — Multi-Disciplinary Designer based in Eindhoven. Brand, web, and product design work."
        />
        <meta name="robots" content="index, follow" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="By_Hris Designs" />
        <meta property="og:url" content="https://www.byhris.cc/" />
        <meta
          property="og:title"
          content="By_Hris Designs — Multi-Disciplinary Designer"
        />
        <meta
          property="og:description"
          content="Brand, web, and product design work by Hristian Goretsov — a multi-disciplinary designer based in Eindhoven, NL."
        />
        <meta
          property="og:image"
          content="https://www.byhris.cc/og-image.jpg"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="By_Hris Designs — portfolio of Hristian Goretsov, multi-disciplinary designer"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="By_Hris Designs — Multi-Disciplinary Designer"
        />
        <meta
          name="twitter:description"
          content="Brand, web, and product design work by Hristian Goretsov — a multi-disciplinary designer based in Eindhoven, NL."
        />
        <meta
          name="twitter:image"
          content="https://www.byhris.cc/og-image.jpg"
        />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700;800&display=swap"
        />

        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

Note: `<title>` is intentionally NOT here (per-page via `<Seo>`); viewport is set in `_app.tsx` (Next warns if viewport is in `_document`).

- [ ] **Step S2: Create `src/pages/_app.tsx`** (ports `Layout.jsx` + `main.jsx`)

```tsx
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import ErrorBoundary from '../components/ErrorBoundary';
import { ThemeProvider } from '../context/ThemeContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import '../styles/index.css';

// Same easing as Reveal + Parallax (copied from Layout.jsx).
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: ('instant' in window ? 'instant' : 'auto') as ScrollBehavior,
    });
  }, [router.asPath]);

  const enter = prefersReducedMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE } };
  const exit = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: -10, transition: { duration: 0.2, ease: EASE } };
  const initial = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 };

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <div className="site">
          <Header />
          <main className="site-main">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={router.asPath}
                className="page-reveal"
                initial={initial}
                animate={enter}
                exit={exit}
              >
                <div className="container">
                  <Breadcrumbs />
                </div>
                <Component {...pageProps} />
              </motion.div>
            </AnimatePresence>
          </main>
          <Footer />
        </div>
        <Analytics />
        <SpeedInsights />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

### Component router swaps (apply the cheatsheet)

- [ ] **Step C1: `src/components/Header.jsx`** — swap router APIs + lazy LiveTime

Replace the top imports:

```jsx
// REMOVE:
import { Link, NavLink, useLocation } from 'react-router-dom';
import LiveTime from './LiveTime.jsx';
// ADD:
import Link from 'next/link';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import NavLink from './NavLink.jsx';

const LiveTime = dynamic(() => import('./LiveTime.jsx'), { ssr: false });
```

In the component body: `const { pathname } = useLocation();` → `const { asPath } = useRouter();` and change the drawer-close effect dependency `[pathname]` → `[asPath]`.
Logo link: `<Link to="/" …>` → `<Link href="/" …>`.
Both `<NavLink … to={item.to} …>` (desktop nav + drawer) → `href={item.to}` (the helper handles the `active` class; keep `tabIndex` on the drawer one).

- [ ] **Step C2: `src/components/Footer.jsx`** — NavLink helper

```jsx
// REMOVE:
import { NavLink } from 'react-router-dom';
// ADD:
import NavLink from './NavLink.jsx';
```

The four `<NavLink to="/x">` → `<NavLink href="/x">` (lines ~38–41).

- [ ] **Step C3: `src/components/Breadcrumbs.jsx`** — useRouter + router.back()

```jsx
// REMOVE:
import { Link, useLocation, useNavigate } from 'react-router-dom';
// ADD:
import Link from 'next/link';
import { useRouter } from 'next/router';
```

In the component:

```jsx
// REMOVE:
const { pathname } = useLocation();
const navigate = useNavigate();
// ADD:
const router = useRouter();
const pathname = router.asPath.split(/[?#]/)[0];
```

Back button handler: `onClick={() => navigate(-1)}` → `onClick={() => router.back()}`.
Home link: `<Link to="/" …>` → `<Link href="/" …>`.

- [ ] **Step C4: `src/components/LabsCover.jsx`, `ProjectCard.jsx`, `ServiceCard.jsx`** — plain Link swap

In each: `import { Link } from 'react-router-dom';` → `import Link from 'next/link';`, and every `to=` → `href=`.

- `ProjectCard.jsx:9`: `<Link to={`/projects/${project.slug}`} …>` → `href={`/projects/${project.slug}`}`
- `ServiceCard.jsx:216`, `LabsCover.jsx:166`: `to="/works"` / `to="/labs"` → `href=…`

- [ ] **Step C5: `src/components/ThemeToggle.jsx`** — mounted-gate (hydration safety)

Add `useEffect`, `useState` to the React import, and gate the icon so server + first client render agree:

```jsx
import { useEffect, useState } from 'react';
// ...
export default function ThemeToggle() {
  const { mode, cycleMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const icon = ICONS[mounted ? mode : 'system'] || ICONS.system;
  // ...rest unchanged; data-mode={mounted ? mode : 'system'}
```

Change `data-mode={mode}` → `data-mode={mounted ? mode : 'system'}`.

### Route pages (port `src/pages/*.jsx` → route files; apply cheatsheet + add `<Seo>`)

For each, the page body is unchanged except: swap react-router `Link` imports/`to`→`href`, add `import Seo from '../components/Seo.jsx';` (or `'../../components/Seo.jsx'` for `[slug]`), and render `<Seo path="…" />` as the first element inside the returned root.

- [ ] **Step P1: `src/pages/Home.jsx` → `src/pages/index.tsx`**

```bash
git mv src/pages/Home.jsx src/pages/index.tsx
```

Swap `import { Link } from 'react-router-dom'` → `import Link from 'next/link'`; the three `<Link to="/works|/contact|/labs" …>` → `href=`. Add `import Seo from '../components/Seo';` and `<Seo path="/" />` as the first child of the returned root element.

- [ ] **Step P2: `src/pages/Works.jsx` → `src/pages/works.tsx`**

```bash
git mv src/pages/Works.jsx src/pages/works.tsx
```

Swap `Link` import + `to`→`href` (line ~38). Add `<Seo path="/works" />`.

- [ ] **Step P3: `src/pages/About.jsx` → `src/pages/about.tsx`**

```bash
git mv src/pages/About.jsx src/pages/about.tsx
```

Swap `Link` import + `to`→`href` (line ~26). Add `<Seo path="/about" />`.

- [ ] **Step P4: `src/pages/Labs.jsx` → `src/pages/labs.tsx`** — also lazy-load LabsCanvas

```bash
git mv src/pages/Labs.jsx src/pages/labs.tsx
```

```jsx
// REMOVE:
import { Link } from 'react-router-dom';
import LabsCanvas from '../components/LabsCanvas.jsx';
// ADD:
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Seo from '../components/Seo.jsx';

const LabsCanvas = dynamic(() => import('../components/LabsCanvas.jsx'), {
  ssr: false,
});
```

`to="/contact"` → `href` (line ~34). Add `<Seo path="/labs" />`.

- [ ] **Step P5: `src/pages/Contact.jsx` → `src/pages/contact.tsx`**

```bash
git mv src/pages/Contact.jsx src/pages/contact.tsx
```

Swap `Link` import + `to`→`href` (line ~31). Add `<Seo path="/contact" />`.

- [ ] **Step P6: `src/pages/NotFound.jsx` → `src/pages/404.tsx`**

```bash
git mv src/pages/NotFound.jsx src/pages/404.tsx
```

```jsx
// REMOVE:
import { Link } from 'react-router-dom';
// ADD:
import Link from 'next/link';
import Seo from '../components/Seo.jsx';
```

Line 6: `const MotionLink = motion(Link);` → `const MotionLink = motion.create(Link);`
Line 20–21: `<MotionLink to="/" …>` → `<MotionLink href="/" …>`. Add `<Seo path="/404" />` as the first child (`titleForPath` returns "Page not found — …" for unknown paths).

- [ ] **Step P7: `src/pages/Project.jsx` → `src/pages/projects/[slug].tsx`** — SSG

```bash
mkdir -p src/pages/projects
git mv src/pages/Project.jsx src/pages/projects/'[slug].tsx'
```

Top imports (note the new relative depth `../../`):

```tsx
// REMOVE:
import { Link, useParams, Navigate } from 'react-router-dom';
// ADD:
import Link from 'next/link';
import type { GetStaticPaths, GetStaticProps } from 'next';
import Seo from '../../components/Seo';
import type { Project } from '../../types/content';
```

Fix all relative imports in this file from `../components/...` → `../../components/...` and `../data/projects...` → `../../data/projects...`.
Line 12: `const MotionLink = motion(Link);` → `const MotionLink = motion.create(Link);`
Replace the component signature + slug resolution (current lines 51–54):

```tsx
// REMOVE:
export default function Project() {
  const { slug } = useParams();
  const project = projects.find((p) => p.slug === slug);
  if (!project) return <Navigate to="/works" replace />;
// ADD:
export default function Project({ project }: { project: Project }) {
```

Add `<Seo path={`/projects/${project.slug}`} />` as the first child of the returned root.
The two `<Link to="/contact">` / `<MotionLink to="/contact">` (lines ~281, ~312) → `href`.
Append the data functions at the end of the file:

```tsx
export const getStaticPaths: GetStaticPaths = () => ({
  paths: projects.map((p) => ({ params: { slug: p.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<{ project: Project }> = ({
  params,
}) => {
  const project = projects.find((p) => p.slug === params?.slug) ?? null;
  if (!project) return { notFound: true };
  return { props: { project } };
};
```

Note: `projects` import stays (still used by `relatedProjects`). `Project` type comes from Task 4's `content.ts`; if running Task 3 before Task 4, temporarily use `{ project: any }` and tighten in Task 4 — but prefer running Task 4's type creation first if convenient. (`content.ts` has no runtime deps, so it can be created early.)

### Delete old entry points + remove react-router

- [ ] **Step D1: Delete the Vite entry + router**

```bash
git rm src/App.jsx src/main.jsx
```

- [ ] **Step D2: Confirm zero react-router references remain**

Run: `grep -rn "react-router-dom" src/`
Expected: no output. If any remain, swap them before continuing.

- [ ] **Step D3: Remove the dependency**

```bash
npm uninstall react-router-dom
```

### Verify the cutover (the parity gate)

- [ ] **Step V1: Typecheck + build**

Run: `npx tsc --noEmit && npx next build`
Expected: both exit 0. Build output lists `/projects/[slug]` as **SSG** with one entry per project slug, and `/`, `/about`, `/works`, `/labs`, `/contact`, `/404` as static.

- [ ] **Step V2: Run and walk every route**

Run: `npx next dev` (use the preview tooling, not Bash, to drive the browser).
Check against the live site, per route — `/`, `/works`, every `/projects/<slug>`, `/about`, `/labs`, `/contact`, and a bogus path (→ 404):

- Page transition animates **in and out** on navigation (the `mode="wait"` exit hold).
- Theme toggle cycles light → dark → system; **no flash** on hard reload in each mode.
- Breadcrumbs render correctly; the "…" back button works on a project page.
- Header/Footer nav show the **active** state on the current route.
- Interactive widgets work: contact form (validation, honeypot, submit, toast), Labs canvas (xyflow), slideshow, light-pull, screen-switcher, marquee, live clock.
- Console is clean — **no hydration warnings**, no errors, no framer-motion `motion()` deprecation warnings (the `motion.create` swap).
- Per route: correct `<title>` and `<link rel="canonical">` in `<head>` (View Source — confirm they're server-rendered).
- Responsive + dark mode parity at mobile / tablet / desktop / ultrawide.

If anything diverges, fix before committing.

- [ ] **Step V3: Commit the cutover**

```bash
git add -A
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "feat: cut over from react-router to Next.js Pages Router"
```

---

## Task 4: TypeScript — data layer + types

**Files:**

- Create: `src/types/content.ts`
- Modify: `src/data/projects.js` → `src/data/projects.ts`

- [ ] **Step 1: Create `src/types/content.ts`**

Define interfaces from the fields the code actually reads (`slug`, `name` are required — used by routing, `pageTitle`, `Breadcrumbs`, `ProjectCard`). Start with this skeleton and extend it from the literal in `projects.js` + `tsc` errors:

```ts
export interface Project {
  slug: string;
  name: string;
  tags?: string[];
  // Extend with every field present in src/data/projects.js project objects
  // (the typecheck in Step 3 will name each missing/mismatched field).
  [key: string]: unknown;
}

export interface Profile {
  brand?: string;
  title: string;
  // Extend from the `profile` object in src/data/projects.js.
  [key: string]: unknown;
}
```

The `[key: string]: unknown` index signature keeps the faithful-port honest (no behavior change) while still typing the consumed fields; remove it later if/when every field is enumerated. Consumers that read a field do so through the named property if typed, else via the index signature (which yields `unknown` — narrow at the use site only where `tsc` complains).

- [ ] **Step 2: Rename + annotate the data module**

```bash
git mv src/data/projects.js src/data/projects.ts
```

At the top of `projects.ts`: `import type { Project, Profile } from '../types/content';`
Annotate the exports: `export const profile: Profile = { … };` and `export const projects: Project[] = [ … ];` (data unchanged).

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: exits 0. If excess-property or missing-required errors appear, add the named fields to the interfaces (preferred) — do NOT loosen `Project`/`Profile` beyond the index signature already present.

- [ ] **Step 4: Build + commit**

```bash
npx next build   # expect: exit 0
git add -A
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "refactor: type the project data layer (projects.ts + content types)"
```

---

## Task 5: TypeScript — lib + context

**Files:**

- Modify: `src/lib/theme.js` → `theme.ts`, `src/lib/seo.js` → `seo.ts`, `src/lib/pageTitle.js` → `pageTitle.ts`, `src/context/ThemeContext.jsx` → `ThemeContext.tsx`

- [ ] **Step 1: Convert `src/lib` (pure helpers)**

```bash
git mv src/lib/theme.js src/lib/theme.ts
git mv src/lib/seo.js src/lib/seo.ts
git mv src/lib/pageTitle.js src/lib/pageTitle.ts
```

Add types:

- `theme.ts`: `export type ThemeMode = 'light' | 'dark' | 'system';` `export type EffectiveTheme = 'light' | 'dark';` Annotate function params/returns (`getStoredMode(): ThemeMode`, `resolveTheme(mode: ThemeMode): EffectiveTheme`, `subscribeToSystem(callback: (t: EffectiveTheme) => void): () => void`, etc.). The existing `typeof window === 'undefined'` guards stay.
- `seo.ts`: `normalize(pathname: string): string`, `canonicalForPath(pathname: string): string`, `applyCanonical` can be **deleted** (no longer called — `<Seo>` replaced it; confirm with `grep -rn applyCanonical src/` → no callers).
- `pageTitle.ts`: `titleForPath(pathname: string): string`. Import `Project`/`Profile` types as needed.

- [ ] **Step 2: Convert `ThemeContext`**

```bash
git mv src/context/ThemeContext.jsx src/context/ThemeContext.tsx
```

Type the context value and provider:

```tsx
import type { ReactNode } from 'react';
import type { ThemeMode, EffectiveTheme } from '../lib/theme';

interface ThemeContextValue {
  mode: ThemeMode;
  effectiveTheme: EffectiveTheme;
  setMode: (next: ThemeMode) => void;
  cycleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  /* body unchanged */
}
```

`useTheme()` keeps its null-guard throw (already correct).

- [ ] **Step 3: Verify + commit**

```bash
npx tsc --noEmit && npx next build   # expect: exit 0
git add -A
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "refactor: convert lib + ThemeContext to TypeScript"
```

---

## Task 6: TypeScript — remaining components

Convert every remaining `.jsx` component to `.tsx`. Work in sub-batches, committing after each green build, so a type error is easy to localize.

**Conversion recipe (per file):**

1. `git mv X.jsx X.tsx`.
2. Update its own imports of now-`.tsx`/`.ts` siblings (extensions are extensionless or `.jsx` → fine via resolution; only fix if `tsc` complains).
3. Type the props: replace the implicit-any destructure with an interface, e.g. `function ProjectCard({ project }: { project: Project })`.
4. Type `useState` generics where inference is insufficient, and event handlers (`React.ChangeEvent<HTMLInputElement>`, etc.).
5. `npx tsc --noEmit` — fix what it names. The compiler is the spec for what to type.

**Worked example — `src/components/ProjectCard.jsx → .tsx`:**

```tsx
import Link from 'next/link';
import type { Project } from '../types/content';

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.slug}`} className="project-card">
      {/* ...existing body unchanged... */}
    </Link>
  );
}
```

- [ ] **Step 1: Convert `src/components/motion/` + `src/components/project/`**

Files: `motion/Parallax.jsx`, `motion/Reveal.jsx`, `project/AnnotatedImage.jsx`, `project/DeviceFrame.jsx`, `project/ProjectHero.jsx`, `project/ProjectMeta.jsx`, `project/ProjectShell.jsx`, `project/ScreenSwitcher.jsx`, `project/ScrollViewport.jsx`.
Apply the recipe to each. `ScreenSwitcher`'s within-page `<AnimatePresence mode="wait">` stays as-is (already SSR-safe).
Verify: `npx tsc --noEmit && npx next build` → exit 0.
Commit: `refactor: convert motion/ and project/ components to TypeScript`.

- [ ] **Step 2: Convert the top-level components**

Files: `Breadcrumbs.jsx`, `ContactForm.jsx`, `ErrorBoundary.jsx`, `FAQ.jsx`, `Footer.jsx`, `Header.jsx`, `LabsCanvas.jsx`, `LabsCover.jsx`, `LightPullString.jsx`, `LiveTime.jsx`, `Logo.jsx`, `MarqueeSubSkillCard.jsx`, `ServiceCard.jsx`, `SlideShow.jsx`, `TestimonialCard.jsx`, `ThemeToggle.jsx`, `Toast.jsx`, `Typewriter.jsx`.
Apply the recipe. Notes:

- `ErrorBoundary` is a class component — type it `extends React.Component<{ children: ReactNode }, { hasError: boolean; /* + existing state */ }>`. Its `window.location.reload()` access stays (in the reset handler / error UI — SSR-safe).
- `ContactForm` — type the `useState` shapes (`status`, `values`, `errors`, `touched`, `toast`) and the `handleChange`/`handleBlur`/`handleSubmit` event params.
- After Header/LabsCanvas/LiveTime become `.tsx`, update the `next/dynamic` import paths from Task 3 (`'./LiveTime.jsx'` → `'./LiveTime'`, `'../components/LabsCanvas.jsx'` → `'../components/LabsCanvas'`) so they resolve cleanly.
  Verify after every ~4 files: `npx tsc --noEmit`. Then `npx next build` → exit 0.
  Commit: `refactor: convert remaining components to TypeScript`.

- [ ] **Step 3: Confirm no `.jsx`/`.js` source remains**

Run: `find src -name "*.jsx" -o -name "*.js"`
Expected: no output (only `.ts`/`.tsx` under `src/`).

---

## Task 7: Tighten config + lint/format tooling

**Files:**

- Modify: `tsconfig.json`, `eslint.config.js`, `package.json`, `.prettierignore`

- [ ] **Step 1: Flip `allowJs` off**

In `tsconfig.json`: remove `"allowJs": true` and `"checkJs": false` (or set `allowJs` to `false`). Run `npx tsc --noEmit` → exit 0. (If it errors on a stray `.js`, that file was missed in Task 6 — convert it.)

- [ ] **Step 2: Add `eslint-config-next`**

```bash
npm install -D eslint-config-next@^15 eslint-import-resolver-typescript
```

In `eslint.config.js`: add `@typescript-eslint` + Next via the flat-config compat (`next/core-web-vitals`), set parser for `ts,tsx`, keep `eslint-config-prettier` **last**, remove `eslint-plugin-react-refresh` (Vite-only). Lint scope: `{js,jsx,ts,tsx}`.
Run: `npx eslint .` → 0 errors (annotate, don't blanket-disable; same triage policy as the Phase-2 spec).

- [ ] **Step 3: Update `lint-staged` globs (`package.json`)**

```json
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  },
```

- [ ] **Step 4: Update `.prettierignore`**

Append `.next` and `next-env.d.ts`.

- [ ] **Step 5: Verify + commit**

```bash
npm run lint && npm run typecheck && npx next build   # expect: all exit 0
git add -A
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "chore: enforce strict TS (allowJs off) + eslint-config-next + lint-staged for ts/tsx"
```

---

## Task 8: Decommission Vite + finalize

**Files:**

- Delete: `vite.config.js`, `index.html`
- Modify: `vercel.json`, `PROTOCOL.md`, `package.json`

- [ ] **Step 1: Remove Vite + its plugins**

```bash
git rm vite.config.js index.html
npm uninstall vite @vitejs/plugin-react eslint-plugin-react-refresh
```

- [ ] **Step 2: Simplify `vercel.json`**

Remove the SPA history rewrite (`/(.*)` → `/index.html`) — Next owns routing. The 4 security headers are already in `next.config.js` (Task 1), so remove them here too. Result is either an empty `{}` or a deletion (Vercel auto-detects Next):

```bash
git rm vercel.json   # OR leave a minimal {} if other config is added later
```

Confirm `public/_headers` and `public/_redirects` remain (inert on Vercel/Next; kept as the Netlify/Cloudflare fallback per prior decision).

- [ ] **Step 3: Update `PROTOCOL.md`**

The pre-deploy checklist references Vite (`npm run preview`, "StrictMode breaks framer-motion AnimatePresence exits" via `npm run dev`). Update those lines to the Next flow: `npm run build && npm run start` for the production check, and `npm run check` now includes `typecheck`. The animation/transition check is done against `next build && next start` (production), not `next dev`.

- [ ] **Step 4: Full gate + final parity pass**

Run: `npm run check`
Expected: lint (0 errors), format:check (clean), typecheck (0 errors), `npm audit --audit-level=high` (clean), `next build` (clean) — all pass in sequence.
Then `npm run start` and repeat the **Task 3 / Step V2** route-by-route parity checklist against production output one final time.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "chore: remove Vite toolchain and finalize Next.js migration"
```

- [ ] **Step 6: Hand back for review**

Migration complete on `feat/nextjs-typescript-migration`. Do NOT merge to `main` until the parity checklist passes end-to-end and (optionally) a Vercel preview deploy of the branch is verified. Per spec §Decisions-4, the "update to newer" step (latest patch/minor bumps) happens after this branch is verified + merged.

---

## Self-review

**Spec coverage:**

- Pages Router migration → Tasks 1–3. ✓
- `strict: true` TS, full `.jsx/.js → .tsx/.ts` → Tasks 4–7 (allowJs off in Task 7). ✓
- Keep `index.css` verbatim, imported in `_app.tsx` → Task 3 / S2. ✓
- Preserve `AnimatePresence mode="wait"` transition → Task 3 / S2 + verify V2. ✓
- No-flash theming, per-route titles + canonical → `_document` script (S1) + `<Seo>` (Task 2, per-page in P1–P7). ✓
- `projects` single source of truth + SSG for project pages → Task 3 / P7 (`getStaticPaths`/`getStaticProps`). ✓
- SSR-safety (LiveTime, LabsCanvas, ThemeToggle) → Task 3 / C1, C5, P4. ✓
- Build/tooling (scripts, next.config headers, tsconfig, eslint-config-next, `tsc --noEmit` in `check`, lint-staged) → Tasks 1, 7. ✓
- Remove SPA rewrite / `index.html` / Vite; keep `public/*` → Task 8. ✓
- Stack pin Next 15 + React 19 → Task 1. ✓
- Non-goals (Tailwind, next/image, perf lazy-load, nav-width) → not present in any task. ✓ (the only `next/dynamic` uses are `ssr:false` for correctness, explicitly noted.)

**Placeholder scan:** No "TBD"/"implement later". The data-interface extension (Task 4) and the per-component prop typing (Task 6) are `tsc`-driven by design — the compiler enumerates exactly what to type — and each provides a concrete starting interface + worked example, which is the honest, non-hand-wavy form for a mechanical type migration.

**Type/name consistency:** `Project`/`Profile` defined in `src/types/content.ts` (Task 4) and consumed in `[slug].tsx` (Task 3/P7), `ProjectCard` (Task 6), `pageTitle.ts` (Task 5). `ThemeMode`/`EffectiveTheme` defined in `theme.ts` and consumed in `ThemeContext.tsx` (Task 5). `NavLink`/`Seo` created in Task 2, consumed in Task 3. `getStaticPaths`/`getStaticProps` typed via `next` imports. The Task-3-before-Task-4 ordering note flags the one forward-reference (`Project` type) and gives the resolution.
