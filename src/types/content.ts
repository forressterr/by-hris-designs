// Shape for `profile` in src/data/projects.ts (the remaining hand-authored
// content). Projects + Labs now come from Sanity with generated types
// (sanity.types.ts), so the old `Project` shape and its `caseStudy: any`
// are retired (Phase 4).

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
