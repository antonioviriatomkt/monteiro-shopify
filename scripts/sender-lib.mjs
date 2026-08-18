// Shared helpers for the Sender API.

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const TOKEN_FILE = fileURLToPath(new URL('../.sender-token', import.meta.url));
const BASE = 'https://api.sender.net/v2';

export function loadToken() {
  if (!fs.existsSync(TOKEN_FILE)) throw new Error('.sender-token not found');
  return fs.readFileSync(TOKEN_FILE, 'utf8').trim();
}

export async function api(path, { method = 'GET', body, query } = {}) {
  const token = loadToken();
  const url = new URL(BASE + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v != null) url.searchParams.set(k, v);
    }
  }
  const resp = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} on ${path}: ${text.slice(0, 500)}`);
  }
  return text ? JSON.parse(text) : null;
}

// Auto-paginates through endpoints that return { data: [...], links/meta }.
export async function paginate(path, query = {}, { perPage = 100, maxPages = 200 } = {}) {
  const all = [];
  let page = 1;
  while (page <= maxPages) {
    const resp = await api(path, { query: { ...query, limit: perPage, page } });
    const batch = resp.data || [];
    all.push(...batch);
    if (batch.length < perPage) break;
    page++;
  }
  return all;
}
