// Single source of truth for the production origin used in canonical and
// share URLs. Change it here if the domain ever moves.
export const SITE_URL = 'https://www.byhris.cc';

// Normalise a route the same way pageTitle does: drop a trailing slash on
// everything except the root.
function normalize(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;
}

// Absolute canonical URL for a route. Consumed by the <Seo> component,
// which renders the per-page <link rel="canonical"> via next/head.
export function canonicalForPath(pathname: string): string {
  const path = normalize(pathname);
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

// Absolute URL for an app-relative asset path (OG image, JSON-LD image).
export function absoluteUrl(assetPath: string): string {
  return assetPath.startsWith('http') ? assetPath : `${SITE_URL}${assetPath}`;
}
