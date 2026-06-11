# SEO + Metadata + `/projects`→`/works` Routing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every route accurate, page-specific SEO metadata (title, description, Open Graph, Twitter, JSON-LD) under a consistent "By Hris" identity, and move project detail pages from `/projects/<slug>` to `/works/<slug>` with 301/308 redirects.

**Architecture:** A pure `src/lib/pageMeta.ts` becomes the single source of truth for route metadata (page-first titles `<Page> | By Hris`, descriptions, og:type); `src/lib/jsonLd.ts` builds schema.org nodes; `src/components/Seo.tsx` is the sole renderer (title, canonical, description, OG, Twitter, one `@graph` JSON-LD script). `_document.tsx` slims to global-only head. The project route file is `git mv`d to `pages/works/[slug].tsx`; `next.config.js` redirects the old path.

**Tech Stack:** Next.js 15 (Pages Router), React 19, strict TS (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-06-11-seo-metadata-routing-design.md`

**No test framework this phase** (Phase 5). Verification = `npm run check` + built-HTML inspection on `npm run build && npm run start`.

**Conventions:** branch + PR; commits `h.goretsov <gorecov4@gmail.com>`, conventional, no AI trailer; tidy-first (routing move = `refactor:`, metadata = `feat:`); `npm run check` gate; don't merge until verified. **Backlog untouched.**

---

## File map

| File                             | Create/Modify                     | Responsibility                                                                       |
| -------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------ |
| `src/pages/works/[slug].tsx`     | Move (from `projects/[slug].tsx`) | Project detail at `/works/<slug>`; passes `path` + `project` to `<Seo>`.             |
| `next.config.js`                 | Modify                            | Add `async redirects()` for `/projects/:slug` + `/projects`.                         |
| `public/sitemap.xml`             | Modify                            | 6 project `<loc>`s → `/works/<slug>`.                                                |
| `src/components/ProjectCard.tsx` | Modify                            | Card link → `/works/<slug>`.                                                         |
| `src/components/Breadcrumbs.tsx` | Modify                            | `/projects/` branch → `/works/`.                                                     |
| `src/lib/pageMeta.ts`            | Create                            | Single source of truth: titles + descriptions + og:type per route (pure).            |
| `src/lib/jsonLd.ts`              | Create                            | Pure schema.org node builders.                                                       |
| `src/lib/seo.ts`                 | Modify                            | Add `absoluteUrl()` helper (keep `SITE_URL`, `canonicalForPath`).                    |
| `src/components/Seo.tsx`         | Modify                            | Render title, canonical, description, OG, Twitter, JSON-LD from `pageMeta`/`jsonLd`. |
| `src/pages/_document.tsx`        | Modify                            | Remove the static description/OG/Twitter block (global-only head remains).           |
| `src/types/content.ts`           | Modify                            | Type the `Profile` fields now consumed (`name`/`email`/`linkedin`/`location`).       |
| `src/lib/pageTitle.ts`           | Delete                            | Logic absorbed by `pageMeta.ts`.                                                     |

---

## Task 1: Branch + commit spec/plan

- [ ] **Step 1: Branch from clean `main`.**

```bash
git checkout main && git pull --ff-only
git checkout -b feat/seo-metadata-works-routing
```

- [ ] **Step 2: Commit spec + plan.**

```bash
git add docs/superpowers/specs/2026-06-11-seo-metadata-routing-design.md \
        docs/superpowers/plans/2026-06-11-seo-metadata-routing.md
git commit --author="h.goretsov <gorecov4@gmail.com>" \
  -m "docs: add seo metadata + works-routing spec and plan"
```

---

## Task 2: Move the project route `/projects/<slug>` → `/works/<slug>` (refactor)

**Files:** Move `src/pages/projects/[slug].tsx`; Modify `ProjectCard.tsx`, `Breadcrumbs.tsx`, `next.config.js`, `public/sitemap.xml`, `src/lib/pageTitle.ts`.

- [ ] **Step 1: Move the route file** (preserves history; import depth is unchanged — still `../../`):

```bash
git mv src/pages/projects/[slug].tsx src/pages/works/[slug].tsx
```

- [ ] **Step 2: Point the moved page's `<Seo>` at the new path** in `src/pages/works/[slug].tsx` (the line currently reads `<Seo path={`/projects/${project.slug}`} />`):

```tsx
<Seo path={`/works/${project.slug}`} />
```

(The `project` prop is added in Task 3 Step 6, once `<Seo>` is rewritten to accept it — adding it now would fail typecheck against the current `{ path }`-only props.)

- [ ] **Step 3: Update the project-card link** in `src/components/ProjectCard.tsx` (line ~10):

```tsx
    <Link href={`/works/${project.slug}`} className="project-card">
```

- [ ] **Step 4: Update the breadcrumb deep-route branch** in `src/components/Breadcrumbs.tsx`. Change the doc-comment line `*   /projects/x   →  [home] › … › Project name` to `/works/x`, and the condition:

```tsx
  } else if (pathname.startsWith('/works/')) {
```

- [ ] **Step 5: Keep project titles working** — update the project regex in `src/lib/pageTitle.ts` (line ~29) from `/projects/` to `/works/` (this file is deleted in Task 3, but this keeps Task 2's build correct):

```ts
const projectMatch = path.match(/^\/works\/([^/]+)$/);
```

- [ ] **Step 6: Add redirects** in `next.config.js` — insert an `async redirects()` method alongside `headers()`:

```js
  async redirects() {
    return [
      {
        source: '/projects/:slug',
        destination: '/works/:slug',
        permanent: true,
      },
      { source: '/projects', destination: '/works', permanent: true },
    ];
  },
```

- [ ] **Step 7: Update the sitemap** — in `public/sitemap.xml`, change each `/projects/<slug>` to `/works/<slug>` (surge, cipher, altitude, floret, daily-dojo, fundedr).

- [ ] **Step 8: Confirm no stray route refs remain** (asset paths under `public/projects/…` and a `data/projects.ts` comment are expected and stay):

```bash
grep -rn "/projects/" src public --include='*.tsx' --include='*.ts' --include='*.xml' | grep -v "/projects/.*\.\(jpg\|png\|webp\)" | grep -v "src/data/projects.ts"
```

Expected: no route references (only the asset paths / the `data/projects.ts:20` comment, both fine). Touch up the `Header.tsx:13` and `data/projects.ts:20` comments to say `/works/:slug` if they still say `/projects`.

- [ ] **Step 9: Build + verify.**

```bash
npm run build
```

Expected: success; `/works/[slug]` prerenders the 6 projects (the route table shows `/works/[slug]` instead of `/projects/[slug]`).

- [ ] **Step 10: Commit.**

```bash
git add -A
git commit --author="h.goretsov <gorecov4@gmail.com>" \
  -m "refactor: move project route from /projects to /works with redirects"
```

---

## Task 3: Per-page metadata + JSON-LD (feat)

**Files:** Create `src/lib/pageMeta.ts`, `src/lib/jsonLd.ts`; Modify `src/lib/seo.ts`, `src/components/Seo.tsx`, `src/pages/_document.tsx`, `src/types/content.ts`; Delete `src/lib/pageTitle.ts`.

- [ ] **Step 1: Type the consumed `Profile` fields** in `src/types/content.ts` (replace the `Profile` interface):

```ts
export interface Profile {
  name?: string;
  brand?: string;
  title: string;
  location?: string;
  email?: string;
  linkedin?: string;
  status?: string;
  [key: string]: unknown;
}
```

- [ ] **Step 2: Add an absolute-URL helper** to `src/lib/seo.ts` (append after `canonicalForPath`):

```ts
// Absolute URL for an app-relative asset path (OG image, JSON-LD image).
export function absoluteUrl(assetPath: string): string {
  return assetPath.startsWith('http') ? assetPath : `${SITE_URL}${assetPath}`;
}
```

- [ ] **Step 3: Create `src/lib/pageMeta.ts`** (single source of truth — page-first titles, descriptions, og:type):

```ts
import { projects } from '../data/projects';
import { canonicalForPath } from './seo';

export const TITLE_BRAND = 'By Hris';
export const OG_IMAGE_PATH = '/og-image.jpg';
export const OG_IMAGE_ALT =
  'By Hris — portfolio of Hristian Goretsov, multi-disciplinary experience designer';

export interface PageMeta {
  title: string;
  description: string;
  ogType: 'website' | 'article';
  canonical: string;
}

type StaticMeta = { title: string; description: string };

const HOME: StaticMeta = {
  title: `Home | ${TITLE_BRAND}`,
  description:
    'Hristian Goretsov (By Hris) — multi-disciplinary experience designer in Eindhoven. UX/UI, brand & product design case studies.',
};
const WORK: StaticMeta = {
  title: `Work | ${TITLE_BRAND}`,
  description:
    'Selected UX/UI, brand and product design case studies by By Hris.',
};
const ABOUT: StaticMeta = {
  title: `About | ${TITLE_BRAND}`,
  description:
    'About Hristian Goretsov (By Hris) — a multi-disciplinary experience designer based in Eindhoven, NL.',
};
const LABS: StaticMeta = {
  title: `Labs | ${TITLE_BRAND}`,
  description:
    'Labs by By Hris — interactive experiments, explorations, and work in progress.',
};
const CONTACT: StaticMeta = {
  title: `Contact | ${TITLE_BRAND}`,
  description:
    'Get in touch with Hristian Goretsov (By Hris) for design work, roles, and collaborations.',
};
const NOT_FOUND: StaticMeta = {
  title: `Page not found | ${TITLE_BRAND}`,
  description: "The page you're looking for doesn't exist.",
};

const STATIC: Record<string, StaticMeta> = {
  '/': HOME,
  '/works': WORK,
  '/about': ABOUT,
  '/labs': LABS,
  '/contact': CONTACT,
};

function normalize(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;
}

// Trim to <= max chars on a word boundary, appending an ellipsis if cut.
function clampDescription(text: string, max = 155): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max).trimEnd()}…`;
}

export function metaForPath(pathname: string): PageMeta {
  const path = normalize(pathname);
  const canonical = canonicalForPath(path);

  const staticMeta = STATIC[path];
  if (staticMeta) return { ...staticMeta, ogType: 'website', canonical };

  const projectMatch = path.match(/^\/works\/([^/]+)$/);
  if (projectMatch) {
    const slug = projectMatch[1];
    const project = projects.find((p) => p.slug === slug);
    if (project) {
      const raw =
        project.description ||
        project.headline ||
        `${project.title || project.name} — a case study by ${TITLE_BRAND}.`;
      return {
        title: `${project.name} | ${TITLE_BRAND}`,
        description: clampDescription(raw),
        ogType: 'article',
        canonical,
      };
    }
    return { ...WORK, ogType: 'website', canonical };
  }

  return { ...NOT_FOUND, ogType: 'website', canonical };
}
```

