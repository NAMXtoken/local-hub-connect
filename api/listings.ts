import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadListings, type ListingRecord } from '../lib/server/listings.js';

function normalizeParam(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return (Array.isArray(value) ? value[0] : value).trim();
}

function normalizeArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const array = Array.isArray(value) ? value : [value];
  return array
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function matchesCategory(listing: ListingRecord, categories: string[]): boolean {
  if (categories.length === 0) {
    return true;
  }
  const primary = listing.primaryCategory?.toLowerCase() ?? '';
  const tagSet = new Set(listing.tags.map((tag) => tag.toLowerCase()));
  return categories.some((category) => {
    const normalized = category.toLowerCase();
    return primary === normalized || tagSet.has(normalized);
  });
}

function matchesLocation(listing: ListingRecord, locations: string[]): boolean {
  if (locations.length === 0) {
    return true;
  }
  const current = (listing.location || '').toLowerCase();
  return locations.some((loc) => current === loc.toLowerCase());
}

function matchesSearch(listing: ListingRecord, search: string | undefined): boolean {
  const query = search?.trim().toLowerCase();
  if (!query) {
    return true;
  }
  const haystack = [
    listing.name,
    listing.description,
    listing.location,
    listing.tags.join(' '),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

export const config = {
  runtime: 'nodejs',
  includeFiles: ['data/**'],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const listings = await loadListings();
    const idParam = normalizeParam(req.query.id as string | string[] | undefined);
    const slugParam = normalizeParam(req.query.slug as string | string[] | undefined);
    const categoryParams = normalizeArray(req.query.category as string | string[] | undefined);
    const locationParams = normalizeArray(req.query.location as string | string[] | undefined);
    const searchParam = normalizeParam(req.query.search as string | string[] | undefined);

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

    const filtered = listings.filter((listing) =>
      matchesCategory(listing, categoryParams) &&
      matchesLocation(listing, locationParams) &&
      matchesSearch(listing, searchParam)
    );

    res.status(200).json(filtered);
  } catch (error) {
    console.error('Failed to load listings', error);
    res.status(500).json({ error: 'Failed to load listings' });
  }
}
