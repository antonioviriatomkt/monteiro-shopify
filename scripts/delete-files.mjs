// Delete theme files from the target theme (themeFilesDelete), then remove the
// local copies and their drift snapshots. Use for cleaning up orphaned files.
// Usage: THEME_NAME='…' node scripts/delete-files.mjs sections/foo.liquid assets/bar.css
import fs from 'node:fs';
import path from 'node:path';
import { resolveTheme, graphql, loadSnapshots, saveSnapshots, THEME_DIR } from './lib.mjs';

const THEME_NAME = process.env.THEME_NAME || 'CLAUDE_MF_JUNE_PROPOSTA';
const files = process.argv.slice(2).map((a) => a.split(path.sep).join('/'));
if (!files.length) { console.error('Pass theme-relative filenames to delete.'); process.exit(1); }

const target = await resolveTheme(THEME_NAME);
console.log(`Theme: ${target.name} (${target.role}) — ${target.id}`);

const m = `mutation($themeId: ID!, $files: [String!]!) {
  themeFilesDelete(themeId: $themeId, files: $files) {
    deletedThemeFiles { filename }
    userErrors { filename code message }
  }
}`;
const res = (await graphql(m, { themeId: target.id, files })).themeFilesDelete;
console.log('Deleted on theme:');
for (const f of res.deletedThemeFiles) console.log(`  ✗ ${f.filename}`);
if (res.userErrors.length) console.log('User errors:', JSON.stringify(res.userErrors, null, 2));

const snaps = loadSnapshots(THEME_NAME);
let localRemoved = 0;
for (const f of files) {
  const full = path.join(THEME_DIR, f);
  if (fs.existsSync(full)) { fs.unlinkSync(full); localRemoved++; }
  if (snaps[f]) delete snaps[f];
}
saveSnapshots(THEME_NAME, snaps);
console.log(`Removed ${localRemoved} local file(s); snapshots cleaned.`);
