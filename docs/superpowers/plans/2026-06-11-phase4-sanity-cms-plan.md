# Phase 4 — Headless CMS (Sanity) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Projects (6 case studies) + Labs content from `src/data/projects.ts` into Sanity, edited via an embedded `/studio`, fetched at build with GROQ, kept fresh via on-demand revalidation — with **zero visual change** and the `caseStudy: any` retired via TypeGen.

**Architecture:** Embedded Sanity Studio (`next-sanity` `NextStudio` at `/studio`). Public `production` dataset → tokenless reads (`useCdn`). Pages fetch via typed GROQ in `getStaticProps`/`getStaticPaths`; `projects.ts` stays as a typed fallback (`src/sanity/lib/fallback.ts`) until a final cutover. Render-time `projects.find()` lookups in metadata helpers are replaced by threading the `project` object through props. A `/api/revalidate` webhook regenerates static pages on publish.

**Tech Stack:** Next 15 (Pages Router), React 19, TypeScript strict, Sanity **v5** (pinned `sanity@5.31.1` + `next-sanity@11.6.13` — the Next-15-compatible line; `sanity@6`/`next-sanity@13` peer-require Next 16, which this repo deliberately skipped), `@sanity/vision@5.31.1`, `@sanity/webhook@4.0.4`, `styled-components@6.4.2`, GROQ, Sanity TypeGen. Verification = `npm run check` (lint + format + typecheck + audit-high + build) + `npm run build && npm run start` parity inspection (no unit-test runner until Phase 5).

**Reference spec:** `docs/superpowers/specs/2026-06-11-phase4-sanity-cms-design.md`

---

## File structure

**Create:**

- `sanity.config.ts` — Studio config (root)
- `sanity.cli.ts` — CLI/exec/typegen config (root)
- `sanity-typegen.json` — TypeGen paths (root)
- `src/sanity/schemaTypes/index.ts` — schema registry
- `src/sanity/schemaTypes/objects.ts` — `caseImage`, `screenTab`, `hotspotCallout`, `stat`, `labsStrand`, `labsStat`
- `src/sanity/schemaTypes/caseStudy.ts` — `caseStudy` object
- `src/sanity/schemaTypes/project.ts` — `project` document
- `src/sanity/schemaTypes/labs.ts` — `labs` singleton document
- `src/sanity/structure.ts` — desk structure (labs singleton)
- `src/sanity/lib/client.ts` — read client
- `src/sanity/lib/queries.ts` — typed GROQ
- `src/sanity/lib/fallback.ts` — typed fallback from `projects.ts` (deleted at cutover)
- `src/pages/studio/[[...index]].tsx` — Studio mount
- `src/pages/api/revalidate.ts` — webhook revalidation
- `scripts/migrate-to-sanity.ts` — one-time import
- `sanity.types.ts` — generated, committed

**Modify:**

- `package.json` (deps + `typegen` script), `.env.example`, `.gitignore`, `.prettierignore`, `eslint.config.js`
- `src/pages/{index,works,labs}.tsx`, `src/pages/works/[slug].tsx`, `src/pages/_app.tsx`
- `src/components/{Seo,Breadcrumbs,ProjectCard}.tsx`, `src/lib/{pageMeta,jsonLd}.ts`
- (cutover) `src/data/projects.ts`, `src/types/content.ts`

---

## Task 1: Refresh the stale BACKLOG.md

**Files:** Modify `docs/superpowers/BACKLOG.md`

- [ ] **Step 1: Update the header status block.** Open `docs/superpowers/BACKLOG.md`. Replace the sentence in the top blockquote that reads `**Phase 2 (contact-form hardening) is now also MERGED + live (PR #3); Phases 3–5 + fast-follows are not started**` with:

```
**Phases 2 & 3 are MERGED + live** (contact-form hardening PR #3; Hybrid Tailwind PR #7),
**SEO/metadata + /projects→/works routing** is merged (PR #8), and **all fast-follows are
done** (nav-width PR #9, dep bumps PR #10, next/image PR #11, dead-dep cleanup PR #12).
**Phase 4 (Sanity CMS) is in progress; Phase 5 is not started.**
```

- [ ] **Step 2: Mark the Phase 3 section done.** In the `## Phase 3 — Tailwind CSS` section, change the `**▶ DECISION MADE (2026-06-10): Option A — HYBRID.** ...` line to a status line: `> **STATUS: MERGED + LIVE (PR #7, 2026-06-11).** Hybrid Tailwind v4 — no-Preflight selective import + @theme inline token bridge; Breadcrumbs migrated as the proof component. Details in the SESSION_HANDOFF + the phase3 spec/plan.`

- [ ] **Step 3: Add a status line to Phase 4.** Under `## Phase 4 — Headless CMS (Works · Projects · Labs)`, add immediately below the heading: `> **STATUS: IN PROGRESS (2026-06-11).** Scope = Projects + Labs (About/Home stays in code). Spec + plan: docs/superpowers/{specs,plans}/2026-06-11-phase4-sanity-cms*.`

- [ ] **Step 4: Verify formatting.** Run: `npx prettier --check docs/superpowers/BACKLOG.md`
      Expected: passes (or run `npx prettier --write docs/superpowers/BACKLOG.md` then re-check).

- [ ] **Step 5: Commit.**

```bash
git add docs/superpowers/BACKLOG.md
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "docs: refresh backlog status for phases 2-3, seo, fast-follows, phase 4 start"
```

---

## Task 2: Provision the Sanity project (USER GATE)

**No repo files.** This unblocks TypeGen (Task 5), migration (Task 6), Studio (Task 7), and the Vercel build. Tasks 3–4 can be authored in parallel while this completes.

- [ ] **Step 1: Create the project + dataset.** Either path:
  - **Driven:** run `npx sanity@latest login` then `npx sanity@latest init --create-project "By_Hris Designs" --dataset production` in the repo root (do NOT let it overwrite files — choose "no" to schema/template output; we only need the project + dataset). Or drive it via the Sanity MCP (`mcp__plugin_sanity_Sanity__*`) after authenticating.
  - **Manual:** create a free project at sanity.io, add a dataset named `production`.
