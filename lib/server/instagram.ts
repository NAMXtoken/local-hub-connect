import { promises as fs } from 'node:fs';
import path from 'node:path';

const GRAPH_BASE_URL = 'https://graph.instagram.com';
const BASIC_BASE_URL = 'https://api.instagram.com';
const TOKEN_PATH = process.env.IG_TOKEN_PATH
  ? path.resolve(process.env.IG_TOKEN_PATH)
  : path.join(process.cwd(), 'data', 'instagram-tokens.json');
const REFRESH_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export interface InstagramTokenRecord {
  userId: string;
  username: string;
  accessToken: string;
  expiresAt: number;
  lastRefreshedAt: number;
}

export interface InstagramMediaItem {
  id: string;
  caption?: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp?: string;
  username: string;
  children?: { data: InstagramMediaItem[] };
}

interface TokenStore {
  accounts: InstagramTokenRecord[];
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return Boolean(error) && typeof error === 'object' && 'code' in (error as Record<string, unknown>);
}

async function readStore(): Promise<TokenStore> {
  try {
    const raw = await fs.readFile(TOKEN_PATH, 'utf8');
    return JSON.parse(raw) as TokenStore;
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      await fs.mkdir(path.dirname(TOKEN_PATH), { recursive: true });
      const empty: TokenStore = { accounts: [] };
      await fs.writeFile(TOKEN_PATH, JSON.stringify(empty, null, 2), 'utf8');
      return empty;
    }
    throw error;
  }
}

async function writeStore(store: TokenStore): Promise<void> {
  await fs.writeFile(TOKEN_PATH, JSON.stringify(store, null, 2), 'utf8');
}

export async function listInstagramAccounts(): Promise<InstagramTokenRecord[]> {
  const store = await readStore();
  return store.accounts;
}

export async function upsertInstagramAccount(record: InstagramTokenRecord): Promise<InstagramTokenRecord> {
  const store = await readStore();
  const existingIndex = store.accounts.findIndex(
    (account) => account.userId === record.userId || account.username === record.username
  );
  if (existingIndex >= 0) {
    store.accounts[existingIndex] = record;
  } else {
    store.accounts.push(record);
  }
  await writeStore(store);
  return record;
}

export async function getInstagramAccount(identifier: {
  userId?: string;
  username?: string;
}): Promise<InstagramTokenRecord | null> {
  const store = await readStore();
  if (identifier.userId) {
    const match = store.accounts.find((account) => account.userId === identifier.userId);
    if (match) {
      return match;
    }
  }
  if (identifier.username) {
    const normalized = identifier.username.toLowerCase();
    const match = store.accounts.find((account) => account.username.toLowerCase() === normalized);
    if (match) {
      return match;
    }
  }
  return null;
}

interface LongLivedTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in: number;
}

interface ShortLivedTokenResponse {
  access_token: string;
  user_id: string;
}

interface ProfileResponse {
  id: string;
  username: string;
}

function getInstagramCredentials() {
  const clientId = process.env.IG_CLIENT_ID;
  const clientSecret = process.env.IG_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('IG_CLIENT_ID and IG_CLIENT_SECRET must be configured');
  }
  return { clientId, clientSecret };
}

async function exchangeForShortLivedToken(code: string, redirectUri: string): Promise<ShortLivedTokenResponse> {
  const { clientId, clientSecret } = getInstagramCredentials();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code,
  });
  const response = await fetch(`${BASIC_BASE_URL}/oauth/access_token`, {
    method: 'POST',
    body,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to exchange code for token: ${response.status} ${text}`);
  }
  return (await response.json()) as ShortLivedTokenResponse;
}

async function convertToLongLivedToken(shortToken: string): Promise<LongLivedTokenResponse> {
  const { clientSecret } = getInstagramCredentials();
  const params = new URLSearchParams({
    grant_type: 'ig_exchange_token',
    client_secret: clientSecret,
    access_token: shortToken,
  });
  const response = await fetch(`${GRAPH_BASE_URL}/access_token?${params.toString()}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to convert to long-lived token: ${response.status} ${text}`);
  }
  return (await response.json()) as LongLivedTokenResponse;
}

async function lookupProfile(accessToken: string): Promise<ProfileResponse> {
  const response = await fetch(`${GRAPH_BASE_URL}/me?fields=id,username&access_token=${accessToken}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to load Instagram profile: ${response.status} ${text}`);
  }
  return (await response.json()) as ProfileResponse;
}

export async function exchangeCodeForInstagramAccount(code: string, redirectUri: string): Promise<InstagramTokenRecord> {
  const shortToken = await exchangeForShortLivedToken(code, redirectUri);
  const longLived = await convertToLongLivedToken(shortToken.access_token);
  const profile = await lookupProfile(longLived.access_token);
  const record: InstagramTokenRecord = {
    userId: profile.id,
    username: profile.username,
    accessToken: longLived.access_token,
    expiresAt: Date.now() + longLived.expires_in * 1000,
    lastRefreshedAt: Date.now(),
  };
  await upsertInstagramAccount(record);
  return record;
}

export async function refreshInstagramAccountToken(
  record: InstagramTokenRecord
): Promise<InstagramTokenRecord> {
  const params = new URLSearchParams({
    grant_type: 'ig_refresh_token',
    access_token: record.accessToken,
  });
  const response = await fetch(`${GRAPH_BASE_URL}/refresh_access_token?${params.toString()}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to refresh Instagram token: ${response.status} ${text}`);
  }
  const body = (await response.json()) as LongLivedTokenResponse;
  const updated: InstagramTokenRecord = {
    ...record,
    accessToken: body.access_token,
    expiresAt: Date.now() + body.expires_in * 1000,
    lastRefreshedAt: Date.now(),
  };
  await upsertInstagramAccount(updated);
  return updated;
}

export async function ensureFreshInstagramToken(
  record: InstagramTokenRecord,
  forceRefresh = false
): Promise<InstagramTokenRecord> {
  const remaining = record.expiresAt - Date.now();
  if (!forceRefresh && remaining > REFRESH_THRESHOLD_MS) {
    return record;
  }
  return refreshInstagramAccountToken(record);
}

export async function fetchInstagramMedia(
  record: InstagramTokenRecord,
  options?: { limit?: number; fields?: string }
): Promise<InstagramMediaItem[]> {
  const limit = options?.limit ?? 12;
  const fields =
    options?.fields ??
    ['id', 'media_type', 'media_url', 'permalink', 'thumbnail_url', 'timestamp', 'caption', 'username'].join(',');
  const params = new URLSearchParams({
    fields,
    access_token: record.accessToken,
    limit: String(limit),
  });
  const response = await fetch(`${GRAPH_BASE_URL}/${record.userId}/media?${params.toString()}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to load Instagram media: ${response.status} ${text}`);
  }
  const body = (await response.json()) as { data: InstagramMediaItem[] };
  return body.data ?? [];
}

