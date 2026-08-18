// Pulls files FROM the target theme INTO the local theme/ tree, and refreshes
// the drift snapshots used by deploy-files.mjs. Run this to capture edits made
// in the Shopify theme editor before deploying, so your changes aren't lost.
//
// Usage:
//   THEME_NAME='CLAUDE_MF_JUNE_PROPOSTA' node scripts/pull-files.mjs templates/index.json sections/header.liquid
//   THEME_NAME='CLAUDE_MF_JUNE_PROPOSTA' node scripts/pull-files.mjs --local   # refresh every file already in local theme/
//   THEME_NAME='CLAUDE_MF_JUNE_PROPOSTA' node scripts/pull-files.mjs --all     # mirror all text files from the theme

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveTheme, fetchThemeFiles, resolveText, contentHash, loadSnapshots, saveSnapshots, TEXT_EXTS, THEME_DIR } from './lib.mjs';

const THEME_NAME = process.env.THEME_NAME || 'CLAUDE_MF_JUNE_PROPOSTA';
const args = process.argv.slice(2);

function walkLocal(dir, base = dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkLocal(full, base, acc);
    else if (TEXT_EXTS.has(path.extname(e.name).toLowerCase())) {
      acc.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return acc;
}

let filenames; // null => all
if (args.includes('--all')) {
  filenames = null;
} else if (args.includes('--local')) {
  filenames = fs.existsSync(THEME_DIR) ? walkLocal(THEME_DIR) : [];
  if (!filenames.length) { console.error('No local text files found under theme/.'); process.exit(1); }
} else if (args.length) {
  filenames = args.map((a) => a.split(path.sep).join('/'));
} else {
  console.error('Pass file paths relative to theme/, or --local (refresh existing local files), or --all.');
  process.exit(1);
}

const target = await resolveTheme(THEME_NAME);
console.log(`Source theme: ${target.name} (${target.role}) — ${target.id}`);

const remote = await fetchThemeFiles(target.id, filenames);
const snaps = loadSnapshots(THEME_NAME);
let pulled = 0, skipped = 0, missing = 0;

for (const [name, entry] of Object.entries(remote)) {
  if (!TEXT_EXTS.has(path.extname(name).toLowerCase())) { skipped++; continue; } // skip binaries
  const text = await resolveText(entry);
  if (text == null) { missing++; continue; }
  const full = path.join(THEME_DIR, name);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, text);
  snaps[name] = contentHash(text);
  pulled++;
  console.log(`  ↓ ${name}`);
}

// Report any explicitly-requested files that don't exist on the theme.
if (Array.isArray(filenames)) {
  for (const name of filenames) {
    if (!(name in remote) || remote[name].kind === 'missing') console.log(`  · (not on theme) ${name}`);
  }
}

saveSnapshots(THEME_NAME, snaps);
console.log(`\nPulled ${pulled} file(s)${skipped ? `, skipped ${skipped} binary` : ''}${missing ? `, ${missing} missing` : ''}; snapshots updated for ${target.name}.`);
