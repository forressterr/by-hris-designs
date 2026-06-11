import { createClient } from 'next-sanity';

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-10-01',
  // CDN off so build-time and on-demand-revalidation reads are fresh (the CDN
  // can lag a published edit by minutes). Public dataset → tokenless reads.
  useCdn: false,
});