- [ ] **Step 2: Make the dataset public.** Sanity dashboard → project → Datasets → `production` → set visibility **Public** (portfolio content is public; enables tokenless reads).
- [ ] **Step 3: Capture the projectId** (dashboard → project → API, or the init output).
- [ ] **Step 4: Write `.env.local`** (gitignored) in the repo root — append:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=<projectId>
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-10-01
SANITY_REVALIDATE_SECRET=<generate: openssl rand -hex 32>
```

- [ ] **Step 5: Add the same four vars to Vercel** (Settings → Environment Variables, Production + Preview). The three `NEXT_PUBLIC_*` are plain; `SANITY_REVALIDATE_SECRET` marked Sensitive. (Needed for the PR preview build, which fetches Sanity at build time.)
- [ ] **Step 6: Confirm reachable.** Run: `npx sanity@latest documents query '*[0]' --project <projectId> --dataset production` → expect an empty/has-result response, not an auth error.

---

## Task 3: Install deps + Sanity config + tooling wiring

**Files:** Create `sanity.config.ts`, `sanity.cli.ts`, `sanity-typegen.json`; Modify `package.json`, `.env.example`, `.gitignore`, `.prettierignore`, `eslint.config.js`

- [ ] **Step 1: Install (auto-pins via `.npmrc save-exact`).**

```bash
npm i sanity@5.31.1 next-sanity@11.6.13 @sanity/vision@5.31.1 @sanity/webhook@4.0.4 styled-components@6.4.2
```

Pinned to the **Sanity v5 line** on purpose: `next-sanity@12+`/`@13` and `sanity@6` peer-require `next@^16`, but this repo stays on Next 15. `next-sanity@11.6.13` peers `next ^15.1 || ^16` and `sanity ^4.22 || ^5`. Expected: 0 high/critical audit findings (`npm audit --audit-level=high` exits 0; ~19 moderate transitive, below the gate).

- [ ] **Step 2: Add the `typegen` script.** In `package.json` `scripts`, add after `"start": "next start",`:

```json
    "typegen": "sanity schema extract && sanity typegen generate",
```

- [ ] **Step 3: Create `sanity.cli.ts`** (root):

```ts
import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  },
});
```

- [ ] **Step 4: Create `sanity.config.ts`** (root):

```ts
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './src/sanity/schemaTypes';
import { structure } from './src/sanity/structure';

function assertValue<T>(v: T | undefined, msg: string): T {
  if (v === undefined) throw new Error(msg);
  return v;
}

const projectId = assertValue(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  'Missing NEXT_PUBLIC_SANITY_PROJECT_ID',
);
const dataset = assertValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  'Missing NEXT_PUBLIC_SANITY_DATASET',
);

export default defineConfig({
  name: 'default',
  title: 'By_Hris Designs',
  projectId,
  dataset,
  basePath: '/studio',
  plugins: [structureTool({ structure }), visionTool()],
  schema: { types: schemaTypes },
});
```

(Tasks 4 creates `./src/sanity/schemaTypes` + `./src/sanity/structure`; this file will not typecheck until Task 4 lands — that's expected, commit Task 3 and 4 can be staged together if preferred, or proceed; the build is verified at the end of Task 5.)

- [ ] **Step 5: Create `sanity-typegen.json`** (root):

```json
{
  "path": "./src/**/*.{ts,tsx}",
  "schema": "./schema.json",
  "generates": "./sanity.types.ts"
}
```

- [ ] **Step 6: Extend `.env.example`.** Append:

```
#
# Phase 4 — Sanity CMS (Projects + Labs). Public production dataset → tokenless
# reads. Set the three NEXT_PUBLIC_* in Vercel (Prod+Preview) and .env.local.
# NEXT_PUBLIC_SANITY_PROJECT_ID=
# NEXT_PUBLIC_SANITY_DATASET=production
# NEXT_PUBLIC_SANITY_API_VERSION=2024-10-01
#
# Webhook signing secret for /api/revalidate (generate: openssl rand -hex 32).
# SANITY_REVALIDATE_SECRET=
```

- [ ] **Step 7: Extend `.gitignore`.** Append:

```
# Sanity TypeGen intermediate + runtime
schema.json
.sanity/
```

- [ ] **Step 8: Ignore the generated types from formatting/lint.** Append `sanity.types.ts` to `.prettierignore`. In `eslint.config.js`, add `'sanity.types.ts'` to the global `ignores` array (the config object with `ignores`; if none exists, add `{ ignores: ['sanity.types.ts'] }` as the first array entry).

- [ ] **Step 9: Verify lint/format tolerate the new config files.** Run: `npm run lint && npm run format:check`
      Expected: PASS (schema files don't exist yet; `sanity.config.ts` imports will error in typecheck only — that's resolved in Task 4/5; lint/format pass).

- [ ] **Step 10: Commit.**

```bash
git add package.json package-lock.json sanity.config.ts sanity.cli.ts sanity-typegen.json .env.example .gitignore .prettierignore eslint.config.js
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "chore: add sanity deps, studio config, and typegen wiring"
```

---

## Task 4: Schema (objects, caseStudy, project, labs, structure, registry)

**Files:** Create `src/sanity/schemaTypes/{objects,caseStudy,project,labs,index}.ts`, `src/sanity/structure.ts`

- [ ] **Step 1: Create `src/sanity/schemaTypes/objects.ts`** (the small shared objects):

```ts
import { defineField, defineType } from 'sanity';

