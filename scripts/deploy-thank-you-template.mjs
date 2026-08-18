// One-off: push templates/page.download-thank-you.json to the target theme.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { graphql } from './lib.mjs';

const THEME_NAME = process.env.THEME_NAME || 'Showcase 7.0';
const FILE_REL   = 'templates/page.download-thank-you.json';
const FILE_ABS   = fileURLToPath(new URL('../theme/' + FILE_REL, import.meta.url));

const themesQ = `query { themes(first: 50) { nodes { id name role } } }`;
const upsertM = `
  mutation Upsert($themeId: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) {
    themeFilesUpsert(themeId: $themeId, files: $files) {
      upsertedThemeFiles { filename }
      userErrors { code field message filename }
    }
  }
`;

const target = (await graphql(themesQ)).themes.nodes.find((t) => t.name === THEME_NAME);
if (!target) throw new Error(`Theme "${THEME_NAME}" not found`);
console.log(`Target theme: ${target.name} (${target.role}) — ${target.id}`);

const body = fs.readFileSync(FILE_ABS, 'utf8');
console.log(`Uploading ${FILE_REL}: ${body.length} chars`);

const result = (await graphql(upsertM, {
  themeId: target.id,
  files: [{ filename: FILE_REL, body: { type: 'TEXT', value: body } }],
})).themeFilesUpsert;

if (result.userErrors.length){
  console.error('User errors:', JSON.stringify(result.userErrors, null, 2));
  process.exit(1);
}
console.log('Uploaded:');
for (const f of result.upsertedThemeFiles) console.log(`  ✓ ${f.filename}`);
