import type { ListingClaim } from './claims';

export function parseClaimPayload(body: unknown): { slug: string; claim: ListingClaim } {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload');
  }
  const {
    slug,
    name,
    primaryCategory,
    location,
    address,
    description,
    website,
    phone,
    email,
    instagramPosts,
  } = body as Record<string, unknown>;
  if (!slug || typeof slug !== 'string') {
    throw new Error('Missing or invalid slug');
  }
  const claim: ListingClaim = {
    name: typeof name === 'string' ? name.trim() : undefined,
    primaryCategory: typeof primaryCategory === 'string' ? primaryCategory.trim() : undefined,
    location: typeof location === 'string' ? location.trim() : undefined,
    address: typeof address === 'string' ? address.trim() : undefined,
    description: typeof description === 'string' ? description.trim() : undefined,
    website: typeof website === 'string' ? website.trim() : undefined,
    phone: typeof phone === 'string' ? phone.trim() : undefined,
    email: typeof email === 'string' ? email.trim() : undefined,
    instagramPosts: Array.isArray(instagramPosts)
      ? instagramPosts.map((entry) => (typeof entry === 'string' ? entry.trim() : '')).filter(Boolean)
      : undefined,
  };
  return { slug, claim };
}
