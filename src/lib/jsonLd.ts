import { profile } from '../data/projects';
import type { PROJECT_QUERY_RESULT } from '../../sanity.types';
import { SITE_URL, canonicalForPath, absoluteUrl } from './seo';
import { OG_IMAGE_PATH, TITLE_BRAND } from './pageMeta';

type ProjectJsonLdInput = Pick<
  NonNullable<PROJECT_QUERY_RESULT>,
  'slug' | 'name' | 'title' | 'description' | 'cover' | 'year'
>;

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const SECTION_LABELS: Record<string, string> = {
  '/works': 'Work',
  '/about': 'About',
  '/labs': 'Labs',
  '/contact': 'Contact',
};

function normalize(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;
}

export function personJsonLd(): Record<string, unknown> {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: profile.name,
    alternateName: TITLE_BRAND,
    jobTitle: profile.title,
    ...(profile.email ? { email: `mailto:${profile.email}` } : {}),
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Eindhoven',
      addressCountry: 'NL',
    },
    url: `${SITE_URL}/`,
    image: absoluteUrl(OG_IMAGE_PATH),
    ...(profile.linkedin ? { sameAs: [profile.linkedin] } : {}),
  };
}

export function webSiteJsonLd(): Record<string, unknown> {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: TITLE_BRAND,
    url: `${SITE_URL}/`,
    publisher: { '@id': PERSON_ID },
  };
}

export function creativeWorkJsonLd(
  project: ProjectJsonLdInput,
): Record<string, unknown> {
  return {
    '@type': 'CreativeWork',
    name: project.title || project.name,
    headline: project.name,
    ...(project.description ? { description: project.description } : {}),
    ...(project.cover ? { image: absoluteUrl(project.cover) } : {}),
    ...(project.year ? { dateCreated: project.year } : {}),
    creator: { '@id': PERSON_ID },
    url: canonicalForPath(`/works/${project.slug}`),
  };
}

export function breadcrumbJsonLd(
  pathname: string,
  project?: { name: string | null } | null,
): Record<string, unknown> {
  const path = normalize(pathname);
  const items: { name: string; url: string }[] = [
    { name: 'Home', url: `${SITE_URL}/` },
  ];

  const sectionLabel = SECTION_LABELS[path];
  if (sectionLabel) {
    items.push({ name: sectionLabel, url: canonicalForPath(path) });
  } else {
    const projectMatch = path.match(/^\/works\/([^/]+)$/);
    if (projectMatch) {
      items.push({ name: 'Work', url: canonicalForPath('/works') });
      items.push({
        name: project?.name || projectMatch[1] || 'Project',
        url: canonicalForPath(path),
      });
    }
  }

  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
