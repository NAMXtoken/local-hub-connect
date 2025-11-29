import type { VercelRequest, VercelResponse } from '@vercel/node';
import { invalidateListingsCache } from '../lib/server/listings.js';
import { readClaims, writeClaims } from '../lib/server/claims.js';
import { parseClaimPayload } from '../lib/server/claim-utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { slug, claim } = parseClaimPayload(req.body);
    const claims = await readClaims();
    claims[slug] = { ...(claims[slug] ?? {}), ...claim };
    await writeClaims(claims);
    invalidateListingsCache();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Claim submission failed', error);
    const message = error instanceof Error ? error.message : 'Invalid claim submission';
    res.status(400).json({ error: message });
  }
}
