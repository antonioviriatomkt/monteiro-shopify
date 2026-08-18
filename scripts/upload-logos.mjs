// Uploads each partner logo to Shopify Files and stores the resulting File GID
// back into data/resellers.json. Idempotent: skips entries that already have
// a `logo_file_id` set.

import fs from 'node:fs';
import path from 'node:path';
import { graphql } from './lib.mjs';

const DATA_FILE = new URL('../data/resellers.json', import.meta.url);
const LOGO_DIR  = new URL('../assets-source/logos/', import.meta.url);

const MIME = {
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.heic': 'image/heic',
};

const stagedMutation = `
  mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters { name value }
      }
      userErrors { field message }
    }
  }
`;

const fileCreateMutation = `
  mutation FileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
        id
        alt
        fileStatus
        ... on MediaImage {
          image { url width height }
        }
      }
      userErrors { field message code }
    }
  }
`;

async function uploadOne(reseller) {
  const filePath = new URL(reseller.logo_file, LOGO_DIR);
  const stat = fs.statSync(filePath);
  const ext = path.extname(reseller.logo_file).toLowerCase();
  const mime = MIME[ext];
  if (!mime) throw new Error(`Unknown mime for extension ${ext}`);

  console.log(`\nUploading ${reseller.name} (${reseller.logo_file}, ${stat.size}b, ${mime})...`);

  const staged = await graphql(stagedMutation, {
    input: [{
      filename: reseller.logo_file,
      mimeType: mime,
      fileSize: String(stat.size),
      httpMethod: 'POST',
      resource: 'IMAGE',
    }],
  });
  if (staged.stagedUploadsCreate.userErrors.length) {
    throw new Error('stagedUploadsCreate errors: ' + JSON.stringify(staged.stagedUploadsCreate.userErrors));
  }
  const target = staged.stagedUploadsCreate.stagedTargets[0];

  const form = new FormData();
  for (const { name, value } of target.parameters) form.append(name, value);
  const buffer = fs.readFileSync(filePath);
  form.append('file', new Blob([buffer], { type: mime }), reseller.logo_file);

  const uploadResp = await fetch(target.url, { method: 'POST', body: form });
  if (!uploadResp.ok) {
    throw new Error(`Staged upload failed ${uploadResp.status}: ${await uploadResp.text()}`);
  }

  const created = await graphql(fileCreateMutation, {
    files: [{
      alt: `${reseller.name} logo`,
      contentType: 'IMAGE',
      originalSource: target.resourceUrl,
    }],
  });
  if (created.fileCreate.userErrors.length) {
    throw new Error('fileCreate errors: ' + JSON.stringify(created.fileCreate.userErrors));
  }
  const file = created.fileCreate.files[0];
  console.log(`  → ${file.id}  (status: ${file.fileStatus})`);
  return file.id;
}

const resellers = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
for (const r of resellers) {
  if (r.logo_file_id) {
    console.log(`Skipping ${r.name} (already has logo_file_id).`);
    continue;
  }
  r.logo_file_id = await uploadOne(r);
  fs.writeFileSync(DATA_FILE, JSON.stringify(resellers, null, 2) + '\n');
}
console.log('\nDone.');
