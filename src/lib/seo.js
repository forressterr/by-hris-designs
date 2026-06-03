// Single source of truth for the production origin used in canonical and
// share URLs. Change it here if the domain ever moves.
export const SITE_URL = 'https://www.byhris.cc';

// Normalise a route the same way pageTitle does: drop a trailing slash on
// everything except the root.
function normalize(pathname) {
  return pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;
}

// Absolute canonical URL for a route.
export function canonicalForPath(pathname) {
  const path = normalize(pathname);
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

// Keep <link rel="canonical"> in sync with the current route. A single static
// canonical in index.html would point every SPA route at the homepage and risk
// de-indexing sub-pages, so we update it client-side per navigation instead.
export function applyCanonical(pathname) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', canonicalForPath(pathname));
}
