import { Link, useLocation, useNavigate } from 'react-router-dom';
import { projects } from '../data/projects.js';

/**
 * Breadcrumbs — minimalist nav line that sits above the page-head on
 * every non-home page. Three forms:
 *
 *   /             →  not rendered (home)
 *   /about        →  [home] › About
 *   /works        →  [home] › Work
 *   /labs         →  [home] › Labs
 *   /contact      →  [home] › Contact
 *   /projects/x   →  [home] › … › Project name
 *
 * On deep routes the "…" segment is a button that calls
 * `navigate(-1)` — sends the user one step back in browser history.
 * Useful when the project page was reached from /works (it bounces
 * back to /works) or from anywhere else (bounces to wherever they
 * came from).
 */

const ROUTE_LABELS = {
  '/about': 'About',
  '/works': 'Work',
  '/labs': 'Labs',
  '/contact': 'Contact',
};

// Simple house silhouette — closed pentagon (roof + walls + floor)
// with an inverted-U door for a tiny extra read.
const HomeIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M2 8 L 8 2.5 L 14 8 V 13.5 H 2 Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M6.5 13.5 V 10.5 H 9.5 V 13.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronIcon = () => (
  <svg
    width="9"
    height="9"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M6 4 L 10 8 L 6 12"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Home page: no breadcrumbs.
  if (pathname === '/') return null;

  let currentLabel = '';
  let isDeep = false;

  if (ROUTE_LABELS[pathname]) {
    currentLabel = ROUTE_LABELS[pathname];
  } else if (pathname.startsWith('/projects/')) {
    isDeep = true;
    const slug = pathname.split('/').filter(Boolean).pop();
    const project = projects.find((p) => p.slug === slug);
    // Prefer the project's display name (e.g. "SURGE®") from data,
    // fall back to a Title-Cased slug if the lookup misses.
    currentLabel =
      project?.name ||
      (slug
        ? slug.charAt(0).toUpperCase() + slug.slice(1)
        : 'Project');
  } else {
    // Unknown route (e.g. 404). Skip breadcrumbs entirely.
    return null;
  }

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumbs__list">
        <li className="breadcrumbs__item">
          <Link
            to="/"
            className="breadcrumbs__link breadcrumbs__home"
            aria-label="Home"
          >
            <HomeIcon />
          </Link>
        </li>
        <li className="breadcrumbs__sep" aria-hidden="true">
          <ChevronIcon />
        </li>
        {isDeep && (
          <>
            <li className="breadcrumbs__item">
              {/* "…" sends the user one step back in history. */}
              <button
                type="button"
                className="breadcrumbs__link breadcrumbs__back"
                onClick={() => navigate(-1)}
                aria-label="Go back one step"
              >
                …
              </button>
            </li>
            <li className="breadcrumbs__sep" aria-hidden="true">
              <ChevronIcon />
            </li>
          </>
        )}
        <li className="breadcrumbs__item breadcrumbs__item--current">
          <span aria-current="page">{currentLabel}</span>
        </li>
      </ol>
    </nav>
  );
}
