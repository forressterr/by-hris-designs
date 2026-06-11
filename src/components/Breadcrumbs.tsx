import Link from 'next/link';
import { useRouter } from 'next/router';
import { projects } from '../data/projects';

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
 * `router.back()` — sends the user one step back in browser history.
 * Useful when the project page was reached from /works (it bounces
 * back to /works) or from anywhere else (bounces to wherever they
 * came from).
 */

const ROUTE_LABELS: Record<string, string> = {
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
  <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
  const router = useRouter();
  const pathname = router.asPath.split(/[?#]/)[0] ?? router.asPath;

  // Home page: no breadcrumbs.
  if (pathname === '/') return null;

  let currentLabel = '';
  let isDeep = false;

  const knownLabel = ROUTE_LABELS[pathname];
  if (knownLabel) {
    currentLabel = knownLabel;
  } else if (pathname.startsWith('/projects/')) {
    isDeep = true;
    const slug = pathname.split('/').filter(Boolean).pop();
    const project = projects.find((p) => p.slug === slug);
    // Prefer the project's display name (e.g. "SURGE®") from data,
    // fall back to a Title-Cased slug if the lookup misses.
    currentLabel =
      project?.name ||
      (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Project');
  } else {
    // Unknown route (e.g. 404). Skip breadcrumbs entirely.
    return null;
  }

  return (
    // Phase 3 proof component: migrated from the .breadcrumbs* block in
    // index.css to Tailwind utilities to validate the no-Preflight token
    // bridge (colours flip in dark via the bridged --ink/--ink-soft tokens,
    // no dark: variant needed). Siblings stay on index.css until next touched.
    <nav className="breadcrumbs pt-6 pb-3" aria-label="Breadcrumb">
      <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0 font-mono text-[0.75rem] tracking-[0.02em] text-ink-soft">
        <li className="flex items-center">
          <Link
            href="/"
            className="-mx-1 -my-0.5 inline-flex cursor-pointer items-center rounded-[4px] border-0 bg-transparent px-1 py-0.5 text-ink no-underline [transition:opacity_180ms_ease] hover:opacity-[0.6] focus-visible:[outline:1px_solid_var(--ink)] focus-visible:outline-offset-[2px]"
            aria-label="Home"
          >
            <HomeIcon />
          </Link>
        </li>
        <li
          className="flex items-center text-ink-soft opacity-[0.45]"
          aria-hidden="true"
        >
          <ChevronIcon />
        </li>
        {isDeep && (
          <>
            <li className="flex items-center">
              {/* "…" sends the user one step back in history. */}
              <button
                type="button"
                className="-mx-1 -my-0.5 inline-flex cursor-pointer items-center rounded-[4px] border-0 bg-transparent px-1 py-0.5 font-mono leading-none tracking-[0.15em] text-ink-soft no-underline [transition:opacity_180ms_ease] hover:opacity-[0.6] focus-visible:[outline:1px_solid_var(--ink)] focus-visible:outline-offset-[2px]"
                onClick={() => router.back()}
                aria-label="Go back one step"
              >
                …
              </button>
            </li>
            <li
              className="flex items-center text-ink-soft opacity-[0.45]"
              aria-hidden="true"
            >
              <ChevronIcon />
            </li>
          </>
        )}
        <li className="flex items-center py-0.5 text-ink">
          <span aria-current="page">{currentLabel}</span>
        </li>
      </ol>
    </nav>
  );
}
