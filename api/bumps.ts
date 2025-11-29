import type { VercelRequest, VercelResponse } from '@vercel/node';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { loadListings, type ListingRecord } from '../lib/server/listings.js';

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return Boolean(error) && typeof error === 'object' && 'code' in (error as Record<string, unknown>);
}

interface BumpRecord {
  listingId: string;
  slug: string;
  userId: string;
  timestamp: number;
}

interface LeaderboardItem {
  listingId: string;
  slug: string;
  count: number;
}

function parseBody(body: unknown) {
  if (!body) return null;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }
  if (typeof body === 'object') {
    return body as Record<string, unknown>;
  }
  return null;
}

export const config = {
  runtime: 'nodejs',
  includeFiles: ['data/**'],
};

const DATA_PATH = process.env.BUMP_DATA_PATH
  ? path.resolve(process.env.BUMP_DATA_PATH)
  : process.env.VERCEL
    ? path.join('/tmp', 'bumps.json')
    : path.join(process.cwd(), 'data', 'bumps.json');
const DAILY_LIMIT_MS = 24 * 60 * 60 * 1000;
const BUMP_WINDOWS = [
  { label: '24 hours', ms: 24 * 60 * 60 * 1000 },
  { label: '48 hours', ms: 48 * 60 * 60 * 1000 },
  { label: '72 hours', ms: 72 * 60 * 60 * 1000 },
  { label: '7 days', ms: 7 * 24 * 60 * 60 * 1000 },
  { label: '14 days', ms: 14 * 24 * 60 * 60 * 1000 },
  { label: '30 days', ms: 30 * 24 * 60 * 60 * 1000 },
];

async function readBumps(): Promise<BumpRecord[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    return JSON.parse(raw) as BumpRecord[];
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
      await fs.writeFile(DATA_PATH, '[]', 'utf8');
      return [];
    }
    throw error;
  }
}

async function writeBumps(records: BumpRecord[]): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(records, null, 2), 'utf8');
}

function aggregateCounts(records: BumpRecord[], cutoff: number): LeaderboardItem[] {
  const map = new Map<string, LeaderboardItem>();
  records.forEach((record) => {
    if (record.timestamp < cutoff) {
      return;
    }
    const existing = map.get(record.slug) ?? {
      listingId: record.listingId,
      slug: record.slug,
      count: 0,
    };
    existing.count += 1;
    map.set(record.slug, existing);
  });
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

function getUserCooldown(records: BumpRecord[], slug: string, userId?: string) {
  if (!userId) {
    return { canBump: false, nextAvailableAt: null };
  }
  const recent = records
    .filter((record) => record.slug === slug && record.userId === userId)
    .sort((a, b) => b.timestamp - a.timestamp)[0];
  if (!recent) {
    return { canBump: true, nextAvailableAt: null };
  }
  const nextAvailableAt = recent.timestamp + DAILY_LIMIT_MS;
  return {
    canBump: Date.now() >= nextAvailableAt,
    nextAvailableAt,
  };
}

function summarizeListing(records: BumpRecord[], slug: string) {
  const filtered = records.filter((record) => record.slug === slug);
  const now = Date.now();
  const counts: Record<string, number> = {};
  BUMP_WINDOWS.forEach((window) => {
    const cutoff = now - window.ms;
    counts[window.label] = filtered.filter((record) => record.timestamp >= cutoff).length;
  });
  return {
    slug,
    listingId: filtered[0]?.listingId ?? null,
    total: filtered.length,
    counts,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'POST') {
      await handlePost(req, res);
      return;
    }

    if (req.method === 'GET') {
      await handleGet(req, res);
      return;
    }

    res.setHeader('Allow', 'GET,POST');
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Bumps API failed', error);
    res.status(500).json({ error: 'Failed to process bump request' });
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  const payload = parseBody(req.body);
  const { slug, listingId, userId } = payload ?? {};
  if (!slug || !listingId || !userId) {
    res.status(400).json({ error: 'Missing slug, listingId, or userId' });
    return;
  }

  let records: BumpRecord[] = [];
  try {
    records = await readBumps();
  } catch (error) {
    console.error('Failed to read bump store', error);
    records = [];
  }
  const { canBump, nextAvailableAt } = getUserCooldown(records, slug, userId);
  if (!canBump) {
    res.status(429).json({ error: 'Already bumped within 24 hours', nextAvailableAt });
    return;
  }

  const entry: BumpRecord = {
    slug,
    listingId,
    userId,
    timestamp: Date.now(),
  };

  records.push(entry);
  await writeBumps(records);
  res.status(201).json({ success: true, nextAvailableAt: entry.timestamp + DAILY_LIMIT_MS });
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  let records: BumpRecord[] = [];
  try {
    records = await readBumps();
  } catch (error) {
    console.error('Failed to read bump store', error);
  }
  if (req.query.leaderboard) {
    await sendLeaderboard(records, req, res);
    return;
  }

  const slug = typeof req.query.slug === 'string' ? req.query.slug : undefined;
  if (!slug) {
    res.status(400).json({ error: 'Missing slug parameter' });
    return;
  }
  const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
  const summary = summarizeListing(records, slug);
  const cooldown = getUserCooldown(records, slug, userId);
  res.status(200).json({ ...summary, ...cooldown });
}

async function sendLeaderboard(records: BumpRecord[], req: VercelRequest, res: VercelResponse) {
  const limitParam = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : null;
  const limit = Number.isFinite(limitParam) && limitParam! > 0 ? limitParam! : 12;
  const now = Date.now();
  let chosenWindow = BUMP_WINDOWS[0];
  let leaderboard: LeaderboardItem[] = [];

  for (const window of BUMP_WINDOWS) {
    const cutoff = now - window.ms;
    const aggregated = aggregateCounts(records, cutoff);
    if (aggregated.length > 0) {
      chosenWindow = window;
      leaderboard = aggregated;
      break;
    }
  }

  if (leaderboard.length === 0) {
    leaderboard = aggregateCounts(records, 0);
  }

  const listingMap = new Map<string, ListingRecord>();
  try {
    const listings = await loadListings();
    listings.forEach((listing) => listingMap.set(listing.slug, listing));
  } catch (error) {
    console.error('Unable to load listings for leaderboard', error);
  }

  const items = leaderboard.slice(0, limit).map((entry) => {
    const listing = listingMap.get(entry.slug);
    return {
      slug: entry.slug,
      listingId: entry.listingId,
      name: listing?.name ?? entry.slug,
      category: listing?.primaryCategory || listing?.tags?.[0] || 'Local Business',
      image: listing?.imageUrl || listing?.remoteImageUrl,
      count: entry.count,
    };
  });

  res.status(200).json({ timeframe: chosenWindow.label, items });
}
