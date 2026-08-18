// Augments the Help & Contact (FAQ) template: fetches the live template from the
// CLAUDE_MF_JUNE_PROPOSTA theme, tweaks the intro, and appends a contact block
// (enquiry form + by-email) so the page delivers on "Help & Contact".
// Writes the result to theme/templates/page.faq.json (deploy separately).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { graphql } from './lib.mjs';

const OUT = fileURLToPath(new URL('../theme/templates/page.faq.json', import.meta.url));
const THEME_NAME = 'CLAUDE_MF_JUNE_PROPOSTA';

const themes = (await graphql(`query { themes(first:50){ nodes { id name } } }`)).themes.nodes;
const theme = themes.find((t) => t.name === THEME_NAME);
if (!theme) throw new Error(`Theme ${THEME_NAME} not found`);

const q = `query($id:ID!){ theme(id:$id){ files(first:1, filenames:["templates/page.faq.json"]){ nodes { body { ... on OnlineStoreThemeFileBodyText { content } } } } } }`;
const raw = (await graphql(q, { id: theme.id })).theme.files.nodes[0].body.content;
const json = JSON.parse(raw.replace(/^\s*\/\*[\s\S]*?\*\//, ''));

// 1. Tweak the intro copy to point at the on-page form
const introKey = json.order[0];
if (json.sections[introKey] && json.sections[introKey].type === 'rich-text') {
  json.sections[introKey].settings.text =
    `<p>To get help as quickly as possible, start by browsing our Frequently Asked Questions below.</p><p>If your query isn’t covered, our customer service team is here — send us a message using the form at the bottom of this page, or reach us by phone and email <a href="/pages/contact" title="Contact us">here</a>.</p>`;
}

// 2. New contact sections (form reused from the contact page)
json.sections.help_contact_head = {
  type: 'rich-text',
  name: 'Contact heading',
  settings: {
    subheading: 'Still need help?', title: 'Talk to our team', title_size: 40, title_width: 24, heading_h1: false,
    text: `<p>Can’t find your answer above? Send us your enquiry and our specialists will get back to you as soon as possible.</p>`,
    image_width: 120, button_label: '', button_link: '', button_style: 'auto',
    text_alignment: 'center', enlarge_text: false, full_width: false, no_padding_bottom: true,
    color_scheme: 'standard', color_bg: '', color_text: '',
  },
};
json.sections.help_contact_form = {
  type: 'apps',
  blocks: {
    forms_inline_help: {
      type: 'shopify://apps/forms/blocks/inline/8744a304-fcb1-4347-b211-bb6b4759a76a',
      settings: {
        form_id: '278222', text_color: '#202020', button_background_color: '#202020',
        button_label_color: '#ffffff', links_color: '#1878b9', errors_color: '#e02229',
        text_alignment: 'center', form_alignment: 'center',
        padding_top: 0, padding_bottom: 0, padding_right: 0, padding_left: 0,
      },
    },
  },
  block_order: ['forms_inline_help'],
  settings: { skip_container: false },
};
json.sections.help_contact_email = {
  type: 'image-with-text',
  settings: {
    subheading: 'Contact us', title: 'By email', title_size: 28, title_width: 12,
    text: `<p>Whether you need a quotation request, orders, or a project in mind, we are here to help. Please email us at <strong>hello@monteirofabrics.com</strong> and we will get back to you as soon as possible.</p>`,
    button_label: '', button_link: '', text_alignment: 'center', text_width: 50, button_style: 'auto',
    image: 'shopify://shop_images/Monteiro_fabrics_customer_care_team.jpg', image_width: 100, image_position: 'right',
    media_size: 'cover', color_scheme: 'standard', color_bg: '', color_text: '',
  },
};

json.order.push('help_contact_head', 'help_contact_form', 'help_contact_email');

const header = `/*\n * ------------------------------------------------------------\n * IMPORTANT: The contents of this file are auto-generated.\n *\n * This file may be updated by the Shopify admin theme editor\n * or related systems. Please exercise caution as any changes\n * made to this file may be overwritten.\n * ------------------------------------------------------------\n */\n`;
fs.writeFileSync(OUT, header + JSON.stringify(json, null, 2) + '\n');
console.log('Wrote', OUT, '—', json.order.length, 'sections (added 3 contact sections)');