- [ ] **Step 4: Create `src/lib/jsonLd.ts`** (pure schema.org node builders; nodes are wrapped in one `@graph` by `<Seo>`):

```ts
import { profile, projects } from '../data/projects';
import type { Project } from '../types/content';
import { SITE_URL, canonicalForPath, absoluteUrl } from './seo';
import { OG_IMAGE_PATH, TITLE_BRAND } from './pageMeta';

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const SECTION_LABELS: Record<string, string> = {
  '/works': 'Work',
  '/about': 'About',
  '/labs': 'Labs',
  '/contact': 'Contact',
};

function normalize(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;
}

export function personJsonLd(): Record<string, unknown> {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: profile.name,
    alternateName: TITLE_BRAND,
    jobTitle: profile.title,
    ...(profile.email ? { email: `mailto:${profile.email}` } : {}),
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Eindhoven',
      addressCountry: 'NL',
    },
    url: `${SITE_URL}/`,
    image: absoluteUrl(OG_IMAGE_PATH),
    ...(profile.linkedin ? { sameAs: [profile.linkedin] } : {}),
  };
}

export function webSiteJsonLd(): Record<string, unknown> {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: TITLE_BRAND,
    url: `${SITE_URL}/`,
    publisher: { '@id': PERSON_ID },
  };
}

export function creativeWorkJsonLd(project: Project): Record<string, unknown> {
  return {
    '@type': 'CreativeWork',
    name: project.title || project.name,
    headline: project.name,
    ...(project.description ? { description: project.description } : {}),
    ...(project.cover ? { image: absoluteUrl(project.cover) } : {}),
    ...(project.year ? { dateCreated: project.year } : {}),
    creator: { '@id': PERSON_ID },
    url: canonicalForPath(`/works/${project.slug}`),
  };
}

export function breadcrumbJsonLd(pathname: string): Record<string, unknown> {
  const path = normalize(pathname);
  const items: { name: string; url: string }[] = [
    { name: 'Home', url: `${SITE_URL}/` },
  ];

  const sectionLabel = SECTION_LABELS[path];
  if (sectionLabel) {
    items.push({ name: sectionLabel, url: canonicalForPath(path) });
  } else {
    const projectMatch = path.match(/^\/works\/([^/]+)$/);
    if (projectMatch) {
      items.push({ name: 'Work', url: canonicalForPath('/works') });
      const project = projects.find((p) => p.slug === projectMatch[1]);
      items.push({
        name: project?.name || projectMatch[1] || 'Project',
        url: canonicalForPath(path),
      });
    }
  }

  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
```

