// Creates a Reseller metaobject entry for each partner in data/resellers.json.
// Idempotent: skips entries that already exist (matched by handle).
// Saves each entry's GID back into data/resellers.json under `metaobject_id`.

import fs from 'node:fs';
import { graphql } from './lib.mjs';

const DATA_FILE = new URL('../data/resellers.json', import.meta.url);

const existingQuery = `
  query Existing($type: String!) {
    metaobjects(type: $type, first: 50) {
      nodes { id handle displayName }
    }
  }
`;

const createMutation = `
  mutation Create($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
      metaobject {
        id
        handle
        displayName
        type
        fields { key value type }
      }
      userErrors { field message code }
    }
  }
`;

const resellers = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

const existing = await graphql(existingQuery, { type: 'reseller' });
const byHandle = Object.fromEntries(existing.metaobjects.nodes.map((n) => [n.handle, n]));

for (const r of resellers) {
  if (byHandle[r.key]) {
    console.log(`Skipping ${r.name} (handle "${r.key}" already exists: ${byHandle[r.key].id})`);
    r.metaobject_id = byHandle[r.key].id;
    fs.writeFileSync(DATA_FILE, JSON.stringify(resellers, null, 2) + '\n');
    continue;
  }
  if (!r.logo_file_id) {
    console.error(`Skipping ${r.name} — no logo_file_id. Run upload-logos.mjs first.`);
    continue;
  }

  const variables = {
    metaobject: {
      type: 'reseller',
      handle: r.key,
      capabilities: { publishable: { status: 'ACTIVE' } },
      fields: [
        { key: 'logo',    value: r.logo_file_id },
        { key: 'name',    value: r.name },
        { key: 'country', value: r.country },
        { key: 'website', value: r.website },
      ],
    },
  };

  const data = await graphql(createMutation, variables);
  const result = data.metaobjectCreate;
  if (result.userErrors.length) {
    console.error(`Errors creating ${r.name}:`, JSON.stringify(result.userErrors, null, 2));
    continue;
  }
  r.metaobject_id = result.metaobject.id;
  console.log(`Created ${r.name} → ${r.metaobject_id}`);
  fs.writeFileSync(DATA_FILE, JSON.stringify(resellers, null, 2) + '\n');
}
console.log('\nDone.');
