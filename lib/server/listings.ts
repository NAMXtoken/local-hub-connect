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
  imageLocalPath?: string;
  remoteImageUrl?: string;
  mapEmbedUrl?: string;
  mapLatitude?: string;
  mapLongitude?: string;
  description: string;
  contacts: Record<string, string[]>;
}

let cache: ListingRecord[] | null = null;

export async function loadListings(): Promise<ListingRecord[]> {
  if (cache) {
    return cache;
  }

  const filePath = path.join(process.cwd(), 'data', 'listings.json');
  const text = await fs.readFile(filePath, 'utf8');
  cache = JSON.parse(text);
  return cache!;
}

export function invalidateListingsCache() {
  cache = null;
}