- [ ] **Step 5: Rewrite `src/components/Seo.tsx`** to render everything from the new libs:

```tsx
import Head from 'next/head';
import type { Project } from '../types/content';
import {
  metaForPath,
  OG_IMAGE_PATH,
  OG_IMAGE_ALT,
  TITLE_BRAND,
} from '../lib/pageMeta';
import { absoluteUrl } from '../lib/seo';
import {
  personJsonLd,
  webSiteJsonLd,
  creativeWorkJsonLd,
  breadcrumbJsonLd,
} from '../lib/jsonLd';

/**
 * Per-page <head>: title, canonical, description, Open Graph, Twitter, and a
 * single schema.org @graph JSON-LD script. All data comes from lib/pageMeta +
 * lib/jsonLd (pure); this component only renders. The home page emits
 * Person + WebSite; project pages emit CreativeWork + BreadcrumbList; other
 * inner pages emit BreadcrumbList.
 */
export default function Seo({
  path,
  project,
}: {
  path: string;
  project?: Project;
}) {
  const meta = metaForPath(path);
  const ogImage = absoluteUrl(OG_IMAGE_PATH);

  const nodes =
    path === '/'
      ? [personJsonLd(), webSiteJsonLd()]
      : project
        ? [creativeWorkJsonLd(project), breadcrumbJsonLd(path)]
        : [breadcrumbJsonLd(path)];

  // Escape `<` so a stray `</script>` in any data string can't break out.
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': nodes,
  }).replace(/</g, '\\u003c');

  return (
    <Head>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={meta.canonical} />

      <meta property="og:type" content={meta.ogType} />
      <meta property="og:site_name" content={TITLE_BRAND} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={meta.canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={OG_IMAGE_ALT} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={ogImage} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
    </Head>
  );
}
```

