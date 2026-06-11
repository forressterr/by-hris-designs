import { Html, Head, Main, NextScript } from 'next/document';

// Lifted verbatim from index.html. Runs synchronously in <head> before
// first paint so data-theme is set with no flash. The React ThemeProvider
// takes over afterwards and keeps everything in sync.
const THEME_SCRIPT = `(function () {
  try {
    var mode = localStorage.getItem('theme-mode') || 'system';
    if (mode !== 'light' && mode !== 'dark' && mode !== 'system') { mode = 'system'; }
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var effective = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;
    var root = document.documentElement;
    root.setAttribute('data-theme', effective);
    root.setAttribute('data-theme-mode', mode);
  } catch (_e) {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.setAttribute('data-theme-mode', 'system');
  }
})();`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Global, page-independent head only. Per-page title, description,
            canonical, Open Graph, Twitter, and JSON-LD live in <Seo>. */}
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="theme-color" content="#ffffff" />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#0e0e0e"
        />
        <meta name="robots" content="index, follow" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700;800&display=swap"
        />

        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
