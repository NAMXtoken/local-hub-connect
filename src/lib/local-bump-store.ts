import type { BumpMutationError, BumpMutationResponse } from "@/types/bumps";

const STORAGE_KEY = "samui-connect-local-bumps";

interface LocalBump {
  slug: string;
  listingId: string;
  userId: string;
  timestamp: number;
  category?: string;
  name?: string;
}

const WINDOWS = [
  { label: "24 hours", ms: 24 * 60 * 60 * 1000 },
  { label: "48 hours", ms: 48 * 60 * 60 * 1000 },
  { label: "72 hours", ms: 72 * 60 * 60 * 1000 },
  { label: "7 days", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "14 days", ms: 14 * 24 * 60 * 60 * 1000 },
  { label: "30 days", ms: 30 * 24 * 60 * 60 * 1000 },
];

const DAILY_MS = 24 * 60 * 60 * 1000;

const safeWindow = () => (typeof window === "undefined" ? null : window);

const read = (): LocalBump[] => {
  if (!safeWindow()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalBump[]) : [];
  } catch {
    return [];
  }
};

const write = (records: LocalBump[]) => {
  if (!safeWindow()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

const cooldown = (records: LocalBump[], slug: string, userId: string) => {
  const latest = records
    .filter((record) => record.slug === slug && record.userId === userId)
    .sort((a, b) => b.timestamp - a.timestamp)[0];
  if (!latest) {
    return { canBump: true, nextAvailableAt: null };
  }
  const nextAvailableAt = latest.timestamp + DAILY_MS;
  return {
    canBump: Date.now() >= nextAvailableAt,
    nextAvailableAt,
  };
};

export const localBumpStats = (slug: string, userId?: string | null) => {
  const records = read().filter((record) => record.slug === slug);
  const counts: Record<string, number> = {};
  const now = Date.now();
  WINDOWS.forEach((window) => {
    const cutoff = now - window.ms;
    counts[window.label] = records.filter((record) => record.timestamp >= cutoff).length;
  });
  const { canBump, nextAvailableAt } = userId ? cooldown(records, slug, userId) : { canBump: true, nextAvailableAt: null };
  return {
    slug,
    listingId: records[0]?.listingId ?? null,
    total: records.length,
    counts,
    canBump,
    nextAvailableAt,
  };
};

export const localBumpLeaderboard = () => {
  const records = read();
  const now = Date.now();
  const window = WINDOWS.find((w) => records.some((record) => record.timestamp >= now - w.ms)) ?? WINDOWS[WINDOWS.length - 1];
  const cutoff = now - window.ms;
  const map = new Map<string, { slug: string; listingId: string; count: number; category?: string; name?: string }>();
  records.forEach((record) => {
    if (record.timestamp < cutoff) return;
    const entry = map.get(record.slug) ?? { slug: record.slug, listingId: record.listingId, count: 0, category: record.category, name: record.name };
    entry.count += 1;
    map.set(record.slug, entry);
  });
  const items = Array.from(map.values()).sort((a, b) => b.count - a.count);
  return { timeframe: window.label, items };
};

export const localCreateBump = (payload: { slug: string; listingId: string; userId: string; category?: string; name?: string }): BumpMutationResponse => {
  const records = read();
  const { canBump, nextAvailableAt } = cooldown(records, payload.slug, payload.userId);
  if (!canBump) {
    const error: BumpMutationError = new Error("Already bumped");
    error.details = { nextAvailableAt };
    throw error;
  }
  const entry: LocalBump = {
    slug: payload.slug,
    listingId: payload.listingId,
    userId: payload.userId,
    timestamp: Date.now(),
    category: payload.category,
    name: payload.name,
  };
  records.push(entry);
  write(records);
  return { success: true, nextAvailableAt: entry.timestamp + DAILY_MS, source: "local" };
};
