import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  ensureFreshInstagramToken,
  exchangeCodeForInstagramAccount,
  fetchInstagramMedia,
  getInstagramAccount,
  listInstagramAccounts,
  upsertInstagramAccount,
  type InstagramTokenRecord,
} from '../lib/server/instagram.js';

function parseBody(body: unknown): Record<string, unknown> | null {
  if (!body) return null;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  if (typeof body === 'object') {
    return body as Record<string, unknown>;
  }
  return null;
}

function normalizeBoolean(value: string | string[] | undefined): boolean {
  if (!value) return false;
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === '1' || raw === 'true';
}

function normalizeNumber(value: string | string[] | undefined): number | undefined {
  if (!value) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function coerceBodyNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function sanitizeAccount(record: InstagramTokenRecord) {
  const { accessToken: _accessToken, ...rest } = record;
  return rest;
}

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      await handleGet(req, res);
      return;
    }
    if (req.method === 'POST') {
      await handlePost(req, res);
      return;
    }
    res.setHeader('Allow', 'GET,POST');
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Instagram API route failed', error);
    res.status(500).json({ error: 'Instagram API failed' });
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  if (normalizeBoolean(req.query.accounts as string | string[] | undefined)) {
    const accounts = await listInstagramAccounts();
    res.status(200).json(accounts.map(sanitizeAccount));
    return;
  }

  const usernameParam = typeof req.query.username === 'string' ? req.query.username : undefined;
  const userIdParam = typeof req.query.userId === 'string' ? req.query.userId : undefined;

  if (!usernameParam && !userIdParam) {
    res.status(400).json({ error: 'Provide username or userId' });
    return;
  }

  const limitParam = normalizeNumber(req.query.limit as string | string[] | undefined);
  const fieldsParam = typeof req.query.fields === 'string' ? req.query.fields : undefined;
  const refreshParam = normalizeBoolean(req.query.refresh as string | string[] | undefined);

  const account = await getInstagramAccount({ username: usernameParam, userId: userIdParam });
  if (!account) {
    res.status(404).json({ error: 'Instagram account is not registered' });
    return;
  }

  const token = await ensureFreshInstagramToken(account, refreshParam);
  const media = await fetchInstagramMedia(token, {
    limit: limitParam,
    fields: fieldsParam,
  });
  res.status(200).json({
    account: sanitizeAccount(token),
    media,
  });
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  const payload = parseBody(req.body);
  if (!payload) {
    res.status(400).json({ error: 'Missing request body' });
    return;
  }

  const code = typeof payload.code === 'string' ? payload.code : undefined;
  const redirectUri = typeof payload.redirectUri === 'string' ? payload.redirectUri : undefined;

  if (code && redirectUri) {
    const account = await exchangeCodeForInstagramAccount(code, redirectUri);
    res.status(201).json({ account: sanitizeAccount(account) });
    return;
  }

  const userId = typeof payload.userId === 'string' ? payload.userId : undefined;
  const username = typeof payload.username === 'string' ? payload.username : undefined;
  const accessToken = typeof payload.accessToken === 'string' ? payload.accessToken : undefined;
  const expiresIn = coerceBodyNumber(payload.expiresIn);
  const expiresAtPayload = coerceBodyNumber(payload.expiresAt);

  if (userId && username && accessToken && (expiresAtPayload || expiresIn)) {
    const expiresAt =
      expiresAtPayload ?? Date.now() + (expiresIn ?? 0) * 1000;
    const record: InstagramTokenRecord = {
      userId,
      username,
      accessToken,
      expiresAt,
      lastRefreshedAt: Date.now(),
    };
    await upsertInstagramAccount(record);
    res.status(201).json({ account: sanitizeAccount(record) });
    return;
  }

  res.status(400).json({ error: 'Provide code+redirectUri or userId+username+accessToken' });
}