- [ ] **Step 6: Pass `project` to the project page's `<Seo>`** in `src/pages/works/[slug].tsx` (now that `<Seo>` accepts the prop):

```tsx
<Seo path={`/works/${project.slug}`} project={project} />
```

- [ ] **Step 7: Slim `src/pages/_document.tsx`** — delete the static social/description block (the `<meta name="description">`, all `og:*`, and all `twitter:*` tags — currently ~lines 33–73). **Keep**: `charSet`, favicon, both `theme-color` metas, `<meta name="robots" content="index, follow" />`, the font `preconnect`/stylesheet links, and the theme `<script>`. (Per-page description/OG/Twitter now come from `<Seo>`.)

- [ ] **Step 8: Delete the superseded title module.**

```bash
git rm src/lib/pageTitle.ts
grep -rn "lib/pageTitle\|titleForPath" src   # expect: no matches
```

Expected: no matches (the only importer was `Seo.tsx`, now repointed to `pageMeta`).

- [ ] **Step 9: Typecheck + lint + build.**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: clean. Watch for `noUncheckedIndexedAccess` (the index accesses are guarded) and `verbatimModuleSyntax` (`import type` used for `Project`).

- [ ] **Step 10: Commit.**

```bash
git add -A
git commit --author="h.goretsov <gorecov4@gmail.com>" \
  -m "feat: per-page seo metadata, open graph and json-ld"
```

