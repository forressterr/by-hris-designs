# Phase 4 — Headless CMS (Sanity) — Design Spec

**Date:** 2026-06-11 · **Status:** approved design, pre-plan · **Roadmap:** `docs/superpowers/BACKLOG.md` → Phase 4

## 1. Goal & constraints

Move the **Projects** (6 case studies) and **Labs** content out of the hand-edited
`src/data/projects.ts` and into **Sanity Content Lake**, edited through an embedded
Studio, fetched at build via GROQ, with published edits reaching the live site through
on-demand revalidation. Two outcomes:

1. **Editable CMS** for the highest-churn content (case studies + Labs).
2. **Retire the last `any`** — `Project.caseStudy: Record<string, any>` in
   `src/types/content.ts` — via Sanity **TypeGen** generating real types from the schema and queries.

**Hard constraint — zero visual change.** Every public route renders pixel- and
structure-identical to today. The data is migrated 1:1; the same components, the same
`src/styles/index.css`, and the same framer-motion transitions render it. Any rendered
difference is a migration bug to fix, never an accepted change. Verified on
`npm run build && npm run start` before merge.

## 2. Locked decisions (from brainstorm, 2026-06-11)

| Decision         | Choice                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Scope            | **Projects + Labs.** About/Home content stays in code.                                                  |
| Images           | **Keep in `public/`**; Sanity stores the same `/projects/...` path strings. `next/image` untouched.     |
| Studio           | **Embedded** at `/studio` in this Next app (`next-sanity` `NextStudio`).                                |
| Migration safety | Keep `projects.ts` exports as a typed **fallback** through cutover, then trim.                          |
| Freshness        | **SSG + on-demand revalidation** (Sanity webhook → `/api/revalidate`).                                  |
| Copy fields      | Plain `string`/`text`, **not Portable Text** — preserves exact `<p>` rendering.                         |
| Dataset          | **Public** `production` dataset → tokenless published reads.                                            |
| Ordering         | Explicit `order` number field; base query sorts by `order` ascending to preserve array-order tiebreaks. |

## 3. Content inventory

**Moves to Sanity (in scope):**

- `projects` — 6 documents (surge, cipher, altitude, floret, daily-dojo, fundedr), all with a populated `caseStudy`.
- `labsAbout` (5 items) + `labsStats` (4 items) → a single **`labs` singleton** document.

**Stays in `src/data/projects.ts` (out of scope, untouched):**
`profile`, `services`, `marqueeSubSkills`, `bio`, `codex`, `skills`, `tools`,
`achievements`, `testimonials`, `homeFaqs`.

**Images:** 63 files (~9.9 MB) in `public/projects/<slug>/` — unchanged, referenced by
the same path strings.

## 4. Schema (`src/sanity/schemaTypes/`)

Faithful mirror of the shape `works/[slug].tsx` already consumes, so page logic barely
changes and visuals cannot drift.

### `project` (document)

| Field         | Type              | Notes                                                            |
| ------------- | ----------------- | ---------------------------------------------------------------- |
| `name`        | string (required) | e.g. `SURGE®` — preserve glyphs exactly                          |
| `slug`        | slug (required)   | `source: 'name'`; existing slug values                           |
| `order`       | number (required) | original array index 0–5; drives the ascending base sort         |
| `cover`       | string (required) | path, validated `^/`                                             |
| `tags`        | array<string>     |                                                                  |
| `date`        | string            | chip year, e.g. `_24`                                            |
| `title`       | string            |                                                                  |
| `headline`    | text              |                                                                  |
| `description` | text              |                                                                  |
| `year`        | string            | e.g. `2024 — 2025`                                               |
| `client`      | string            |                                                                  |
| `timeline`    | string            |                                                                  |
| `status`      | string            | suggested list (Closed/Finished/In progress), free value allowed |
| `caseStudy`   | object (optional) | see below — optional to match the page's tolerance               |

### `caseStudy` (embedded object)

| Field            | Type                                                               |
| ---------------- | ------------------------------------------------------------------ |
| `eyebrow`        | string                                                             |
| `overview`       | object `{ hero: caseImage, themes: array<screenTab>, lead: text }` |
| `problem`        | text                                                               |
| `process`        | text                                                               |
| `screens`        | array<caseImage>                                                   |
| `mobile`         | array<caseImage>                                                   |
| `scrollViewport` | object `{ src, alt }` (optional)                                   |
| `hotspots`       | object `{ src, alt, callouts: array<hotspotCallout> }`             |
| `switcher`       | array<screenTab>                                                   |
| `outcome`        | object `{ copy: text, stats: array<stat> }`                        |

### Shared object types

- `caseImage` — `{ src (path), alt, label }`
- `screenTab` — `{ id, label, src (path), alt }`
- `hotspotCallout` — `{ x: number, y: number, label, body: text }`
- `stat` — `{ value, label }`

### `labs` (singleton document)

- `about` — array<`labsStrand` `{ name, desc: text }`> → drives `/labs`
- `stats` — array<`labsStat` `{ value, label }`> → drives the Home teaser

