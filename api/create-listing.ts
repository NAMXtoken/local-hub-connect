import type { VercelRequest, VercelResponse } from '@vercel/node';
import { addCustomListing, invalidateListingsCache } from '../lib/server/listings.js';

interface CreatePayload {
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

const PLACEHOLDER_IMAGE = 'https://placehold.co/600x400?text=Samui+Connect';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const payload = req.body as CreatePayload;
    if (!payload?.name) {
      throw new Error('Name is required');
    }
    const slug = slugify(payload.name);
    const id = `custom-${Date.now()}`;
    const listing = {
      id,
      slug,
      name: payload.name,
      url: payload.website || '',
      location: payload.location || '',
      address: payload.address || '',
      primaryCategory: payload.primaryCategory || 'Local Business',
      tags: payload.primaryCategory ? [payload.primaryCategory] : ['Local Business'],
      imageUrl: PLACEHOLDER_IMAGE,
      remoteImageUrl: PLACEHOLDER_IMAGE,
      description: payload.description || 'Description coming soon.',
      contacts: {
        website: payload.website ? [payload.website] : [],
        phone: payload.phone ? [payload.phone] : [],
        email: payload.email ? [payload.email] : [],
      },
      featuredInstagramPosts: payload.instagramPosts?.filter(Boolean) ?? [],
    };
    await addCustomListing(listing);
    invalidateListingsCache();
    res.status(201).json({ success: true, slug });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create listing';
    res.status(400).json({ error: message });
  }
}

function slugify(input: string): string {
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return cleaned || `listing-${Date.now()}`;
}
