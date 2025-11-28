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
  description: string;
  contacts: Record<string, string[]>;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }
  return response.json() as Promise<T>;
}

export async function fetchListings(): Promise<Listing[]> {
  try {
    const response = await fetch('/api/listings');
    return await handleResponse<Listing[]>(response);
  } catch (error) {
    const fallback = await fetch('/data/listings.json');
    return handleResponse<Listing[]>(fallback);
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