// Image reference as a public/ path string (images stay in the repo — Phase 4
// decision). Validated to start with "/".
const pathString = (name: string, title: string, required = false) =>
  defineField({
    name,
    title,
    type: 'string',
    validation: (rule) => {
      const r = rule.regex(/^\//, { name: 'path' });
      return required ? r.required() : r;
    },
  });

export const caseImage = defineType({
  name: 'caseImage',
  title: 'Image',
  type: 'object',
  fields: [
    pathString('src', 'Source path', true),
    defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
    defineField({ name: 'label', title: 'Label', type: 'string' }),
  ],
});

export const screenTab = defineType({
  name: 'screenTab',
  title: 'Screen tab',
  type: 'object',
  fields: [
    defineField({ name: 'id', title: 'Id', type: 'string' }),
    defineField({ name: 'label', title: 'Label', type: 'string' }),
    pathString('src', 'Source path'),
    defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
  ],
});

export const hotspotCallout = defineType({
  name: 'hotspotCallout',
  title: 'Callout',
  type: 'object',
  fields: [
    defineField({ name: 'x', title: 'X %', type: 'number' }),
    defineField({ name: 'y', title: 'Y %', type: 'number' }),
    defineField({ name: 'label', title: 'Label', type: 'string' }),
    defineField({ name: 'body', title: 'Body', type: 'text' }),
  ],
});

export const stat = defineType({
  name: 'stat',
  title: 'Stat',
  type: 'object',
  fields: [
    defineField({ name: 'value', title: 'Value', type: 'string' }),
    defineField({ name: 'label', title: 'Label', type: 'string' }),
  ],
});

export const labsStrand = defineType({
  name: 'labsStrand',
  title: 'Labs strand',
  type: 'object',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string' }),
    defineField({ name: 'desc', title: 'Description', type: 'text' }),
  ],
});

export const labsStat = defineType({
  name: 'labsStat',
  title: 'Labs stat',
  type: 'object',
  fields: [
    defineField({ name: 'value', title: 'Value', type: 'string' }),
    defineField({ name: 'label', title: 'Label', type: 'string' }),
  ],
});
```

- [ ] **Step 2: Create `src/sanity/schemaTypes/caseStudy.ts`:**

```ts
import { defineField, defineType } from 'sanity';

export const caseStudy = defineType({
  name: 'caseStudy',
  title: 'Case study',
  type: 'object',
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string' }),
    defineField({
      name: 'overview',
      title: 'Overview',
      type: 'object',
      fields: [
        defineField({ name: 'hero', title: 'Hero', type: 'caseImage' }),
        defineField({
          name: 'themes',
          title: 'Theme variants',
          type: 'array',
          of: [{ type: 'screenTab' }],
        }),
        defineField({ name: 'lead', title: 'Lead', type: 'text' }),
      ],
    }),
    defineField({ name: 'problem', title: 'Problem', type: 'text' }),
    defineField({ name: 'process', title: 'Process', type: 'text' }),
    defineField({
      name: 'screens',
      title: 'Key screens',
      type: 'array',
      of: [{ type: 'caseImage' }],
    }),
    defineField({
      name: 'mobile',
      title: 'Mobile screens',
      type: 'array',
      of: [{ type: 'caseImage' }],
    }),
    defineField({
      name: 'scrollViewport',
      title: 'Scroll viewport',
      type: 'object',
      fields: [
        defineField({ name: 'src', title: 'Source path', type: 'string' }),
        defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
      ],
    }),
    defineField({
      name: 'hotspots',
      title: 'Hotspots',
      type: 'object',
      fields: [
        defineField({ name: 'src', title: 'Source path', type: 'string' }),
        defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
        defineField({
          name: 'callouts',
          title: 'Callouts',
          type: 'array',
          of: [{ type: 'hotspotCallout' }],
        }),
      ],
    }),
    defineField({
      name: 'switcher',
      title: 'Screen switcher',
      type: 'array',
      of: [{ type: 'screenTab' }],
    }),
    defineField({
      name: 'outcome',
      title: 'Outcome',
      type: 'object',
      fields: [
        defineField({ name: 'copy', title: 'Copy', type: 'text' }),
        defineField({
          name: 'stats',
          title: 'Stats',
          type: 'array',
          of: [{ type: 'stat' }],
        }),
      ],
    }),
  ],
});
```

- [ ] **Step 3: Create `src/sanity/schemaTypes/project.ts`:**

```ts
import { defineField, defineType } from 'sanity';

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Lower sorts first; preserves the original list order.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'cover',
      title: 'Cover path',
      type: 'string',
      validation: (rule) => rule.required().regex(/^\//, { name: 'path' }),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({ name: 'date', title: 'Date chip', type: 'string' }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'headline', title: 'Headline', type: 'text' }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({ name: 'year', title: 'Year', type: 'string' }),
    defineField({ name: 'client', title: 'Client', type: 'string' }),
    defineField({ name: 'timeline', title: 'Timeline', type: 'string' }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: { list: ['Closed', 'Finished', 'In progress'] },
    }),
    defineField({ name: 'caseStudy', title: 'Case study', type: 'caseStudy' }),
  ],
  orderings: [
    {
      title: 'Manual order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'name', subtitle: 'year' },
  },
});
```

- [ ] **Step 4: Create `src/sanity/schemaTypes/labs.ts`:**

```ts
import { defineField, defineType } from 'sanity';

export const labs = defineType({
  name: 'labs',
  title: 'Labs',
  type: 'document',
  fields: [
    defineField({
      name: 'about',
      title: 'Strands (about Labs)',
      type: 'array',
      of: [{ type: 'labsStrand' }],
    }),
    defineField({
      name: 'stats',
      title: 'Home teaser stats',
      type: 'array',
      of: [{ type: 'labsStat' }],
    }),
  ],
  preview: { prepare: () => ({ title: 'Labs' }) },
});
```

- [ ] **Step 5: Create `src/sanity/schemaTypes/index.ts`:**

```ts
import type { SchemaTypeDefinition } from 'sanity';
import {
  caseImage,
  screenTab,
  hotspotCallout,
  stat,
  labsStrand,
  labsStat,
} from './objects';
import { caseStudy } from './caseStudy';
import { project } from './project';
import { labs } from './labs';

export const schemaTypes: SchemaTypeDefinition[] = [
  // documents
  project,
  labs,
  // objects
  caseStudy,
  caseImage,
  screenTab,
  hotspotCallout,
  stat,
  labsStrand,
  labsStat,
];
```

- [ ] **Step 6: Create `src/sanity/structure.ts`** (labs as a singleton):

```ts
import type { StructureResolver } from 'sanity/structure';

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('project').title('Projects'),
      S.listItem()
        .title('Labs')
        .id('labs')
        .child(S.document().schemaType('labs').documentId('labs')),
    ]);
