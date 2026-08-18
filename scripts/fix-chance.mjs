// Cleans the CHANCE collection page: removes 4 disabled leftover sections and
// adds a closing CTA. Fetches the live template from the CLAUDE theme, transforms,
// writes theme/templates/page.chance-collection.json (deploy separately).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { graphql } from './lib.mjs';

const OUT = fileURLToPath(new URL('../theme/templates/page.chance-collection.json', import.meta.url));
const THEME_NAME = 'CLAUDE_MF_JUNE_PROPOSTA';
const FILE = 'templates/page.chance-collection.json';

const theme = (await graphql(`query{themes(first:50){nodes{id name}}}`)).themes.nodes.find((t) => t.name === THEME_NAME);
const q = `query($id:ID!){ theme(id:$id){ files(first:1, filenames:["${FILE}"]){ nodes { body { ... on OnlineStoreThemeFileBodyText { content } } } } } }`;
const raw = (await graphql(q, { id: theme.id })).theme.files.nodes[0].body.content;
const json = JSON.parse(raw.replace(/^\s*\/\*[\s\S]*?\*\//, ''));

// 1. Remove disabled leftover sections (old hero w/ Dropbox link, disabled product,
//    disabled collection, vegan overlay)
const DROP = [
  'b7839318-a0c6-4f6c-91c0-584b4fdfc2e2',
  'ea952254-6a3c-46c7-85e9-4b30d1d791d7',
  '3cdfb8c2-fb5d-4a4b-a072-7c7b6c5aa4d7',
  'aaf00dc3-3c35-40fa-a6c8-f822e9f9cc79',
];
for (const k of DROP) delete json.sections[k];
json.order = json.order.filter((k) => !DROP.includes(k));

// 2. Add a closing CTA band
json.sections.cta_close = {
  type: 'rich-text',
  name: 'Closing CTA',
  settings: {
    subheading: 'Bring Chance to your project',
    title: "Let's talk colour.",
    title_size: 44, title_width: 12, heading_h1: false,
    text: "<p>Specify Chance with confidence — order free samples, or talk to a specialist about your project.</p>",
    image_width: 120,
    button_label: 'Speak to a specialist',
    button_link: 'shopify://pages/contact',
    button_style: 'primary',
    text_alignment: 'center', enlarge_text: false, full_width: false, no_padding_bottom: false,
    color_scheme: 'custom', color_bg: '#f5f5f5', color_text: '',
  },
};
json.order.push('cta_close');

const header = `/*\n * ------------------------------------------------------------\n * IMPORTANT: The contents of this file are auto-generated.\n *\n * This file may be updated by the Shopify admin theme editor\n * or related systems. Please exercise caution as any changes\n * made to this file may be overwritten.\n * ------------------------------------------------------------\n */\n`;
fs.writeFileSync(OUT, header + JSON.stringify(json, null, 2) + '\n');
console.log('Wrote', OUT);
console.log('Removed', DROP.length, 'disabled sections; added closing CTA.');
console.log('Order:', json.order.join(' > '));
