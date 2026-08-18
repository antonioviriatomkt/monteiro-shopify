// Uploads ONLY the files passed as arguments into the target theme — surgical,
// never walks the whole theme/ tree (so it can't clobber files you didn't touch).
//
// DRIFT GUARD: before pushing, each text file's current copy on the theme is
// compared against a snapshot of what these scripts last synced. If the theme
// copy changed since then (e.g. you edited it in the Shopify theme editor), the
// deploy ABORTS so your edits are never silently overwritten — pull first:
//   node scripts/pull-files.mjs <files...>
// Override (overwrite anyway) with FORCE=1.
//
// Usage:
//   THEME_NAME='CLAUDE_MF_JUNE_PROPOSTA' node scripts/deploy-files.mjs \
//     templates/index.json sections/value-props.liquid

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { graphql, resolveTheme, fetchThemeFiles, resolveText, contentHash, loadSnapshots, saveSnapshots } from './lib.mjs';

const THEME_NAME = process.env.THEME_NAME || 'CLAUDE_MF_JUNE_PROPOSTA';
const FORCE = process.env.FORCE === '1';
const THEME_DIR = fileURLToPath(new URL('../theme/', import.meta.url));

const rels = process.argv.slice(2);
if (rels.length === 0) {
  console.error('Pass one or more file paths relative to theme/, e.g. templates/index.json');
  process.exit(1);
}

const upsertMutation = `
  mutation Upsert($themeId: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) {
    themeFilesUpsert(themeId: $themeId, files: $files) {
      upsertedThemeFiles { filename }
      userErrors { code field message filename }
    }
  }`;

const BINARY_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.otf']);
// Files we drift-check & snapshot (text templates/sections/etc., excluding binaries and base64-uploaded svg).
const DRIFT_EXTS = new Set(['.json', '.liquid', '.js', '.css', '.scss', '.md', '.txt', '.html']);

const files = rels.map((rel) => {
  const full = path.join(THEME_DIR, rel);
  if (!fs.existsSync(full)) {
    console.error(`Missing local file: theme/${rel}`);
    process.exit(1);
  }
  const ext = path.extname(full).toLowerCase();
  const isBinary = BINARY_EXTS.has(ext);
  const filename = rel.split(path.sep).join('/');
  const rawText = isBinary ? null : fs.readFileSync(full, 'utf8');
  return {
    filename,
    ext,
    driftCheck: DRIFT_EXTS.has(ext),
    localText: rawText,
    body: isBinary
      ? { type: 'BASE64', value: fs.readFileSync(full).toString('base64') }
      : { type: 'TEXT', value: rawText },
  };
});

const target = await resolveTheme(THEME_NAME);
console.log(`Target theme: ${target.name} (${target.role}) — ${target.id}`);

// ---- Drift guard ----
const checkNames = files.filter((f) => f.driftCheck).map((f) => f.filename);
if (checkNames.length) {
  const remote = await fetchThemeFiles(target.id, checkNames);
  const snaps = loadSnapshots(THEME_NAME);
  const drift = [];
  for (const f of files) {
    if (!f.driftCheck) continue;
    const remoteText = await resolveText(remote[f.filename]);
    if (remoteText == null) continue; // new file on the theme — safe to create
    const rHash = contentHash(remoteText);
    if (rHash === contentHash(f.localText)) continue; // already identical
    if (snaps[f.filename] && snaps[f.filename] === rHash) continue; // theme == last sync; this is our pending change
    drift.push(f.filename); // theme changed since last sync — would clobber
  }
  if (drift.length) {
    console.error('\n⛔ ABORTED — these theme files changed on the theme since the last sync');
    console.error('   (most likely edited in the Shopify theme editor). Pushing would overwrite those edits:');
    for (const f of drift) console.error(`     ✗ ${f}`);
    console.error('\n   Pull them into local first, reconcile your change, then redeploy:');
    console.error(`     THEME_NAME='${THEME_NAME}' node scripts/pull-files.mjs ${drift.join(' ')}`);
    if (!FORCE) {
      console.error('\n   (To deliberately overwrite the theme copy anyway: prefix the deploy with FORCE=1)');
      process.exit(2);
    }
    console.error('\n   FORCE=1 set — overwriting the theme copy anyway.');
  }
}

// ---- Upload ----
console.log(`Uploading ${files.length} file(s):`);
for (const f of files) console.log(`  - ${f.filename}`);

const result = (await graphql(upsertMutation, { themeId: target.id, files: files.map((f) => ({ filename: f.filename, body: f.body })) })).themeFilesUpsert;
if (result.userErrors.length) {
  console.error('User errors:', JSON.stringify(result.userErrors, null, 2));
  process.exit(1);
}
console.log('\nUploaded:');
for (const f of result.upsertedThemeFiles) console.log(`  ✓ ${f.filename}`);

// ---- Refresh snapshots from the authoritative theme copy ----
if (checkNames.length) {
  const after = await fetchThemeFiles(target.id, checkNames);
  const snaps = loadSnapshots(THEME_NAME);
  for (const name of checkNames) {
    const t = await resolveText(after[name]);
    if (t != null) snaps[name] = contentHash(t);
  }
  saveSnapshots(THEME_NAME, snaps);
  console.log('\nSnapshots updated for drift detection.');
}