```

- [ ] **Step 7: Typecheck.** Run: `npm run typecheck`
      Expected: PASS — `sanity.config.ts` now resolves its imports. (If `verbatimModuleSyntax` flags a value/type import, use `import type` for type-only imports as shown above.)

- [ ] **Step 8: Commit.**

```bash
git add src/sanity/schemaTypes sanity.config.ts
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "feat: add sanity schema for project and labs content"
```

---

## Task 5: Read client, typed GROQ queries, and generated types

**Files:** Create `src/sanity/lib/client.ts`, `src/sanity/lib/queries.ts`, `sanity.types.ts` (generated)

- [ ] **Step 1: Create `src/sanity/lib/client.ts`:**

```ts
import { createClient } from 'next-sanity';

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-10-01',
  useCdn: true,
});
```

- [ ] **Step 2: Create `src/sanity/lib/queries.ts`** (explicit projections so the result types match the page's consumption contract — `slug` becomes a string):

```ts
import { defineQuery } from 'next-sanity';

const PROJECT_FIELDS = `
  "slug": slug.current, name, order, cover, tags, date, title, headline,
  description, year, client, timeline, status, caseStudy
`;

export const PROJECTS_QUERY = defineQuery(`
  *[_type == "project"] | order(order asc) { ${PROJECT_FIELDS} }
`);

export const PROJECT_SLUGS_QUERY = defineQuery(`
  *[_type == "project" && defined(slug.current)] { "slug": slug.current }
`);

export const PROJECT_QUERY = defineQuery(`
  *[_type == "project" && slug.current == $slug][0] { ${PROJECT_FIELDS} }
`);

export const LABS_QUERY = defineQuery(`
  *[_type == "labs"][0] { about, stats }
`);
```

- [ ] **Step 3: Generate types.** Run: `npm run typegen`
      Expected: writes `sanity.types.ts` (and intermediate `schema.json`, gitignored). Output reports the queries it typed (e.g. `PROJECTS_QUERYResult`, `PROJECT_QUERYResult`, `LABS_QUERYResult`). If it reports "0 queries found", confirm the queries use `defineQuery` and `sanity-typegen.json` `path` covers `src/`.

- [ ] **Step 4: Confirm the `caseStudy` type was inferred.** Run: `grep -n "caseStudy" sanity.types.ts | head`
      Expected: `caseStudy` appears as a structured object type (not `any`/`unknown`) inside `PROJECT_QUERYResult` / `PROJECTS_QUERYResult`.

- [ ] **Step 5: Typecheck + lint.** Run: `npm run typecheck && npm run lint`
      Expected: PASS (`sanity.types.ts` is eslint/prettier-ignored from Task 3).

- [ ] **Step 6: Commit.**

```bash
git add src/sanity/lib/client.ts src/sanity/lib/queries.ts sanity.types.ts
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "feat: add sanity client, typed groq queries, and generated types"
```

---

## Task 6: Migration script + run it

**Files:** Create `scripts/migrate-to-sanity.ts`

- [ ] **Step 1: Create `scripts/migrate-to-sanity.ts`** (deterministic `_id`s + `_key`/`_type` on array members → idempotent `createOrReplace`; omits unset fields):

```ts
import { getCliClient } from 'sanity/cli';
import { projects, labsAbout, labsStats } from '../src/data/projects';

const client = getCliClient();

// Drop undefined keys so absent optional fields stay ABSENT (not null/empty)
// — preserves the page's fallback behavior (see spec §4 fidelity note).
function clean<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as T;
}

const keyed = (type: string, items: Record<string, unknown>[] | undefined) =>
  items?.map((it, i) => clean({ ...it, _type: type, _key: `k${i}` }));

type CS = NonNullable<(typeof projects)[number]['caseStudy']>;

function toCaseStudy(cs: CS) {
  return clean({
    _type: 'caseStudy',
    eyebrow: cs.eyebrow,
    overview: cs.overview
      ? clean({
          hero: cs.overview.hero
            ? clean({ _type: 'caseImage', ...cs.overview.hero })
            : undefined,
          themes: keyed('screenTab', cs.overview.themes),
          lead: cs.overview.lead,
        })
      : undefined,
    problem: cs.problem,
    process: cs.process,
    screens: keyed('caseImage', cs.screens),
    mobile: keyed('caseImage', cs.mobile),
    scrollViewport: cs.scrollViewport
      ? clean({ ...cs.scrollViewport })
      : undefined,
    hotspots: cs.hotspots
      ? clean({
          src: cs.hotspots.src,
          alt: cs.hotspots.alt,
          callouts: keyed('hotspotCallout', cs.hotspots.callouts),
        })
      : undefined,
    switcher: keyed('screenTab', cs.switcher),
    outcome: cs.outcome
      ? clean({
          copy: cs.outcome.copy,
          stats: keyed('stat', cs.outcome.stats),
        })
      : undefined,
  });
}

