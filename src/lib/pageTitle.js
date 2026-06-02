import { profile, projects } from '../data/projects.js';

/**
 * Resolve the document <title> for a given route.
 *
 * Keeps per-page titles in one place so the SPA updates the browser tab /
 * history entry on navigation (better SEO + clearer back-button stack)
 * without pulling in a head-management library. Layout calls this on every
 * route change.
 */
const BRAND = profile.brand || 'By_Hris Designs';

const STATIC_TITLES = {
  '/': `${BRAND} — ${profile.title}`,
  '/about': `About — ${BRAND}`,
  '/works': `Work — ${BRAND}`,
  '/labs': `Labs — ${BRAND}`,
  '/contact': `Contact — ${BRAND}`,
};

export function titleForPath(pathname) {
  // Normalise a trailing slash (except the root path).
  const path =
    pathname.length > 1 && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : pathname;

  if (STATIC_TITLES[path]) return STATIC_TITLES[path];

  const projectMatch = path.match(/^\/projects\/([^/]+)$/);
  if (projectMatch) {
    const project = projects.find((p) => p.slug === projectMatch[1]);
    return project ? `${project.name} — ${BRAND}` : `Work — ${BRAND}`;
  }

  return `Page not found — ${BRAND}`;
}
