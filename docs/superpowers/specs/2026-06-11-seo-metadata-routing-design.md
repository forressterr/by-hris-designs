# SEO + Metadata Overhaul + `/projects`→`/works` Routing — Design

**Status:** approved 2026-06-11 · Not a roadmap phase (the BACKLOG stays untouched per the user); a standalone improvement before resuming the backlog order.

## Goal & context

Two things: **(1)** make every page carry accurate, page-specific SEO metadata in a
consistent "By Hris" identity (matching the feel of the user's Framer portfolio,
byhris.framer.media), and **(2)** move project detail pages from `/projects/<slug>` to
`/works/<slug>` so the URL matches the section the user enters through (`/works`).

Today: per-page `<title>` (via `lib/pageTitle`) + per-route `<link rel=canonical>` (via
`lib/seo`) exist, but **`_document.tsx` ships a single static `description` + Open
Graph + Twitter card site-wide** — so every route tells crawlers and social scrapers it
is the homepage. There is no structured data. Project pages live at `/projects/<slug>`
while their section is `/works`.

## Locked decisions (from the brainstorm)

- **Title brand = `By Hris`** (metadata only; the visible site brand `By_Hris Designs`
  in `profile.brand` is unchanged — a visible rebrand is out of scope).
- **Page-first title order** (SEO-optimal; user-selected): `<Page> | By Hris`.
- **No visible-UI change**, **no new dependencies** (JSON-LD is an inline `<script>`).
- **Backlog untouched.** Branch + PR; `npm run check` gate; don't merge until verified.

## Title scheme (`<title>`)

| Route           | Title                                                  |
| --------------- | ------------------------------------------------------ |
| `/`             | `Home \| By Hris`                                      |
| `/works`        | `Work \| By Hris`                                      |
| `/about`        | `About \| By Hris`                                     |
| `/labs`         | `Labs \| By Hris`                                      |
| `/contact`      | `Contact \| By Hris`                                   |
| `/works/<slug>` | `<project.name> \| By Hris` (e.g. `SURGE® \| By Hris`) |
| `/404`          | `Page not found \| By Hris`                            |

## Meta descriptions (per route; user owns the copy, these are the agreed defaults)

- `/` — `Hristian Goretsov (By Hris) — multi-disciplinary experience designer in Eindhoven. UX/UI, brand & product design case studies.`
- `/works` — `Selected UX/UI, brand and product design case studies by By Hris.`
- `/about` — `About Hristian Goretsov (By Hris) — a multi-disciplinary experience designer based in Eindhoven, NL.`
- `/labs` — `Labs by By Hris — interactive experiments, explorations, and work in progress.`
- `/contact` — `Get in touch with Hristian Goretsov (By Hris) for design work, roles, and collaborations.`
- `/works/<slug>` — from `project.description` (the opening paragraph), trimmed to ~155 chars on a word boundary; fall back to `project.headline` then a generic line.
- `/404` — `The page you're looking for doesn't exist.`

## Open Graph + Twitter (per route — the core SEO fix)

For every page, rendered by `<Seo>` (moved out of `_document.tsx`):

- `og:title` = the page `<title>`; `og:description` = the page description;
  `og:url` = the page canonical; `og:site_name` = `By Hris`.
- `og:type` = `website` for top-level pages, **`article`** for `/works/<slug>`.
- `og:image` = `${SITE_URL}/og-image.jpg` (the existing, correctly-sized 1200×630 card)
  for **all** routes — a safe default. `og:image:width/height/alt` preserved.
- Twitter: `summary_large_image`, `twitter:title/description/image` mirror the OG values.

`_document.tsx` keeps only **truly global** head: charset, favicon, `theme-color`,
`robots`, font preconnect/stylesheet, and the no-flash theme script. The static
`description`/OG/Twitter block moves into `<Seo>`.

> Per-project share images (cropping each `cover.jpg` to 1200×630) are an explicit
> **out-of-scope** follow-up — the covers aren't that ratio and would crop oddly.

## Structured data (JSON-LD `<script type="application/ld+json">`)

- **`/` (home):** `Person` — `name: 'Hristian Goretsov'`, `alternateName: 'By Hris'`,
  `jobTitle` (= `profile.title`), `address` (Eindhoven, NL), `email`,
  `sameAs: [linkedin]`, `url: SITE_URL`. Plus a `WebSite` node (`name: 'By Hris'`, `url`).
- **`/works/<slug>`:** `CreativeWork` — `name` (= project.name/title), `description`,
  `image` (absolute cover URL), `creator` (→ the Person), `url` (canonical).
- **Inner pages (everything except `/`):** `BreadcrumbList` mirroring the visible
  breadcrumb (Home → section → current), so Google can render breadcrumb snippets.

## Routing: `/projects/<slug>` → `/works/<slug>`

