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
