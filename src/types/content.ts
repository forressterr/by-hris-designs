// Shapes for the data in src/data/projects.ts. The index signatures keep
// the faithful-port honest (the data carries more fields than the app
// reads) while typing the fields actually consumed across the codebase.

export interface Project {
  slug: string;
  name: string;
  title?: string;
  description?: string;
  headline?: string;
  date?: string;
  year?: string;
  client?: string;
  timeline?: string;
  status?: string;
  tags?: string[];
  cover?: string;

  caseStudy?: Record<string, any>;
  [key: string]: unknown;
}

export interface Profile {
  brand?: string;
  title: string;
  [key: string]: unknown;
}
