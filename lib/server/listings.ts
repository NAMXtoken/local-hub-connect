import { promises as fs } from 'node:fs';
import path from 'node:path';
import { readClaims, type ListingClaim } from './claims';
import { readCustomListings, writeCustomListings } from './custom-listings';

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
  featuredInstagramPosts?: string[];
}

let cache: ListingRecord[] | null = null;

export async function loadListings(): Promise<ListingRecord[]> {
  if (cache) {
    return cache;
  }

  const filePath = path.join(process.cwd(), 'data', 'listings.json');
  const text = await fs.readFile(filePath, 'utf8');
  const listings = JSON.parse(text) as ListingRecord[];
  const customListings = await readCustomListings();
  const claims = await readClaims();
  const combined = [...listings, ...customListings];
  cache = combined.map((listing) => applyClaimOverride(listing, claims[listing.slug]));
  return cache!;
}

function applyClaimOverride(listing: ListingRecord, claim?: ListingClaim): ListingRecord {
  if (!claim) {
    return listing;
  }
  const next: ListingRecord = {
    ...listing,
    contacts: { ...listing.contacts },
  };

  if (claim.name) next.name = claim.name;
  if (claim.primaryCategory) next.primaryCategory = claim.primaryCategory;
  if (claim.location) next.location = claim.location;
  if (claim.address) next.address = claim.address;
  if (claim.description) next.description = claim.description;
  if (claim.website) {
    next.contacts = { ...next.contacts, website: [claim.website] };
  }
  if (claim.phone) {
    next.contacts = { ...next.contacts, phone: [claim.phone] };
  }
  if (claim.email) {
    next.contacts = { ...next.contacts, email: [claim.email] };
  }
  if (claim.instagramPosts?.length) {
    const filtered = claim.instagramPosts.filter((url) => url.trim().length > 0);
    if (filtered.length) {
      next.featuredInstagramPosts = filtered;
    }
  }

  return next;
}

export function invalidateListingsCache() {
  cache = null;
}

export async function addCustomListing(listing: ListingRecord): Promise<void> {
  const current = await readCustomListings();
  current.push(listing);
  await writeCustomListings(current);
  invalidateListingsCache();
}
