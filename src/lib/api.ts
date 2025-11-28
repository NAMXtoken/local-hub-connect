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
  description: string;
  contacts: Record<string, string[]>;
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
    return applyFilters(all, filters);
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