Singleton enforced via a fixed `_id: 'labs'` and a custom desk **structure**
(`src/sanity/structure.ts`) listing it as a single editable item (no create/delete).

**Field-presence fidelity (critical):** absent optional fields (e.g. surge has
`scrollViewport`, cipher omits it) must be **absent**, not empty. An empty `[]` where
the source had nothing would flip a page fallback (`cs?.mobile || [default]`) and change
the render. The migration omits unset fields; GROQ returns missing fields as `null` (so
`null || default` → default, matching today).

## 5. Sanity wiring (`src/sanity/`)

- `lib/client.ts` — `next-sanity` `createClient({ projectId, dataset, apiVersion, useCdn: true })`.
- `lib/queries.ts` — `defineQuery` (typed by TypeGen):
  - `PROJECTS_QUERY` = all projects, sorted `order` ascending, full fields incl. `caseStudy`.
  - `PROJECT_SLUGS_QUERY` = `*[_type=="project" && defined(slug.current)]{ "slug": slug.current }`
  - `PROJECT_QUERY` = `*[_type=="project" && slug.current==$slug][0]{ ... }`
  - `LABS_QUERY` = `*[_type=="labs"][0]{ about, stats }`
- `schemaTypes/index.ts` — registers all types.
- `structure.ts` — desk structure (labs singleton + project list).

**TypeGen:** `npm run typegen` = `sanity schema extract` → `sanity typegen generate`,
producing `sanity.types.ts` (committed). Intermediate `schema.json` gitignored. TypeGen
runs as a dev/CI helper; `tsc` consumes the committed `sanity.types.ts`, so the build has
**no runtime Sanity dependency** for types.

**Studio:** `src/pages/studio/[[...index]].tsx` mounts `NextStudio` (client-only;
Studio cannot SSR). Code-split to `/studio` — does not bloat public page bundles.
`sanity.config.ts` + `sanity.cli.ts` at repo root.

## 6. Page & consumer changes (exhaustive)

### Pages — gain `getStaticProps`, fetch in-scope content, render from props

| File               | Change                                                                                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `works/[slug].tsx` | `getStaticPaths` ← `PROJECT_SLUGS_QUERY`; `getStaticProps` ← `PROJECT_QUERY` (+ `PROJECTS_QUERY` for the related carousel, computed from props not the import). Type ← generated `PROJECT_QUERYResult`. **Retires `caseStudy: any`.** |
| `works.tsx`        | `getStaticProps` ← `PROJECTS_QUERY`; `projectsByRecency` sort unchanged, fed from props. Keeps `homeFaqs` import.                                                                                                                     |
| `index.tsx`        | `getStaticProps` ← `PROJECTS_QUERY` + `LABS_QUERY` (stats). Featured filter (`daily-dojo`, `fundedr`) + Labs teaser fed from props. Keeps `services`/`testimonials`/`homeFaqs`/`marqueeSubSkills` imports.                            |
| `labs.tsx`         | `getStaticProps` ← `LABS_QUERY` (about), rendered from props.                                                                                                                                                                         |

### Components & helpers

| File                      | Change                                                                                                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Seo.tsx`                 | `project` prop type → generated; passes project to `metaForPath(path, project)` + `breadcrumbJsonLd(path, project)`.                                                 |
| `lib/pageMeta.ts`         | `metaForPath(path, project?)` uses passed project; **drops `projects` import**.                                                                                      |
| `lib/jsonLd.ts`           | `breadcrumbJsonLd(path, project?)` uses passed project; `creativeWorkJsonLd(project)` unchanged; **drops `projects` import**, keeps `profile`.                       |
| `Breadcrumbs.tsx`         | Accepts `projectName?: string`; **drops `projects` import**; `projectName ?? Title-cased-slug` fallback.                                                             |
| `_app.tsx`                | `<Breadcrumbs projectName={pageProps.project?.name} />`.                                                                                                             |
| `ProjectCard.tsx`         | `project` prop type → generated card type (`PROJECTS_QUERYResult[number]` or narrowed). Renders `cover`/`name`/`date`/`caseStudy.overview.hero.src` — all preserved. |
| `MarqueeSubSkillCard.tsx` | No change (only a stale comment mentions `projects.js`; reads `marqueeSubSkills`, which stays).                                                                      |

### Type cutover

Generated `sanity.types.ts` provides `PROJECT_QUERYResult` etc. The hand `Project`
interface + `caseStudy: any` in `types/content.ts` are **deleted** once nothing
references them (final commit). `Profile` stays (out of scope).

## 7. Freshness — `src/pages/api/revalidate.ts`

POST handler: verify `@sanity/webhook` `isValidSignature(rawBody, signature,
SANITY_REVALIDATE_SECRET)` → from the changed doc `_type`/slug, call:
`res.revalidate('/works')`, `res.revalidate('/works/<slug>')`, `res.revalidate('/labs')`,
`res.revalidate('/')` (Home features 2 projects + Labs teaser). Returns `{ revalidated,
paths }` or 401 on bad signature.

**User-side webhook (documented, set once):** Sanity dashboard → API → Webhooks → GROQ
webhook on create/update/delete → `POST https://www.byhris.cc/api/revalidate`, shared
secret = `SANITY_REVALIDATE_SECRET`. On-demand ISR regenerates existing static pages;
**new project slugs still need a redeploy** to mint their path (acceptable — rare).

