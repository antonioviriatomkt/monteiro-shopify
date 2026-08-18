// Uploads every file under theme/ into the target Shopify theme,
// preserving the relative directory structure (sections/, assets/, etc.).
// Usage:
//   node scripts/deploy-section.mjs                # finds theme by name
//   THEME_NAME='Other Theme' node scripts/deploy-section.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { graphql } from './lib.mjs';

const THEME_NAME = process.env.THEME_NAME || 'Resellers WIP';
const THEME_DIR = fileURLToPath(new URL('../theme/', import.meta.url));

const themesQuery = `
  query Themes {
    themes(first: 50) {
      nodes { id name role }
    }
  }
`;

const upsertMutation = `
  mutation Upsert($themeId: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) {
    themeFilesUpsert(themeId: $themeId, files: $files) {
      upsertedThemeFiles { filename }
      userErrors { code field message filename }
    }
  }
`;

const BINARY_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.otf']);

function walk(dir, rel = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    const relPath = rel ? path.join(rel, entry.name) : entry.name;
    if (entry.isDirectory()) out.push(...walk(full, relPath));
    else out.push({ full, rel: relPath });
  }
  return out;
}

const themes = (await graphql(themesQuery)).themes.nodes;
const target = themes.find((t) => t.name === THEME_NAME);
if (!target) {
  console.error(`Theme "${THEME_NAME}" not found. Available themes:`);
  for (const t of themes) console.error(`  - ${t.name} [${t.role}]`);
  process.exit(1);
}
console.log(`Target theme: ${target.name} (${target.role}) — ${target.id}`);

const localFiles = walk(THEME_DIR);
if (localFiles.length === 0) {
  console.error('No files found under theme/.');
  process.exit(1);
}

const files = localFiles.map(({ full, rel }) => {
  const ext = path.extname(full).toLowerCase();
  const isBinary = BINARY_EXTS.has(ext);
  return {
    filename: rel.split(path.sep).join('/'),
    body: isBinary
      ? { type: 'BASE64', value: fs.readFileSync(full).toString('base64') }
      : { type: 'TEXT',   value: fs.readFileSync(full, 'utf8') },
  };
});

console.log(`Uploading ${files.length} file(s):`);
for (const f of files) console.log(`  - ${f.filename}`);

const result = (await graphql(upsertMutation, { themeId: target.id, files })).themeFilesUpsert;
if (result.userErrors.length) {
  console.error('User errors:', JSON.stringify(result.userErrors, null, 2));
  process.exit(1);
}
console.log('\nUploaded:');
for (const f of result.upsertedThemeFiles) console.log(`  ✓ ${f.filename}`);
