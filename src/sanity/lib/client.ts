import { createClient } from 'next-sanity';

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-10-01',
  // CDN off so build-time and on-demand-revalidation reads are fresh (the CDN
  // can lag a published edit by minutes). Public dataset → tokenless reads.
  useCdn: false,
});

// Fetch a (param-less) query, returning a typed fallback if Sanity errors or
// returns null — keeps the build resilient during the migration window.
export async function sanityOr<T>(query: string, fallback: T): Promise<T> {
  try {
    return (await client.fetch<T>(query)) ?? fallback;
  } catch {
    return fallback;
  }
}