async function run() {
  const tx = client.transaction();

  projects.forEach((p, i) => {
    tx.createOrReplace(
      clean({
        _id: `project.${p.slug}`,
        _type: 'project',
        order: i,
        slug: { _type: 'slug', current: p.slug },
        name: p.name,
        cover: p.cover,
        tags: p.tags,
        date: p.date,
        title: p.title,
        headline: p.headline,
        description: p.description,
        year: p.year,
        client: p.client,
        timeline: p.timeline,
        status: p.status,
        caseStudy: p.caseStudy ? toCaseStudy(p.caseStudy as CS) : undefined,
      }),
    );
  });

  tx.createOrReplace({
    _id: 'labs',
    _type: 'labs',
    about: keyed('labsStrand', labsAbout),
    stats: keyed('labsStat', labsStats),
  });

  const res = await tx.commit();
  console.log(`Migrated ${projects.length} projects + labs.`, res.documentIds);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run the migration.** Run: `npx sanity exec scripts/migrate-to-sanity.ts --with-user-token`
      Expected: `Migrated 6 projects + labs.` plus 7 document ids. (Re-runnable safely — `createOrReplace` upserts the same `_id`s.)

- [ ] **Step 3: Verify the data landed.** Run: `npx sanity documents query '*[_type=="project"]{ "slug": slug.current, order } | order(order asc)'`
      Expected: surge(0), cipher(1), altitude(2), floret(3), daily-dojo(4), fundedr(5).

- [ ] **Step 4: Spot-check fidelity.** Run: `npx sanity documents query '*[_id=="project.surge"][0]{ name, "hasScroll": defined(caseStudy.scrollViewport) }'` then `... project.cipher ... { "hasScroll": defined(caseStudy.scrollViewport) }`
      Expected: surge `name` = `SURGE®` (® intact), `hasScroll` = true; cipher `hasScroll` = false (absent, not empty).

- [ ] **Step 5: Lint/typecheck the script.** Run: `npm run lint && npm run typecheck`
      Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add scripts/migrate-to-sanity.ts
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "chore: add one-time projects.ts to sanity migration script"
```

---

## Task 7: Embed Studio at /studio + bypass the site layout

**Files:** Create `src/pages/studio/[[...index]].tsx`; Modify `src/pages/_app.tsx`

- [ ] **Step 1: Create `src/pages/studio/[[...index]].tsx`:**

```tsx
import Head from 'next/head';
import { NextStudio } from 'next-sanity/studio';
import config from '../../../sanity.config';

export default function StudioPage() {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
      </Head>
      <NextStudio config={config} />
    </>
  );
}
```

- [ ] **Step 2: Bypass the site chrome for /studio in `_app.tsx`.** After the `const initial = ...` line and BEFORE the main `return (`, insert:

```tsx
// Sanity Studio brings its own full-screen UI — render it bare, outside the
// site Header/Footer/Breadcrumbs/transition shell.
if (router.asPath.startsWith('/studio')) {
  return <Component {...pageProps} />;
}
```

(All hooks — `useRouter`, `useReducedMotion`, `useEffect` — are already called above this point, so the early return is valid.)

- [ ] **Step 3: Build.** Run: `npm run build`
      Expected: compiles; route list includes `/studio/[[...index]]`.

- [ ] **Step 4: Verify Studio loads (NOT dev — use build+start).**

```bash
npm run start &
sleep 4
curl -sI http://localhost:3000/studio | head -1
curl -s http://localhost:3000/studio | grep -ic "sanity\|studio"
kill %1
```

Expected: `200`; grep count > 0. (Manual confirmation: open `http://localhost:3000/studio`, log in, confirm the Projects list shows 6 docs + a single Labs entry.) If Studio fails to render due to `X-Frame-Options`, it would only matter for embedding elsewhere — at `/studio` itself (same origin) it loads; no header change needed.

- [ ] **Step 5: Typecheck + lint.** Run: `npm run typecheck && npm run lint`
      Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add src/pages/studio/ src/pages/_app.tsx
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "feat: embed sanity studio at /studio"
```

---

## Task 8: Fetch Projects + Labs from Sanity in the pages (fallback kept)

**Files:** Create `src/sanity/lib/fallback.ts`; Modify `src/pages/{index,works,labs}.tsx`, `src/pages/works/[slug].tsx`, `src/components/ProjectCard.tsx`

- [ ] **Step 1: Create `src/sanity/lib/fallback.ts`** (typed fallback built from the hand data; deleted at cutover):

```ts
import { projects, labsAbout, labsStats } from '../../data/projects';
import type {
  PROJECTS_QUERYResult,
  LABS_QUERYResult,
} from '../../../sanity.types';

// Faithful, identical-data fallback so the build/dev still works if Sanity is
// unreachable. The hand `caseStudy` is `any`; the cast is sound because the
// data IS the data the schema was modeled from. Removed at cutover (Task 11).
export const FALLBACK_PROJECTS: PROJECTS_QUERYResult = projects.map((p, i) => ({
  slug: p.slug,
  name: p.name,
  order: i,
  cover: p.cover ?? null,
  tags: p.tags ?? null,
  date: p.date ?? null,
  title: p.title ?? null,
  headline: p.headline ?? null,
  description: p.description ?? null,
  year: p.year ?? null,
  client: p.client ?? null,
  timeline: p.timeline ?? null,
  status: p.status ?? null,
  caseStudy: (p.caseStudy ?? null) as PROJECTS_QUERYResult[number]['caseStudy'],
}));

export const FALLBACK_LABS: LABS_QUERYResult = {
  about: labsAbout,
  stats: labsStats,
};
```

(If TypeGen named the result types differently — check `sanity.types.ts` — use those exact names.)

- [ ] **Step 2: Add a typed fetch helper to `src/sanity/lib/client.ts`.** Append:

```ts
export async function sanityOr<T>(
  query: string,
  params: Record<string, unknown>,
  fallback: T,
): Promise<T> {
  try {
    return (await client.fetch<T>(query, params)) ?? fallback;
  } catch {
    return fallback;
  }
}
```

- [ ] **Step 3: Rewire `src/pages/works.tsx`.** Replace the data import + module-level sort with a `ProjectListItem` prop type and `getStaticProps`:
  - Change `import { projects, homeFaqs } from '../data/projects';` → `import { homeFaqs } from '../data/projects';`
  - Add: `import type { GetStaticProps } from 'next';`, `import type { PROJECTS_QUERYResult } from '../../sanity.types';`, `import { client, sanityOr } from '../sanity/lib/client';`, `import { PROJECTS_QUERY } from '../sanity/lib/queries';`, `import { FALLBACK_PROJECTS } from '../sanity/lib/fallback';`
  - Replace `const chipYear = (p: Project) =>` and `yearMax` parameter types `Project` → `PROJECTS_QUERYResult[number]`. Move `projectsByRecency` INSIDE the component, computed from a `projects` prop.
  - Signature: `export default function Works({ projects }: { projects: PROJECTS_QUERYResult }) {` then `const projectsByRecency = [...projects].sort((a, b) => chipYear(b) - chipYear(a) || yearMax(b) - yearMax(a));`
  - Append at file end:

```tsx
export const getStaticProps: GetStaticProps<{
  projects: PROJECTS_QUERYResult;
}> = async () => {
  const projects = await sanityOr(PROJECTS_QUERY, {}, FALLBACK_PROJECTS);
  return { props: { projects } };
};
```

- Remove the now-unused `import type { Project } from '../types/content';`.

- [ ] **Step 4: Rewire `src/pages/labs.tsx`.**
  - Change `import { labsAbout } from '../data/projects';` → remove.
  - Add: `import type { GetStaticProps } from 'next';`, `import type { LABS_QUERYResult } from '../../sanity.types';`, `import { sanityOr } from '../sanity/lib/client';`, `import { LABS_QUERY } from '../sanity/lib/queries';`, `import { FALLBACK_LABS } from '../sanity/lib/fallback';`
  - Signature: `export default function Labs({ labs }: { labs: LABS_QUERYResult }) {` and change the map to `{(labs?.about ?? []).map((item) => (` keeping the same `<div className="gear__row">` body.
  - Append:

```tsx
export const getStaticProps: GetStaticProps<{
  labs: LABS_QUERYResult;
}> = async () => {
  const labs = await sanityOr(LABS_QUERY, {}, FALLBACK_LABS);
  return { props: { labs } };
};
```

- [ ] **Step 5: Rewire `src/pages/index.tsx`.**
  - Change `import { projects, services, testimonials, homeFaqs, labsStats, marqueeSubSkills } from '../data/projects';` → drop `projects` and `labsStats`: `import { services, testimonials, homeFaqs, marqueeSubSkills } from '../data/projects';`
  - Add the same `GetStaticProps`, `PROJECTS_QUERYResult`/`LABS_QUERYResult`, `sanityOr`, `PROJECTS_QUERY`/`LABS_QUERY`, `FALLBACK_PROJECTS`/`FALLBACK_LABS` imports.
  - Component signature gains props: `export default function Home({ projects, labs }: { projects: PROJECTS_QUERYResult; labs: LABS_QUERYResult }) {`
  - The featured filter stays identical: `{projects.filter((p) => p.slug === 'daily-dojo' || p.slug === 'fundedr').map(...)}`.
  - The Labs teaser map: `{(labs?.stats ?? []).map((stat) => (` keeping the same `.stat` markup.
  - Append:

```tsx
export const getStaticProps: GetStaticProps<{
  projects: PROJECTS_QUERYResult;
  labs: LABS_QUERYResult;
}> = async () => {
  const [projects, labs] = await Promise.all([
    sanityOr(PROJECTS_QUERY, {}, FALLBACK_PROJECTS),
    sanityOr(LABS_QUERY, {}, FALLBACK_LABS),
  ]);
  return { props: { projects, labs } };
};
```

- [ ] **Step 6: Rewire `src/pages/works/[slug].tsx`** (the case-study page — retires the `any`):
  - Replace `import { projects } from '../../data/projects';` and `import type { Project as ProjectData } from '../../types/content';` with: `import type { GetStaticPaths, GetStaticProps } from 'next';` (keep existing), `import type { PROJECT_QUERYResult, PROJECTS_QUERYResult } from '../../../sanity.types';`, `import { client } from '../../sanity/lib/client';`, `import { PROJECT_QUERY, PROJECT_SLUGS_QUERY, PROJECTS_QUERY } from '../../sanity/lib/queries';`, `import { FALLBACK_PROJECTS } from '../../sanity/lib/fallback';`
  - Change the component signature to take the fetched project + all projects:
    `export default function Project({ project, allProjects }: { project: NonNullable<PROJECT_QUERYResult>; allProjects: PROJECTS_QUERYResult }) {`
  - Replace `const relatedProjects = projects.filter(...)` with `allProjects.filter(...)` (same body).
  - Delete the loose local `type ScreenTab/Shot/Stat` declarations and the `: ScreenTab`/`: Shot`/`: Stat` parameter annotations in the `.map()` calls — the generated `project.caseStudy` type now types these (drop the annotations: `.map((t) => ...)`, `.map((s, i) => ...)`).
  - `const cs = project.caseStudy;` stays — now strongly typed.
  - Replace the bottom data functions:

```tsx
export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = await client
    .fetch(PROJECT_SLUGS_QUERY)
    .catch(() => FALLBACK_PROJECTS.map((p) => ({ slug: p.slug })));
  return {
    paths: slugs.map((s) => ({ params: { slug: s.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<{
  project: NonNullable<PROJECT_QUERYResult>;
  allProjects: PROJECTS_QUERYResult;
}> = async ({ params }) => {
  const slug = params?.slug as string;
  const [project, allProjects] = await Promise.all([
    client.fetch(PROJECT_QUERY, { slug }).catch(() => null),
    client.fetch(PROJECTS_QUERY).catch(() => FALLBACK_PROJECTS),
  ]);
  const resolved =
    project ?? FALLBACK_PROJECTS.find((p) => p.slug === slug) ?? null;
  if (!resolved) return { notFound: true };
  return { props: { project: resolved, allProjects } };
};
```

- `<Seo path={`/works/${project.slug}`} project={project} />` — `project` is now the Sanity shape; the `Seo` prop type is updated in Task 9.
- `<ProjectCard project={p} />` in the related carousel — `p` is `PROJECTS_QUERYResult[number]`; ProjectCard type updated next step.

- [ ] **Step 7: Update `src/components/ProjectCard.tsx` prop type.**
  - Replace `import type { Project } from '../types/content';` → `import type { PROJECTS_QUERYResult } from '../../sanity.types';`
  - `export default function ProjectCard({ project }: { project: PROJECTS_QUERYResult[number] }) {`
  - The body (`project.cover || project.caseStudy?.overview?.hero?.src`, `project.name`, `project.date`, `project.slug`) is unchanged and type-compatible.

- [ ] **Step 8: Typecheck.** Run: `npm run typecheck`
      Expected: PASS. Fix any prop-shape mismatches by aligning to the generated types (e.g. nullable fields use `?? ''` only where the JSX already tolerated `undefined`).

- [ ] **Step 9: Build + parity inspect.** Run:

```bash
npm run build && (npm run start & sleep 4)
for u in / /works /labs /works/surge /works/cipher /works/altitude /works/floret /works/daily-dojo /works/fundedr; do
  echo "$u -> $(curl -sI http://localhost:3000$u | head -1)"
done
curl -s http://localhost:3000/works/surge | grep -c "SURGE\|Built to Compete"
kill %1
```

Expected: all `200`; surge page contains its title/name. Manually diff `/works`, a case-study page, and `/labs` against `main` (or the live site) — text, order, images, placeholders identical.

- [ ] **Step 10: Lint.** Run: `npm run lint`
      Expected: PASS.

- [ ] **Step 11: Commit.**

```bash
git add src/sanity/lib/fallback.ts src/sanity/lib/client.ts src/pages/index.tsx src/pages/works.tsx src/pages/labs.tsx src/pages/works/[slug].tsx src/components/ProjectCard.tsx
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "feat: render projects and labs from sanity via getStaticProps"
```

---

## Task 9: Rewire metadata helpers to prop-threading (drop the `projects.find` lookups)

**Files:** Modify `src/lib/pageMeta.ts`, `src/lib/jsonLd.ts`, `src/components/Seo.tsx`, `src/components/Breadcrumbs.tsx`, `src/pages/_app.tsx`

- [ ] **Step 1: `src/lib/pageMeta.ts`** — accept the project, drop the array import.
  - Remove `import { projects } from '../data/projects';`
  - Derive the input type from the generated type (so nullability matches exactly — TypeGen types `name` etc. as `string | null` since it ignores `validation`). Add the import `import type { PROJECT_QUERYResult } from '../../sanity.types';` and, right after the imports:

```ts
type ProjectMetaInput = Pick<
  NonNullable<PROJECT_QUERYResult>,
  'name' | 'title' | 'description' | 'headline'
>;
```

- Change the signature: `export function metaForPath(pathname: string, project?: ProjectMetaInput | null): PageMeta {`
- In the project branch the title/name template already uses `||` fallbacks, so the nullable `name`/`title` are fine.
- In the `projectMatch` branch, replace `const project = projects.find((p) => p.slug === slug);` and `if (project) {` with `if (project) {` (use the passed `project`; `slug` is still used only for the canonical, which is already computed). Keep the body identical (`project.description || project.headline || ...`).

- [ ] **Step 2: `src/lib/jsonLd.ts`** — accept the project in `breadcrumbJsonLd`, drop the `projects` import (keep `profile`).
  - Change `import { profile, projects } from '../data/projects';` → `import { profile } from '../data/projects';`
  - Replace `import type { Project } from '../types/content';` → `import type { PROJECT_QUERYResult } from '../../sanity.types';` and add near the top:

```ts
type ProjectJsonLdInput = Pick<
  NonNullable<PROJECT_QUERYResult>,
  'slug' | 'name' | 'title' | 'description' | 'cover' | 'year'
>;
```

- `export function creativeWorkJsonLd(project: ProjectJsonLdInput)` — body unchanged (all referenced fields exist; truthy guards already handle the nullable `cover`/`year`/`description`).
- `export function breadcrumbJsonLd(pathname: string, project?: { name: string | null } | null)` — in the `projectMatch` branch replace `const project = projects.find((p) => p.slug === projectMatch[1]);` with use of the passed `project`: `name: project?.name || projectMatch[1] || 'Project',`.

- [ ] **Step 2b: `src/components/Seo.tsx`** — pass the project through, update its prop type.
  - Replace `import type { Project } from '../types/content';` → `import type { PROJECT_QUERYResult } from '../../sanity.types';`
  - `project?: PROJECT_QUERYResult;` (it's already nullable-friendly).
  - `const meta = metaForPath(path, project);`
  - `? [creativeWorkJsonLd(project), breadcrumbJsonLd(path, project)]` (pass `project` to the breadcrumb too).

- [ ] **Step 3: `src/components/Breadcrumbs.tsx`** — accept `projectName`, drop the array import.
  - Remove `import { projects } from '../data/projects';`
  - `export default function Breadcrumbs({ projectName }: { projectName?: string }) {`
  - Replace the lookup block:

```tsx
  } else if (pathname.startsWith('/works/')) {
    isDeep = true;
    const slug = pathname.split('/').filter(Boolean).pop();
    currentLabel =
      projectName ||
      (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Project');
  } else {
```

- [ ] **Step 4: `src/pages/_app.tsx`** — pass the project name to Breadcrumbs.
  - Change `<Breadcrumbs />` → `<Breadcrumbs projectName={(pageProps as { project?: { name?: string } }).project?.name} />`

- [ ] **Step 5: Typecheck + lint.** Run: `npm run typecheck && npm run lint`
      Expected: PASS. (`src/data/projects.ts` still exports `projects` etc. — unused by these helpers now, still used by the page fallbacks until Task 11.)

- [ ] **Step 6: Build + parity inspect the metadata.** Run:

```bash
npm run build && (npm run start & sleep 4)
curl -s http://localhost:3000/works/surge | grep -o "<title>[^<]*</title>"
curl -s http://localhost:3000/works/surge | grep -o '"@type":"BreadcrumbList".*SURGE®' | head -c 120
kill %1
```

Expected: `<title>SURGE® | By Hris</title>`; the breadcrumb JSON-LD includes `SURGE®`. Confirm the visible breadcrumb on a project page still reads `SURGE®` (not `Surge`).

- [ ] **Step 7: Commit.**

```bash
git add src/lib/pageMeta.ts src/lib/jsonLd.ts src/components/Seo.tsx src/components/Breadcrumbs.tsx src/pages/_app.tsx
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "refactor: thread project through props for metadata, drop array lookups"
```

---

## Task 10: On-demand revalidation route

**Files:** Create `src/pages/api/revalidate.ts`

- [ ] **Step 1: Create `src/pages/api/revalidate.ts`:**

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook';

export const config = { api: { bodyParser: false } };

async function readRawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

type WebhookBody = { _type?: string; slug?: { current?: string } };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const secret = process.env.SANITY_REVALIDATE_SECRET;
  const signature = req.headers[SIGNATURE_HEADER_NAME];
  const raw = await readRawBody(req);

  if (
    !secret ||
    typeof signature !== 'string' ||
    !(await isValidSignature(raw, signature, secret))
  ) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  const body = JSON.parse(raw) as WebhookBody;
  const paths = new Set<string>(['/']);
  if (body._type === 'project') {
    paths.add('/works');
    if (body.slug?.current) paths.add(`/works/${body.slug.current}`);
  } else if (body._type === 'labs') {
    paths.add('/labs');
  }

  try {
    await Promise.all([...paths].map((p) => res.revalidate(p)));
    return res.json({ revalidated: true, paths: [...paths] });
  } catch (err) {
    return res
      .status(500)
      .json({ revalidated: false, message: (err as Error).message });
  }
}
```

- [ ] **Step 2: Typecheck + lint + build.** Run: `npm run typecheck && npm run lint && npm run build`
      Expected: PASS; build lists `/api/revalidate`.

- [ ] **Step 3: Document the webhook (user sets it once after deploy).** Add to `.env.example` near the secret (if not already clear): a comment `# Webhook: Sanity dashboard → API → Webhooks → POST https://www.byhris.cc/api/revalidate, trigger on create/update/delete, secret = SANITY_REVALIDATE_SECRET, API version 2024-10-01, no projection.` Commit message notes the same.

- [ ] **Step 4: Commit.**

```bash
git add src/pages/api/revalidate.ts .env.example
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "feat: add on-demand revalidation webhook for sanity publishes"
```

---

## Task 11: Cutover — retire the `any`, trim `projects.ts`, delete the fallback

**Do only after Task 8/9 parity is confirmed and the Vercel preview build is green.**

**Files:** Modify `src/data/projects.ts`, `src/types/content.ts`; Delete `src/sanity/lib/fallback.ts`; Modify the page/path data functions to drop the fallback.

- [ ] **Step 1: Remove the in-scope exports from `src/data/projects.ts`.** Delete the `export const projects: Project[] = [ ... ];` block (lines ~26–776), the `export const labsAbout = [...]` block, and the `export const labsStats = [...]` block. Keep `profile`, `services`, `marqueeSubSkills`, `bio`, `codex`, `skills`, `tools`, `achievements`, `testimonials`, `homeFaqs`. Remove the now-unused `Project` import from the file's top (keep `Profile`).

- [ ] **Step 2: Retire the `any` in `src/types/content.ts`.** Delete the entire `export interface Project { ... }` block (including the `caseStudy?: Record<string, any>` line and its eslint-disable comment). Keep `export interface Profile`.

- [ ] **Step 3: Delete the fallback module + its uses.**
  - `git rm src/sanity/lib/fallback.ts`
  - In `index.tsx`, `works.tsx`, `labs.tsx`: remove the `FALLBACK_*` imports and replace `sanityOr(QUERY, {}, FALLBACK_X)` with `client.fetch(QUERY)` (import `client`), e.g. `const projects = await client.fetch(PROJECTS_QUERY);`. Remove the now-unused `sanityOr` import; delete the `sanityOr` helper from `client.ts`.
  - In `works/[slug].tsx`: in `getStaticPaths` replace `.catch(() => FALLBACK_PROJECTS.map(...))` with `;` (let it throw on build if Sanity is down) — `const slugs = await client.fetch(PROJECT_SLUGS_QUERY);`; in `getStaticProps` drop the `FALLBACK_PROJECTS` find fallback: `const project = await client.fetch(PROJECT_QUERY, { slug }); if (!project) return { notFound: true };` and `const allProjects = await client.fetch(PROJECTS_QUERY);`.

- [ ] **Step 4: Confirm nothing still imports the removed exports.** Run: `grep -rn "from '.*data/projects'" src` and `grep -rn "caseStudy: Record" src`
      Expected: only `about.tsx` (`bio, codex, skills, tools, achievements`), `contact.tsx` (`homeFaqs`), `index.tsx`/`works.tsx` (`services`/`testimonials`/`homeFaqs`/`marqueeSubSkills`), and `jsonLd.ts` (`profile`) remain; **zero** `caseStudy: Record` matches.

- [ ] **Step 5: Full gate.** Run: `npm run check`
      Expected: PASS (lint + format + typecheck + audit-high + build) — **the `any` is gone and the build is fully Sanity-backed.**

- [ ] **Step 6: Final parity inspection.** Run the build+start loop from Task 8 Step 9 again over all 10 routes; confirm `200`s and visual/text/order parity vs `main`. Confirm `/studio` still loads.

- [ ] **Step 7: Commit.**

```bash
git add -A
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "refactor: cut projects and labs over to sanity, retire caseStudy any"
```

---

## Wrap-up (after Task 11)

- [ ] Push the branch; open a PR. Ensure the four Sanity env vars are set in Vercel (Prod+Preview) so the preview build succeeds.
- [ ] Verify: CI green + Vercel preview `READY` + manual parity on the preview URL (all routes light/dark) + `/studio` loads on the preview.
- [ ] Set the Sanity webhook (Task 10 Step 3) pointing at the production URL; publish a tiny edit in Studio and confirm the live page updates without a redeploy.
- [ ] Merge. Then update `SESSION_HANDOFF.md` + the `byhris-*` memories (new env vars, Studio URL, webhook).

## Self-review notes (coverage vs spec)

- Spec §2 decisions → Tasks 2 (public dataset), 3 (studio embed/config), 5 (useCdn), 8 (fallback), 10 (revalidate). ✓
- Spec §4 schema + field-presence fidelity → Task 4 + Task 6 `clean()` omit-unset. ✓
- Spec §5 client/queries/typegen/studio → Tasks 5, 7. ✓
- Spec §6 every file change → Tasks 8 (pages, ProjectCard) + 9 (Seo, pageMeta, jsonLd, Breadcrumbs, \_app). ✓
- Spec §7 revalidate → Task 10. ✓
- Spec §8 migration + cutover → Tasks 6, 11. ✓
- Spec §9 env/provisioning → Tasks 2, 3. ✓
- Spec §10 verification → build+start parity steps in Tasks 7, 8, 9, 11. ✓
- Spec §12 commit breakdown → Tasks map 1:1 to the 9 commits (Task 8 splits the page-fetch commit; Task 9 is the helper refactor). ✓
