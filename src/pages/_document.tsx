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
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="theme-color" content="#ffffff" />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#0e0e0e"
        />
        <meta
          name="description"
          content="By_Hris Designs — Multi-Disciplinary Designer based in Eindhoven. Brand, web, and product design work."
        />
        <meta name="robots" content="index, follow" />

        {/* Social share cards (Open Graph + Twitter) — static, site-wide. */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="By_Hris Designs" />
        <meta property="og:url" content="https://www.byhris.cc/" />
        <meta
          property="og:title"
          content="By_Hris Designs — Multi-Disciplinary Designer"
        />
        <meta
          property="og:description"
          content="Brand, web, and product design work by Hristian Goretsov — a multi-disciplinary designer based in Eindhoven, NL."
        />
        <meta
          property="og:image"
          content="https://www.byhris.cc/og-image.jpg"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="By_Hris Designs — portfolio of Hristian Goretsov, multi-disciplinary designer"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="By_Hris Designs — Multi-Disciplinary Designer"
        />
        <meta
          name="twitter:description"
          content="Brand, web, and product design work by Hristian Goretsov — a multi-disciplinary designer based in Eindhoven, NL."
        />
        <meta
          name="twitter:image"
          content="https://www.byhris.cc/og-image.jpg"
        />

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
