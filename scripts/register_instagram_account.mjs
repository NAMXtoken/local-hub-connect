#!/usr/bin/env node
/**
 * Helper script that walks you through registering an Instagram Basic Display
 * account and saving the resulting long-lived token into data/instagram-tokens.json.
 *
 * Run with: node scripts/register_instagram_account.mjs
 */
import http from 'node:http';
import { stdin, stdout, exit } from 'node:process';
import readline from 'node:readline/promises';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { spawn } from 'node:child_process';

const GRAPH_BASE_URL = 'https://graph.instagram.com';
const BASIC_BASE_URL = 'https://api.instagram.com';
const DEFAULT_REDIRECT = 'http://localhost:4815/instagram/callback';

function logStep(message) {
  stdout.write(`\n› ${message}\n`);
}

async function prompt(question, initial) {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const answer = await rl.question(initial ? `${question} (${initial}): ` : `${question}: `);
  rl.close();
  return answer.trim() || initial || '';
}

async function ensureStore(filePath) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify({ accounts: [] }, null, 2), 'utf8');
  }
}

async function readStore(filePath) {
  await ensureStore(filePath);
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function writeStore(filePath, store) {
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), 'utf8');
}

function openBrowser(url) {
  const commands = {
    darwin: ['open', [url]],
    win32: ['cmd', ['/c', 'start', '', url]],
    linux: ['xdg-open', [url]],
  };
  const entry = commands[process.platform];
  if (!entry) {
    stdout.write(`\nOpen this URL manually:\n${url}\n`);
    return;
  }
  const [cmd, args] = entry;
  const child = spawn(cmd, args, { stdio: 'ignore' });
  child.on('error', () => {
    stdout.write(`\nUnable to auto-open browser. Copy this URL manually:\n${url}\n`);
  });
}

async function waitForCode(redirectUri) {
  try {
    const url = new URL(redirectUri);
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) {
      return null;
    }
    const port = Number(url.port || 80);
    return await new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        const current = new URL(req.url ?? '/', `http://${req.headers.host}`);
        if (current.pathname === url.pathname) {
          const code = current.searchParams.get('code');
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body><h2>Instagram code captured. You can close this tab.</h2></body></html>');
          server.close();
          resolve(code);
        } else {
          res.writeHead(404);
          res.end();
        }
      });
      server.on('error', reject);
      server.listen(port, url.hostname, () => {
        logStep(`Listening at ${url.origin}${url.pathname} for the OAuth redirect...`);
      });
    });
  } catch (error) {
    console.error('Failed to bind local redirect listener', error);
    return null;
  }
}

async function exchangeCode({ code, clientId, clientSecret, redirectUri }) {
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
    throw new Error(`Failed to exchange code (${response.status}): ${text}`);
  }
  return response.json();
}

async function convertToLongLived({ accessToken, clientSecret }) {
  const params = new URLSearchParams({
    grant_type: 'ig_exchange_token',
    client_secret: clientSecret,
    access_token: accessToken,
  });
  const response = await fetch(`${GRAPH_BASE_URL}/access_token?${params.toString()}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to convert to long-lived token (${response.status}): ${text}`);
  }
  return response.json();
}

async function fetchProfile(accessToken) {
  const response = await fetch(`${GRAPH_BASE_URL}/me?fields=id,username&access_token=${accessToken}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch profile (${response.status}): ${text}`);
  }
  return response.json();
}

async function saveAccount(record, filePath) {
  const store = await readStore(filePath);
  const idx = store.accounts.findIndex(
    (entry) => entry.userId === record.userId || entry.username === record.username
  );
  if (idx >= 0) {
    store.accounts[idx] = record;
  } else {
    store.accounts.push(record);
  }
  await writeStore(filePath, store);
}

async function main() {
  const clientId = process.env.IG_CLIENT_ID || (await prompt('Enter IG_CLIENT_ID (from Meta Apps)'));
  const clientSecret =
    process.env.IG_CLIENT_SECRET || (await prompt('Enter IG_CLIENT_SECRET (from Meta Apps)'));
  const redirectUri =
    process.env.IG_REDIRECT_URI ||
    (await prompt('Redirect URI configured in Instagram', DEFAULT_REDIRECT));
  const tokenPath =
    process.env.IG_TOKEN_PATH || path.join(process.cwd(), 'data', 'instagram-tokens.json');

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('clientId, clientSecret, and redirectUri are required.');
    exit(1);
  }

  const authParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'user_profile,user_media',
    response_type: 'code',
  });
  const authUrl = `${BASIC_BASE_URL}/oauth/authorize?${authParams.toString()}`;

  logStep('Open the Instagram consent screen');
  stdout.write(`${authUrl}\n`);
  openBrowser(authUrl);

  let code = null;
  const capturedCode = await waitForCode(redirectUri);
  if (capturedCode) {
    code = capturedCode;
  }
  if (!code) {
    code = await prompt('Paste the ?code= value from the redirected URL');
  }
  if (!code) {
    console.error('Code is required to continue.');
    exit(1);
  }

  logStep('Exchanging for short-lived token...');
  const shortToken = await exchangeCode({ code, clientId, clientSecret, redirectUri });

  logStep('Converting to long-lived token...');
  const longToken = await convertToLongLived({
    accessToken: shortToken.access_token,
    clientSecret,
  });

  logStep('Fetching Instagram profile...');
  const profile = await fetchProfile(longToken.access_token);

  const record = {
    userId: profile.id,
    username: profile.username,
    accessToken: longToken.access_token,
    expiresAt: Date.now() + Number(longToken.expires_in) * 1000,
    lastRefreshedAt: Date.now(),
  };
  await saveAccount(record, tokenPath);

  logStep('Success! Stored account:');
  stdout.write(JSON.stringify({ userId: record.userId, username: record.username }, null, 2));
  stdout.write(`\nTokens saved to ${tokenPath}\n`);
}

main().catch((error) => {
  console.error('Registration failed:', error);
  exit(1);
});
