export interface Listing {
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

export interface ListingFilters {
  categories?: string[];
  locations?: string[];
  search?: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }
  return response.json() as Promise<T>;
}

function buildQueryString(filters?: ListingFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  filters.categories?.forEach((category) => {
    if (category) {
      params.append('category', category);
    }
  });
  filters.locations?.forEach((location) => {
    if (location) {
      params.append('location', location);
    }
  });
  if (filters.search?.trim()) {
    params.set('search', filters.search.trim());
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

function applyFilters(listings: Listing[], filters?: ListingFilters): Listing[] {
  if (!filters) {
    return listings;
  }
  const categorySet = new Set((filters.categories ?? []).map((cat) => cat.toLowerCase()));
  const locationSet = new Set((filters.locations ?? []).map((loc) => loc.toLowerCase()));
  const search = filters.search?.trim().toLowerCase();

  return listings.filter((listing) => {
    if (categorySet.size) {
      const primary = listing.primaryCategory?.toLowerCase() ?? '';
      const tags = listing.tags.map((tag) => tag.toLowerCase());
      const match = Array.from(categorySet).some((category) => primary === category || tags.includes(category));
      if (!match) {
        return false;
      }
    }

    if (locationSet.size) {
      const location = listing.location?.toLowerCase() ?? '';
      if (!locationSet.has(location)) {
        return false;
      }
    }

    if (search) {
      const haystack = [listing.name, listing.description, listing.location, listing.tags.join(' ')].join(' ').toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }

    return true;
  });
}

export async function fetchListings(filters?: ListingFilters): Promise<Listing[]> {
  const query = buildQueryString(filters);
  try {
    const response = await fetch(`/api/listings${query}`);
    return await handleResponse<Listing[]>(response);
  } catch (error) {
    const fallback = await fetch('/data/listings.json');
    const all = await handleResponse<Listing[]>(fallback);
    const custom = await fetchCustomListingsFallback();
    const combined = [...all, ...(custom ?? [])];
    const claims = await fetchClaimsFallback();
    const merged = claims ? mergeClaims(combined, claims) : combined;
    return applyFilters(merged, filters);
  }
}

export async function fetchListingBySlug(slug: string): Promise<Listing> {
  try {
    const response = await fetch(`/api/listings?slug=${encodeURIComponent(slug)}`);
    return await handleResponse<Listing>(response);
  } catch (error) {
    const collection = await fetchListings();
    const match = collection.find((listing) => listing.slug === slug);
    if (!match) {
      throw new Error('Listing not found');
    }
    return match;
  }
}

async function fetchClaimsFallback(): Promise<Record<string, ListingClaim> | null> {
  try {
    const response = await fetch('/data/listing-claims.json');
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as Record<string, ListingClaim>;
  } catch {
    return null;
  }
}

async function fetchCustomListingsFallback(): Promise<Listing[] | null> {
  try {
    const response = await fetch('/data/custom-listings.json');
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as Listing[];
  } catch {
    return null;
  }
}

function mergeClaims(listings: Listing[], claims: Record<string, ListingClaim>): Listing[] {
  return listings.map((listing) => applyClaim(listing, claims[listing.slug]));
}

function applyClaim(listing: Listing, claim?: ListingClaim): Listing {
  if (!claim) {
    return listing;
  }
  const next: Listing = {
    ...listing,
    contacts: { ...listing.contacts },
  };
  if (claim.name) next.name = claim.name;
  if (claim.primaryCategory) next.primaryCategory = claim.primaryCategory;
  if (claim.location) next.location = claim.location;
  if (claim.address) next.address = claim.address;
  if (claim.description) next.description = claim.description;
  if (claim.website) next.contacts = { ...next.contacts, website: [claim.website] };
  if (claim.phone) next.contacts = { ...next.contacts, phone: [claim.phone] };
  if (claim.email) next.contacts = { ...next.contacts, email: [claim.email] };
  if (claim.instagramPosts?.length) {
    const filtered = claim.instagramPosts.filter((url) => url.trim().length > 0);
    if (filtered.length) {
      next.featuredInstagramPosts = filtered;
    }
  }
  return next;
}

interface ListingClaim {
  name?: string;
  primaryCategory?: string;
  location?: string;
  address?: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  instagramPosts?: string[];
}
