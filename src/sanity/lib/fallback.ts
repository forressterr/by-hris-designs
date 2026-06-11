import { projects, labsAbout, labsStats } from '../../data/projects';
import type {
  PROJECTS_QUERY_RESULT,
  LABS_QUERY_RESULT,
} from '../../../sanity.types';

type ProjectResult = PROJECTS_QUERY_RESULT[number];

// Faithful, identical-data fallback so the build/dev still renders if Sanity is
// unreachable. `caseStudy`/`status` are loosely typed in the hand data; the
// casts are sound because this IS the data the schema was modeled from.
// Removed at cutover (Task 11) once every route is verified rendering from Sanity.
export const FALLBACK_PROJECTS: PROJECTS_QUERY_RESULT = projects.map(
  (p, i) => ({
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
    status: (p.status ?? null) as ProjectResult['status'],
    caseStudy: (p.caseStudy ?? null) as ProjectResult['caseStudy'],
  }),
);

export const FALLBACK_LABS = {
  about: labsAbout,
  stats: labsStats,
} as unknown as LABS_QUERY_RESULT;