---

## Task 4: Verify (npm run check + built-HTML inspection)

- [ ] **Step 1: Full gate.**

```bash
npm run check
```

Expected: green (lint · format:check · typecheck · audit-high · build).

- [ ] **Step 2: Run the production build** (stop any desktop-preview `next dev` first — it clobbers `.next`):

```bash
npm run build && npm run start   # :3000, or the "Next Start" preview config (:4173)
```

- [ ] **Step 3: Per-route head inspection.** For `/`, `/works`, `/about`, `/labs`, `/contact`, `/works/surge`, fetch the built HTML and confirm the head reflects **that** page:

```bash
for p in "" works about labs contact works/surge; do
  echo "=== /$p ==="
  curl -s "http://localhost:4173/$p" | grep -oE '<title>[^<]*</title>|<meta (name="description"|property="og:title"|property="og:url"|property="og:type")[^>]*>' | head -6
done
```

Expected: `/` → `<title>Home | By Hris</title>`, og:url `https://www.byhris.cc/`, og:type website; `/works` → `Work | By Hris`; `/works/surge` → `SURGE® | By Hris`, og:type **article**, og:url `…/works/surge`. Each description differs.

- [ ] **Step 4: JSON-LD presence + validity.**

```bash
curl -s http://localhost:4173/ | grep -o 'application/ld+json'            # home: present
curl -s "http://localhost:4173/works/surge" | grep -o '"@type":"CreativeWork"\|"@type":"BreadcrumbList"'
# Optional: pipe the script body through `python3 -m json.tool` to confirm valid JSON.
```

Expected: home has the `@graph` script (Person + WebSite); `/works/surge` has CreativeWork + BreadcrumbList.

- [ ] **Step 5: Redirect + sitemap + parity.**

```bash
curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}\n' "http://localhost:4173/projects/surge"   # 308 -> /works/surge
curl -s http://localhost:4173/sitemap.xml | grep -c '/works/'   # 6
curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:4173/works/surge"   # 200, renders the project
```

Expected: `/projects/surge` → 308 to `/works/surge`; sitemap has 6 `/works/` locs; `/works/surge` → 200. No visual change to any page.

- [ ] **Step 6: Stop the server.**

---

## Task 5: Push + PR (don't merge)

- [ ] **Step 1: Push + open PR.**

```bash
git push -u origin feat/seo-metadata-works-routing
gh pr create --base main --fill \
  --title "feat: per-page SEO metadata + /projects→/works routing"
```

- [ ] **Step 2: Wait for green** — CI (`check`) + Vercel preview `READY` + GitGuardian. Inspect the preview URL's `/works/surge` head + the `/projects/surge`→`/works/surge` redirect on real infra.

- [ ] **Step 3: Do NOT merge** until check + CI + Vercel preview green and the head/redirect/sitemap checks pass. Hand the merge decision to the user (production deploy).

---

## Self-review (against the spec)

- **Spec coverage:** titles (Task 3 pageMeta) · descriptions (pageMeta) · OG+Twitter per page (Seo, Task 3) · JSON-LD Person/WebSite/CreativeWork/BreadcrumbList (jsonLd, Task 3) · `_document` slimmed (Task 3 Step 6) · routing move + 3 refs + redirects + sitemap (Task 2) · canonical via `/works` regex (pageMeta) · verification incl. zero-visual-change (Task 4). ✔ every spec section maps to a task.
- **Placeholders:** none — full code for pageMeta, jsonLd, Seo, types, next.config, with exact commands + expected output.
- **Consistency:** `TITLE_BRAND`, `OG_IMAGE_PATH`, `OG_IMAGE_ALT`, `metaForPath`, `absoluteUrl`, the node builders, and the `Seo` props (`path`, `project`) are named identically across Tasks 2–3. The `/works/([^/]+)` regex matches in both `pageMeta` and `jsonLd`. `Profile` gains the fields `jsonLd` consumes.
