// Lists theme files in Showcase 7.0 and dumps anything that looks like
// it defines or uses buttons, so we can match the theme's button style.

import { graphql } from './lib.mjs';

const THEME_NAME = process.env.THEME_NAME || 'Showcase 7.0';

const themesQ = `query { themes(first: 50) { nodes { id name role } } }`;
const filesQ = `
  query($id: ID!, $filenames: [String!]) {
    theme(id: $id) {
      files(filenames: $filenames, first: 50) {
        nodes { filename body { ... on OnlineStoreThemeFileBodyText { content } } }
      }
    }
  }
`;
const listQ = `
  query($id: ID!) {
    theme(id: $id) {
      files(first: 250) { nodes { filename size } }
    }
  }
`;

const themes = (await graphql(themesQ)).themes.nodes;
const target = themes.find((t) => t.name === THEME_NAME);
if (!target) throw new Error(`Theme "${THEME_NAME}" not found`);
console.log(`Inspecting ${target.name} (${target.id})`);

const all = (await graphql(listQ, { id: target.id })).theme.files.nodes;
console.log(`Total files: ${all.length}`);

const candidates = all
  .map((f) => f.filename)
  .filter((f) =>
    /button|btn/i.test(f) ||
    f === 'assets/theme.css' ||
    f === 'assets/theme.scss.liquid' ||
    f === 'assets/style.css' ||
    f === 'assets/global.css' ||
    f.endsWith('.css.liquid') ||
    f === 'snippets/button.liquid'
  );

console.log('\nCandidate files:');
for (const f of candidates) console.log('  ', f);

// Also grab a couple of hero/banner sections to see how buttons are used.
const heroLike = all
  .map((f) => f.filename)
  .filter((f) => /sections\/.*(hero|banner|image-with|cta|feature)/i.test(f))
  .slice(0, 4);
console.log('\nHero-ish sections to inspect:');
for (const f of heroLike) console.log('  ', f);

const toFetch = [...candidates.slice(0, 6), ...heroLike];
if (!toFetch.length) {
  console.log('Nothing to fetch.');
  process.exit(0);
}

const fetched = (await graphql(filesQ, { id: target.id, filenames: toFetch })).theme.files.nodes;
for (const f of fetched) {
  const content = f.body?.content || '';
  console.log('\n========================================');
  console.log(`FILE: ${f.filename}  (${content.length} chars)`);
  console.log('========================================');
  // For CSS files, grep for button-related selectors.
  if (f.filename.endsWith('.css') || f.filename.endsWith('.css.liquid')) {
    const lines = content.split('\n');
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      if (/\.(btn|button)[\s\.{,:]/i.test(lines[i])) {
        out.push(lines.slice(i, Math.min(i + 12, lines.length)).join('\n'));
      }
    }
    console.log(out.slice(0, 30).join('\n---\n') || '(no button selectors found)');
  } else {
    // For Liquid files, grep around 'button'/'btn' classes.
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (/class=["'][^"']*\b(button|btn)\b/.test(lines[i])) {
        console.log(`L${i+1}: ${lines[i].trim()}`);
      }
    }
  }
}