- **Move** `src/pages/projects/[slug].tsx` → `src/pages/works/[slug].tsx` (coexists with
  `src/pages/works.tsx`: `/works` → the listing, `/works/<slug>` → the detail). The page's
  own `<Seo path>` becomes `/works/<slug>`; `getStaticPaths`/`getStaticProps` unchanged
  except the import depth stays the same (still two levels deep).
- **Update the 3 real route references** (grep-verified the rest are asset paths or comments):
  - `ProjectCard.tsx` — `Link href={`/works/${project.slug}`}`.
  - `Breadcrumbs.tsx` — the `pathname.startsWith('/projects/')` branch → `/works/`.
  - the moved page's `<Seo path>`.
- **Asset paths stay:** `cover: '/projects/<slug>/cover.jpg'` and every `caseStudy` image
  `src` are files under `public/projects/…` — **not routes**. They do not move. (Comments
  in `projects.ts`/`Header.tsx` that say "/projects/:slug" get a light touch-up.)
- **301/308 redirects** in `next.config.js` (`async redirects()`): `/projects/:slug` →
  `/works/:slug` and `/projects` → `/works`, `permanent: true`. Preserves any indexed or
  shared links and passes link equity.
- **`public/sitemap.xml`:** the 6 project `<loc>`s → `/works/<slug>`.
- **Canonicals** update automatically (the moved page passes `/works/<slug>` to `<Seo>`;
  `titleForPath`/`pageMeta` match `^/works/[^/]+$` for project routes).

## Architecture (single source of truth; house-rules applied)

| File                                                       | Responsibility                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/pageMeta.ts` (new)                                | **Single source of truth** for route metadata. Pure functions `titleForPath`, `descriptionForPath`, `ogTypeForPath`, and `metaForPath(path) → { title, description, ogType, canonical }`. Absorbs the current `pageTitle.ts` logic (project route regex now `^/works/`). Exports `TITLE_BRAND = 'By Hris'`, `OG_IMAGE`. |
| `src/lib/seo.ts`                                           | Keep `SITE_URL` + `canonicalForPath` (+ a small `absoluteUrl` helper for OG image / JSON-LD).                                                                                                                                                                                                                           |
| `src/lib/jsonLd.ts` (new)                                  | Pure builders: `personJsonLd()`, `webSiteJsonLd()`, `creativeWorkJsonLd(project)`, `breadcrumbJsonLd(path)`. Return plain objects; `<Seo>` serialises.                                                                                                                                                                  |
| `src/components/Seo.tsx`                                   | **Renders only.** Given `path` (+ optional `project` for `/works/<slug>`), emits `<title>`, canonical, description, OG, Twitter, and the JSON-LD `<script>`(s) via `next/head`. Single responsibility.                                                                                                                  |
| `src/pages/_document.tsx`                                  | Slimmed to global-only head (see above).                                                                                                                                                                                                                                                                                |
| `src/pages/works/[slug].tsx`                               | Moved from `projects/`; passes `path` + `project` to `<Seo>`.                                                                                                                                                                                                                                                           |
| `next.config.js`                                           | Add `redirects()`.                                                                                                                                                                                                                                                                                                      |
| `public/sitemap.xml`, `Breadcrumbs.tsx`, `ProjectCard.tsx` | Route refs updated.                                                                                                                                                                                                                                                                                                     |

- `pageTitle.ts` is removed; its one import (`Seo.tsx`) repoints to `pageMeta.ts`.
  (`titleForPath` may be re-exported from `pageMeta` to keep the change small.)
- **DRY / single-responsibility / functional-core:** data (pageMeta, jsonLd) is pure and
  centralized; `<Seo>` is the only renderer; `_document` holds only global concerns.
- **SSR-safe:** all of this is static/SSR string output (no `window`/`Date`); JSON-LD is
  serialized server-side via `dangerouslySetInnerHTML` with a JSON string (no user input
  → no injection risk; content is our own profile/project data).

## Verification (per the dev-preview gotchas)

`npm run check` green + `npm run build && npm run start`, then inspect the **built HTML**
(curl/inspect, not screenshots):

- Each route's `<title>`, `<meta name=description>`, `og:title/description/url/type`,
  `twitter:*`, canonical reflect **that** page (not the homepage).
- JSON-LD present + valid JSON per route (Person+WebSite on `/`, CreativeWork on a project,
  BreadcrumbList on inner pages).
- `/works/<slug>` renders the project (identical to the old `/projects/<slug>`); old
  `/projects/<slug>` returns a redirect to `/works/<slug>`; `/works` listing still loads;
  `next build` shows the project pages prerendered under the new path.
- `sitemap.xml` lists `/works/...`. No visual change to any page.

## Acceptance

Per-page title/description/OG/Twitter/JSON-LD correct on every route; project pages live
at `/works/<slug>` with `/projects/<slug>` 301/308-redirecting; sitemap + breadcrumb +
internal links updated; **zero visual change**; `npm run check` + CI + Vercel preview
green. Conventions: branch + PR, commits `h.goretsov <gorecov4@gmail.com>` (no AI
trailer), tidy-first (routing move vs metadata as separate commits), don't merge until
verified.
