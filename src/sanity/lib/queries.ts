import { defineQuery } from 'next-sanity';

// Field list is inlined (not a shared interpolated const) so Sanity TypeGen can
// statically resolve each query string. `"slug": slug.current` projects the
// Sanity slug object down to the plain string the pages consume.

export const PROJECTS_QUERY = defineQuery(`
  *[_type == "project"] | order(order asc) {
    "slug": slug.current, name, order, cover, tags, date, title, headline,
    description, year, client, timeline, status, caseStudy
  }
`);

export const PROJECT_SLUGS_QUERY = defineQuery(`
  *[_type == "project" && defined(slug.current)] { "slug": slug.current }
`);

export const PROJECT_QUERY = defineQuery(`
  *[_type == "project" && slug.current == $slug][0] {
    "slug": slug.current, name, order, cover, tags, date, title, headline,
    description, year, client, timeline, status, caseStudy
  }
`);

export const LABS_QUERY = defineQuery(`
  *[_type == "labs"][0] { about, stats }
`);
