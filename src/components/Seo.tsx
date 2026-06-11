import Head from 'next/head';
import type { Project } from '../types/content';
import {
  metaForPath,
  OG_IMAGE_PATH,
  OG_IMAGE_ALT,
  TITLE_BRAND,
} from '../lib/pageMeta';
import { absoluteUrl } from '../lib/seo';
import {
  personJsonLd,
  webSiteJsonLd,
  creativeWorkJsonLd,
  breadcrumbJsonLd,
} from '../lib/jsonLd';

/**
 * Per-page <head>: title, canonical, description, Open Graph, Twitter, and a
 * single schema.org @graph JSON-LD script. All data comes from lib/pageMeta +
 * lib/jsonLd (pure); this component only renders. The home page emits
 * Person + WebSite; project pages emit CreativeWork + BreadcrumbList; other
 * inner pages emit BreadcrumbList.
 */
export default function Seo({
  path,
  project,
}: {
  path: string;
  project?: Project;
}) {
  const meta = metaForPath(path);
  const ogImage = absoluteUrl(OG_IMAGE_PATH);

  const nodes =
    path === '/'
      ? [personJsonLd(), webSiteJsonLd()]
      : project
        ? [creativeWorkJsonLd(project), breadcrumbJsonLd(path)]
        : [breadcrumbJsonLd(path)];

  // Escape `<` so a stray `</script>` in any data string can't break out.
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': nodes,
  }).replace(/</g, '\\u003c');

  return (
    <Head>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={meta.canonical} />

      <meta property="og:type" content={meta.ogType} />
      <meta property="og:site_name" content={TITLE_BRAND} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={meta.canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={OG_IMAGE_ALT} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={ogImage} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
    </Head>
  );
}
