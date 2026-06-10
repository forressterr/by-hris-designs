import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import ErrorBoundary from '../components/ErrorBoundary';
import { ThemeProvider } from '../context/ThemeContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import { EASE } from '../lib/motion';
import '../styles/index.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [router.asPath]);

  // Reduced-motion: no transform / fade, no exit hold — AnimatePresence
  // still mounts/unmounts on route change, just instantly.
  const enter = prefersReducedMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE } };
  const exit = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: -10, transition: { duration: 0.2, ease: EASE } };
  const initial = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 };

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <div className="site">
          <Header />
          <main className="site-main">
            {/* Wrapped in AnimatePresence (mode="wait") so route changes
                get a soft fade + rise. key={router.asPath} doubles as the
                AnimatePresence trigger AND the React remount that re-fires
                the CSS page-reveal mask sweep. initial={false} skips the
                enter animation on first mount. */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={router.asPath}
                className="page-reveal"
                initial={initial}
                animate={enter}
                exit={exit}
              >
                <div className="container">
                  <Breadcrumbs />
                </div>
                <Component {...pageProps} />
              </motion.div>
            </AnimatePresence>
          </main>
          <Footer />
        </div>
        <Analytics />
        <SpeedInsights />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
