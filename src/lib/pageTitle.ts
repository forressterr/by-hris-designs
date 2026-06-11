import { profile, projects } from '../data/projects';

/**
 * Resolve the document <title> for a given route.
 *
 * Keeps per-page titles in one place so the app sets a distinct browser tab /
 * history entry per route (better SEO + clearer back-button stack). The <Seo>
 * component calls this from each page via next/head.
 */
const BRAND = profile.brand || 'By_Hris Designs';

const STATIC_TITLES: Record<string, string> = {
  '/': `${BRAND} — ${profile.title}`,
  '/about': `About — ${BRAND}`,
  '/works': `Work — ${BRAND}`,
  '/labs': `Labs — ${BRAND}`,
  '/contact': `Contact — ${BRAND}`,
};

export function titleForPath(pathname: string): string {
  // Normalise a trailing slash (except the root path).
  const path =
    pathname.length > 1 && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : pathname;

  if (STATIC_TITLES[path]) return STATIC_TITLES[path];

  const projectMatch = path.match(/^\/works\/([^/]+)$/);
  if (projectMatch) {
    const project = projects.find((p) => p.slug === projectMatch[1]);
    return project ? `${project.name} — ${BRAND}` : `Work — ${BRAND}`;
  }

  return `Page not found — ${BRAND}`;
}
