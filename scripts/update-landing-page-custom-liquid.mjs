// One-off: replace the custom_liquid setting of the section "custom_liquid_NUPpwP"
// inside templates/page.landingpage-healthcare.json with the contents of
// data/landing-page-custom-liquid/modal-forms.html, then upsert the template
// back into the target theme.

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { graphql } from './lib.mjs';

const THEME_NAME = process.env.THEME_NAME || 'Showcase 7.0';
const TEMPLATE_PATH = 'templates/page.landingpage-healthcare.json';
const SECTION_KEY = 'custom_liquid_NUPpwP';
const NEW_HTML_FILE = fileURLToPath(new URL('../data/landing-page-custom-liquid/modal-forms.html', import.meta.url));

const themesQ = `query { themes(first: 50) { nodes { id name role } } }`;
const filesQ = `
  query($id: ID!, $filenames: [String!]) {
    theme(id: $id) {
      files(filenames: $filenames, first: 5) {
        nodes {
          filename
          body {
            __typename
            ... on OnlineStoreThemeFileBodyText { content }
            ... on OnlineStoreThemeFileBodyUrl  { url     }
          }
        }
      }
    }
  }
`;
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

const fileNode = (await graphql(filesQ, { id: target.id, filenames: [TEMPLATE_PATH] })).theme.files.nodes[0];
let raw;
if (fileNode.body.__typename === 'OnlineStoreThemeFileBodyText') raw = fileNode.body.content;
else raw = await (await fetch(fileNode.body.url)).text();
console.log(`Fetched ${TEMPLATE_PATH}: ${raw.length} chars`);

// Preserve the leading /* … */ comment block, then parse the JSON.
const commentMatch = raw.match(/^\s*\/\*[\s\S]*?\*\/\s*/);
const leadingComment = commentMatch ? commentMatch[0] : '';
const jsonText = raw.slice(leadingComment.length);
const tpl = JSON.parse(jsonText);

if (!tpl.sections || !tpl.sections[SECTION_KEY]) {
  throw new Error(`Section "${SECTION_KEY}" not found in template.`);
}
const section = tpl.sections[SECTION_KEY];
console.log(`Section type: ${section.type}`);
section.settings = section.settings || {};
const previous = section.settings.custom_liquid || '';
const next = fs.readFileSync(NEW_HTML_FILE, 'utf8');
if (previous === next) {
  console.log('custom_liquid is already up-to-date. Nothing to push.');
  process.exit(0);
}
section.settings.custom_liquid = next;
console.log(`Replacing custom_liquid value: ${previous.length} chars → ${next.length} chars`);

const newRaw = leadingComment + JSON.stringify(tpl, null, 2) + '\n';

const result = (await graphql(upsertM, {
  themeId: target.id,
  files: [{ filename: TEMPLATE_PATH, body: { type: 'TEXT', value: newRaw } }],
})).themeFilesUpsert;

if (result.userErrors.length) {
  console.error('User errors:', JSON.stringify(result.userErrors, null, 2));
  process.exit(1);
}
console.log('Uploaded:');
for (const f of result.upsertedThemeFiles) console.log(`  ✓ ${f.filename}`);
