// Upload a binary asset (image) to the target theme via themeFilesUpsert (BASE64).
// Usage: THEME_NAME='…' node scripts/upload-asset.mjs <localPath> <theme/relative/filename>
import fs from 'node:fs';
import { resolveTheme, graphql } from './lib.mjs';

const THEME_NAME = process.env.THEME_NAME || 'CLAUDE_MF_JUNE_PROPOSTA';
const [src, dest] = process.argv.slice(2);
if (!src || !dest) { console.error('Usage: node scripts/upload-asset.mjs <localPath> <theme/filename>'); process.exit(1); }

const b64 = fs.readFileSync(src).toString('base64');
const target = await resolveTheme(THEME_NAME);
const m = `mutation($themeId: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) {
  themeFilesUpsert(themeId: $themeId, files: $files) {
    upsertedThemeFiles { filename }
    userErrors { filename code message }
  }
}`;
const data = await graphql(m, { themeId: target.id, files: [{ filename: dest, body: { type: 'BASE64', value: b64 } }] });
console.log(`Theme: ${target.name} (${target.id})`);
console.log(JSON.stringify(data.themeFilesUpsert, null, 2));
