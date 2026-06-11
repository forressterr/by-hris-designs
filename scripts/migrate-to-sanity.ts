/**
 * One-time import: src/data/projects.ts → Sanity (Projects + Labs).
 * Run with the .env.local vars loaded, e.g. via `npx sanity exec`.
 * Deterministic `_id`s + `_key`/`_type` on array members → idempotent
 * `createOrReplace` (safe to re-run). Unset optional fields are omitted so
 * absent stays absent (preserves the page fallbacks — see spec §4).
 */
import { createClient } from 'next-sanity';
import { projects, labsAbout, labsStats } from '../src/data/projects';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-10-01',
  token: process.env.SANITY_AUTH_TOKEN,
  useCdn: false,
});

// Drop undefined keys so absent optional fields stay ABSENT (not null/empty).
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
  // Clear any prior project docs first — handles re-runs and removes the
  // earlier dot-id docs. Dot-less `_id`s are required: the public read grant
  // is `_id in path("*")`, which only matches single-segment (dot-less) IDs.
  await client.delete({ query: '*[_type == "project"]' });

  const tx = client.transaction();

  projects.forEach((p, i) => {
    tx.createOrReplace(
      clean({
        _id: `project-${p.slug}`,
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
