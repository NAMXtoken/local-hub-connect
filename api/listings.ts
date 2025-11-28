import type { VercelRequest, VercelResponse } from '@vercel/node';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface ListingRecord {
  id: string;
  slug: string;
  name: string;
  url: string;
  location: string;
  address: string;
  primaryCategory: string;
  tags: string[];
  imageUrl: string;
  description: string;
  contacts: Record<string, string[]>;
}

let cache: ListingRecord[] | null = null;

async function loadListings(): Promise<ListingRecord[]> {
  if (cache) {
    return cache;
  }

  const filePath = path.join(process.cwd(), 'data', 'listings.json');
  const text = await fs.readFile(filePath, 'utf8');
  cache = JSON.parse(text);
  return cache!;
}

function normalizeParam(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const listings = await loadListings();
    const idParam = normalizeParam(req.query.id as string | string[] | undefined);
    const slugParam = normalizeParam(req.query.slug as string | string[] | undefined);

    if (idParam || slugParam) {
      const match = listings.find((listing) => {
        if (idParam && listing.id === idParam) return true;
        if (slugParam && listing.slug === slugParam) return true;
        return false;
      });

      if (!match) {
        res.status(404).json({ error: 'Listing not found' });
        return;
      }

      res.status(200).json(match);
      return;
    }

    res.status(200).json(listings);
  } catch (error) {
    console.error('Failed to load listings', error);
    res.status(500).json({ error: 'Failed to load listings' });
  }
}
