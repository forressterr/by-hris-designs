import Head from 'next/head';
import { NextStudio } from 'next-sanity/studio';
import config from '../../../sanity.config';

// Embedded Sanity Studio. Rendered bare (the site shell is bypassed for
// /studio in _app.tsx) and excluded from indexing.
export default function StudioPage() {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
      </Head>
      <NextStudio config={config} />
    </>
  );
}
