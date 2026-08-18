// One-off: create the /pages/download-thank-you Shopify page and assign it
// to the page.download-thank-you template. Idempotent — if the page already
// exists by handle, it updates instead.

import { graphql } from './lib.mjs';

const HANDLE          = 'download-thank-you';
const TITLE           = 'Your download is starting';
const TEMPLATE_SUFFIX = 'download-thank-you';

const findQ = `
  query($q: String!) {
    pages(first: 5, query: $q) {
      nodes { id handle title templateSuffix isPublished }
    }
  }
`;

const createM = `
  mutation PageCreate($page: PageCreateInput!) {
    pageCreate(page: $page) {
      page { id title handle templateSuffix isPublished }
      userErrors { field message code }
    }
  }
`;

const updateM = `
  mutation PageUpdate($id: ID!, $page: PageUpdateInput!) {
    pageUpdate(id: $id, page: $page) {
      page { id title handle templateSuffix isPublished }
      userErrors { field message code }
    }
  }
`;

const existing = (await graphql(findQ, { q: `handle:${HANDLE}` })).pages.nodes.find((p) => p.handle === HANDLE);

if (existing) {
  console.log(`Page exists: ${existing.handle} (${existing.id}) — updating templateSuffix/isPublished`);
  const res = (await graphql(updateM, {
    id: existing.id,
    page: {
      title: TITLE,
      templateSuffix: TEMPLATE_SUFFIX,
      isPublished: true,
    },
  })).pageUpdate;
  if (res.userErrors.length){
    console.error('User errors:', JSON.stringify(res.userErrors, null, 2));
    process.exit(1);
  }
  console.log('Updated:', JSON.stringify(res.page, null, 2));
} else {
  const res = (await graphql(createM, {
    page: {
      title: TITLE,
      handle: HANDLE,
      templateSuffix: TEMPLATE_SUFFIX,
      isPublished: true,
    },
  })).pageCreate;
  if (res.userErrors.length){
    console.error('User errors:', JSON.stringify(res.userErrors, null, 2));
    process.exit(1);
  }
  console.log('Created:', JSON.stringify(res.page, null, 2));
}
