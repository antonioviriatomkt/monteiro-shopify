// Per-collection content pass for sector collections: cleans leaked CSS/meta
// junk from each description and appends a sector-specific performance line.
// Idempotent — re-running replaces the Performance line rather than duplicating.
// NOTE: collection descriptions are LIVE store data (not theme-scoped).
import { graphql } from './lib.mjs';

// handle -> performance descriptors (property-based, no unverified standard numbers)
const PERF = {
  'hospitality-fabrics': 'high-traffic abrasion · stain-resistant · flame-retardant · easy to clean',
  'office-fabrics-upholstery': 'durability · abrasion-resistant · stain-resistant · easy to clean',
  'public-spaces': 'heavy-duty abrasion · flame-retardant · stain & scratch resistant · easy to clean',
  'restaurants-fabrics': 'stain & grease resistant · easy to clean · flame-retardant · abrasion-resistant',
  'retail': 'abrasion-resistant · stain-resistant · colour-fast · easy to clean',
  'residential-1': 'soft-touch · stain-resistant · easy to clean · durable',
  'fitness-1': 'antimicrobial · sweat & oil resistant · easy to clean · abrasion-resistant',
  'fashion': 'soft-touch · flexible · colour-fast · durable',
  'outdoor': 'UV-resistant · water-repellent · mildew-resistant · easy to clean',
  'marine': 'UV-resistant · salt & water resistant · mildew-resistant · flame-retardant',
  'automotive': 'abrasion-resistant · UV-resistant · flame-retardant · easy to clean',
  'motorcycle': 'UV-resistant · water-repellent · abrasion-resistant · weather-resistant',
  'aviation': 'flame-retardant · lightweight · abrasion-resistant · easy to clean',
  'mass-transportation': 'transport fire-rated · heavy-duty abrasion · stain-resistant · easy to clean',
  'recreational-vehicles': 'UV-resistant · water-repellent · abrasion-resistant · easy to clean',
};

function clean(html) {
  if (!html) return '';
  return html
    .replace(/<meta[^>]*>/gi, '')                 // strip stray <meta charset> tags
    .replace(/\sclass=("[^"]*"|'[^']*')/gi, '')    // strip leaked Tailwind/junk classes
    .replace(/<p>\s*<strong>\s*Performance:[\s\S]*$/i, '') // drop any prior Performance line (idempotent)
    .replace(/(\s*<p>\s*<\/p>)+\s*$/i, '')         // trim trailing empty paragraphs
    .trim();
}

const handles = Object.keys(PERF);
const queryStr = handles.map((h) => `handle:${h}`).join(' OR ');
const q = `query($q:String!){ collections(first:30, query:$q){ nodes { id handle title descriptionHtml } } }`;
const nodes = (await graphql(q, { q: queryStr })).collections.nodes;
const byHandle = Object.fromEntries(nodes.map((n) => [n.handle, n]));

const mutation = `
  mutation($input: CollectionInput!) {
    collectionUpdate(input: $input) {
      collection { handle }
      userErrors { field message }
    }
  }`;

let ok = 0;
for (const handle of handles) {
  const node = byHandle[handle];
  if (!node) { console.log(`✗ ${handle} — NOT FOUND`); continue; }
  const cleaned = clean(node.descriptionHtml);
  const perf = `<p><strong>Performance:</strong> ${PERF[handle]}.</p>`;
  const descriptionHtml = cleaned ? `${cleaned}${perf}` : perf;
  const hadJunk = /class=|<meta/i.test(node.descriptionHtml || '');
  const res = (await graphql(mutation, { input: { id: node.id, descriptionHtml } })).collectionUpdate;
  if (res.userErrors.length) { console.log(`✗ ${handle} —`, JSON.stringify(res.userErrors)); continue; }
  ok++;
  console.log(`✓ ${node.title.padEnd(22)} (${handle}) — ${hadJunk ? 'cleaned junk + ' : ''}added performance line`);
}
console.log(`\nDone: ${ok}/${handles.length} sectors updated.`);
