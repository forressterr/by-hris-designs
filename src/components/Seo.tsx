import Head from 'next/head';
import { titleForPath } from '../lib/pageTitle';
import { canonicalForPath } from '../lib/seo';

/**
 * Per-page <title> + self-referential canonical, reusing the existing
 * pure helpers verbatim. Reproduces the old Layout.jsx per-route effect
 * (document.title + applyCanonical), but server-rendered.
 */
export default function Seo({ path }: { path: string }) {
  return (
    <Head>
      <title>{titleForPath(path)}</title>
      <link rel="canonical" href={canonicalForPath(path)} />
    </Head>
  );
}
