// Shared helpers for the Monteiro Fabrics Shopify scripts.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// CREDENTIALS — read the root CLAUDE.md before changing this.
// The old custom-app token (.shopify-token.json) was retired 2026-09-14: its app
// had been reduced to read_orders while the file still advertised write_themes,
// so every script failed late with a different "Access denied".
// Admin-API work now needs an explicit token in the environment; theme files do
// NOT come through here at all -- use `bin/mf` (Shopify CLI + Theme Access).
const SHOP = process.env.SHOPIFY_SHOP || 'monteiro-fabrics.myshopify.com';

export const API_VERSION = '2025-01';
// theme-sandbox/ mirrors 195386114425; theme-live/ mirrors 162670182703 (MAIN).
export const THEME_DIR = fileURLToPath(new URL('../' + (process.env.MF_THEME_DIR || 'theme-sandbox') + '/', import.meta.url));
const STATE_DIR = fileURLToPath(new URL('../.deploy-state/', import.meta.url));

// Text-bodied theme files we track for drift detection / pulling.
export const TEXT_EXTS = new Set(['.json', '.liquid', '.js', '.css', '.scss', '.svg', '.md', '.txt', '.html']);

export function loadCreds() {
  const accessToken = process.env.SHOPIFY_ADMIN_TOKEN;
  if (!accessToken) {
    throw new Error(
      'No SHOPIFY_ADMIN_TOKEN in the environment.\n' +
      '  Theme files      -> do not use this script. Use  bin/mf pull|push live|sandbox\n' +
      '  Metafields, products, media, articles, translations -> use the Shopify MCP connector\n' +
      '  Redirects, theme publish, unpublishing a collection -> Shopify Admin, by hand\n' +
      'See CLAUDE.md at the root of this repo.'
    );
  }
  return { shop: SHOP, accessToken };
}

export async function graphql(query, variables = {}) {
  const { shop, accessToken } = loadCreds();
  const resp = await fetch(`https://${shop}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}: ${text}`);
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response: ${text}`);
  }
  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors, null, 2)}`);
  }
  return data.data;
}

// Resolve a theme node by name. Throws (listing available themes) if not found.
export async function resolveTheme(themeName) {
  const themes = (await graphql(`query { themes(first: 50) { nodes { id name role } } }`)).themes.nodes;
  const target = themes.find((t) => t.name === themeName);
  if (!target) {
    const list = themes.map((t) => `  - ${t.name} [${t.role}]`).join('\n');
    throw new Error(`Theme "${themeName}" not found. Available:\n${list}`);
  }
  return target;
}

// Fetch theme files. `filenames` = array (filtered) or null (all files, paginated).
// Returns { filename: { kind: 'text'|'base64'|'url'|'missing', content } }.
export async function fetchThemeFiles(themeId, filenames = null) {
  const q = `query($id: ID!, $names: [String!], $after: String) {
    theme(id: $id) {
      files(first: 50, filenames: $names, after: $after) {
        nodes {
          filename
          body {
            __typename
            ... on OnlineStoreThemeFileBodyText { content }
            ... on OnlineStoreThemeFileBodyBase64 { contentBase64 }
            ... on OnlineStoreThemeFileBodyUrl { url }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }`;
  const out = {};
  // `filenames` is capped at 250 per request — chunk it. null = all files (paginated).
  const batches = Array.isArray(filenames)
    ? Array.from({ length: Math.ceil(filenames.length / 50) }, (_, i) => filenames.slice(i * 50, i * 50 + 50))
    : [null];
  for (const names of batches) {
    let after = null;
    do {
      const conn = (await graphql(q, { id: themeId, names, after })).theme.files;
      for (const n of conn.nodes) {
        const b = n.body || {};
        if (b.__typename === 'OnlineStoreThemeFileBodyText') out[n.filename] = { kind: 'text', content: b.content };
        else if (b.__typename === 'OnlineStoreThemeFileBodyBase64') out[n.filename] = { kind: 'base64', content: b.contentBase64 };
        else if (b.__typename === 'OnlineStoreThemeFileBodyUrl') out[n.filename] = { kind: 'url', content: b.url };
        else out[n.filename] = { kind: 'missing', content: null };
      }
      after = conn.pageInfo.hasNextPage ? conn.pageInfo.endCursor : null;
    } while (after);
  }
  return out;
}

// Resolve a fetchThemeFiles entry to a UTF-8 string (or null if missing).
export async function resolveText(entry) {
  if (!entry || entry.kind === 'missing' || entry.content == null) return null;
  if (entry.kind === 'text') return entry.content;
  if (entry.kind === 'base64') return Buffer.from(entry.content, 'base64').toString('utf8');
  if (entry.kind === 'url') return await (await fetch(entry.content)).text();
  return null;
}

// Normalize for comparison: ignore CRLF vs LF and trailing whitespace at EOF only.
export function normalizeContent(s) {
  return String(s).replace(/\r\n/g, '\n').replace(/\s*$/, '');
}

export function contentHash(s) {
  return crypto.createHash('sha256').update(normalizeContent(s), 'utf8').digest('hex');
}

function snapshotPath(themeName) {
  return path.join(STATE_DIR, themeName.replace(/[^A-Za-z0-9_-]/g, '_') + '.json');
}

export function loadSnapshots(themeName) {
  const p = snapshotPath(themeName);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
}

export function saveSnapshots(themeName, snaps) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(snapshotPath(themeName), JSON.stringify(snaps, null, 2) + '\n');
}
