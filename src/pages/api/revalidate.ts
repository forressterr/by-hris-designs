import type { NextApiRequest, NextApiResponse } from 'next';
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook';

// Raw body needed for signature verification.
export const config = { api: { bodyParser: false } };

async function readRawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

type WebhookBody = { _type?: string; slug?: { current?: string } };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const secret = process.env.SANITY_REVALIDATE_SECRET;
  const signature = req.headers[SIGNATURE_HEADER_NAME];
  const raw = await readRawBody(req);

  if (
    !secret ||
    typeof signature !== 'string' ||
    !(await isValidSignature(raw, signature, secret))
  ) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  // Home features projects + the Labs teaser, so it revalidates on any change.
  const body = JSON.parse(raw) as WebhookBody;
  const paths = new Set<string>(['/']);
  if (body._type === 'project') {
    paths.add('/works');
    if (body.slug?.current) paths.add(`/works/${body.slug.current}`);
  } else if (body._type === 'labs') {
    paths.add('/labs');
  }

  try {
    await Promise.all([...paths].map((p) => res.revalidate(p)));
    return res.json({ revalidated: true, paths: [...paths] });
  } catch (err) {
    return res
      .status(500)
      .json({ revalidated: false, message: (err as Error).message });
  }
}