## 8. Migration & cutover

- **Import script** `scripts/migrate-to-sanity.ts`, run via `npx sanity exec
scripts/migrate-to-sanity.ts --with-user-token` (uses the logged-in user's token — no
  stored write token). Transforms `projects` + `labsAbout` + `labsStats` into documents
  with deterministic `_id`s (e.g. `project.<slug>`, `labs`) so re-runs upsert idempotently
  (`createOrReplace`). Omits unset optional fields (see §4 fidelity note).
- **Fallback window:** through the cutover, `projects.ts` keeps its in-scope exports so
  the build succeeds if Sanity is unreachable and local dev needs no network.
- **Trim (final commit):** remove `projects`, `labsAbout`, `labsStats` exports + the
  `Project`/`caseStudy:any` types. About/Home exports + `profile` remain. (Optional later
  tidy: rename the now-misnamed `projects.ts` — **not done here**, avoids churn.)

## 9. Env & provisioning

`.env.example` + Vercel (Prod+Preview) + `.env.local`:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-10-01
SANITY_REVALIDATE_SECRET=        # webhook signing secret (generate)
```

No read token (public dataset). Migration uses `--with-user-token`.

**User-side unblocker:** a free Sanity project + public `production` dataset. Driven via
the Sanity MCP / `npx sanity init`, or created in the dashboard with the projectId handed
over. This is the one gate before the migration + deploy steps.

## 10. Verification (zero-visual-change gate)

1. `npm run check` green (lint + format + **typecheck with generated types replacing the `any`** + audit-high + build).
2. `npm run build && npm run start` (NOT dev — StrictMode/AnimatePresence gotcha). Inspect `/works`, all 6 `/works/<slug>`, `/labs`, and `/` (featured pair + Labs teaser): structural/text parity vs current `main`, console-clean, no SSR/hydration errors.
3. Spot-check glyph fidelity (`®`, `—`, `'`, `…`) and field-presence (surge `scrollViewport` present vs cipher absent → same placeholder behavior).
4. `/studio` mounts and edits a doc; webhook revalidate confirmed on a Vercel preview/prod.
5. CI green + Vercel preview `READY` before merge.

## 11. Out of scope (YAGNI)

Images-to-Sanity-assets · About/Home content · Portable Text/rich text · full
presentation-decoupling of `caseStudy` · draft/preview perspective · reorder plugin
(plain `order` field instead) · renaming `projects.ts`.

## 12. Commit breakdown (tidy-first, one concern each; authored `h.goretsov`)

1. `docs:` refresh stale `BACKLOG.md` (Phases 2/3 + SEO/routing + fast-follows done; Phase 4 in progress).
2. `chore:` Sanity deps + `sanity.config.ts`/`sanity.cli.ts` + `.env.example` + tsconfig/eslint includes.
3. `feat:` schema (project + labs + shared objects + structure).
4. `feat:` client + typed GROQ queries + committed `sanity.types.ts` (`typegen` script).
5. `chore:` migration script (+ run against the project).
6. `feat:` embed Studio at `/studio`.
7. `feat:` Sanity-backed `getStaticProps`/`getStaticPaths` across the 4 pages + helper/prop rewiring (fallback kept).
8. `feat:` `/api/revalidate` route.
9. `refactor:` retire `caseStudy: any` + trim `projects.ts` in-scope exports (after verification).

## 13. Acceptance criteria

- Case studies + Labs editable in `/studio`; pages render from Sanity (SSG); published edits to existing docs go live via revalidation without redeploy.
- `caseStudy: Record<string, any>` gone; `npm run check` typecheck green on generated types.
- **Zero visual change** across every route × light/dark/breakpoints (verified per §10).
- `projects.ts` trimmed to out-of-scope content only; no in-scope data duplicated.

## 14. Risks & mitigations

| Risk                                                                | Mitigation                                                                                                    |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Migration alters data (glyphs, whitespace, presence) → visual drift | 1:1 transform, omit-unset rule, §10 parity inspection before merge                                            |
| Build coupled to Sanity availability                                | `useCdn`, public dataset, `projects.ts` fallback through cutover; types are committed (no build-time typegen) |
| Studio bundle bloat                                                 | `/studio` is code-split; public bundles unaffected                                                            |
| Render-time slug lookups can't be async                             | Project flows through `getStaticProps` → props → `Seo`/`Breadcrumbs` (no array import)                        |
| New project slug not statically generated                           | Documented: new slugs need a redeploy (rare); edits to existing projects do not                               |
