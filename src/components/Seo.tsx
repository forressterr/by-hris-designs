import Head from 'next/head';
import { titleForPath } from '../lib/pageTitle';
import { canonicalForPath } from '../lib/seo';

/**
 * Per-page <title> + self-referential canonical, reusing the existing
 * pure helpers (lib/pageTitle + lib/seo) — server-rendered via next/head.
 */
export default function Seo({ path }: { path: string }) {
  return (
    <Head>
      <title>{titleForPath(path)}</title>
      <link rel="canonical" href={canonicalForPath(path)} />
    </Head>
  );
}
