import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import Breadcrumbs from './Breadcrumbs.jsx';
import { titleForPath } from '../lib/pageTitle.js';
import { applyCanonical } from '../lib/seo.js';

// Easing tuned to match the rest of the motion vocabulary (Reveal +
// Parallax use the same curve).
const EASE = [0.22, 1, 0.36, 1];

export default function Layout() {
  const { pathname } = useLocation();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'instant' in window ? 'instant' : 'auto',
    });
    // Per-route document title — keeps the browser tab + history accurate
    // and gives crawlers a distinct title per page.
    document.title = titleForPath(pathname);
    // Keep <link rel="canonical"> self-referential per route (see seo.js).
    applyCanonical(pathname);
  }, [pathname]);

  // Reduced-motion: no transform / fade, no exit hold — AnimatePresence
  // still mounts/unmounts on route change, just instantly. The CSS
  // page-reveal mask sweep also respects prefers-reduced-motion in its
  // own rule.
  const enter = prefersReducedMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE } };
  const exit = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: -10, transition: { duration: 0.2, ease: EASE } };
  const initial = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 };

  return (
    <div className="site">
      <Header />
      <main className="site-main">
        {/* `.page-reveal` no longer wraps a single .container so that
            individual page sections can opt into being container-bound
            (text columns, project grids, etc.) OR full-bleed across
            .site-main (the hero marquee). Each page owns its container
            blocks; Breadcrumbs sits in its own container here so its
            horizontal position is unchanged across routes.

            Wrapped in AnimatePresence (mode="wait" — old route finishes
            exiting before the new one enters) so route changes get a
            soft fade + rise. The key={pathname} doubles as the
            AnimatePresence trigger AND the React remount that
            re-fires the CSS page-reveal mask sweep — the two layer:
            the React fade smooths the inbound content, the CSS sweep
            adds the diagonal reveal underneath.
            `initial={false}` on AnimatePresence skips the enter
            animation on the very first mount so first-load doesn't
            double-animate against the CSS sweep. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            className="page-reveal"
            initial={initial}
            animate={enter}
            exit={exit}
          >
            <div className="container">
              <Breadcrumbs />
            </div>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
