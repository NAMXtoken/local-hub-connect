import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ListingRecord } from './listings';

const CUSTOM_LISTINGS_PATH = path.join(process.cwd(), 'data', 'custom-listings.json');

export async function readCustomListings(): Promise<ListingRecord[]> {
  try {
    const raw = await fs.readFile(CUSTOM_LISTINGS_PATH, 'utf8');
    return JSON.parse(raw) as ListingRecord[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function writeCustomListings(listings: ListingRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(CUSTOM_LISTINGS_PATH), { recursive: true });
  await fs.writeFile(CUSTOM_LISTINGS_PATH, JSON.stringify(listings, null, 2), 'utf8');
}
