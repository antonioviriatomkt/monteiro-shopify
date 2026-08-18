// Verifies the access token can read the shop and lists current API access scopes.

import { graphql, API_VERSION, loadCreds } from './lib.mjs';

const query = `
  query Sanity {
    shop {
      name
      primaryDomain { host }
      myshopifyDomain
    }
    currentAppInstallation {
      accessScopes { handle }
    }
  }
`;

const { shop } = loadCreds();
console.log(`Pinging ${shop} via Admin GraphQL API ${API_VERSION}...`);
const data = await graphql(query);
console.log('Shop name:    ', data.shop.name);
console.log('Primary host: ', data.shop.primaryDomain.host);
console.log('myshopify:    ', data.shop.myshopifyDomain);
console.log('Granted scopes:');
for (const s of data.currentAppInstallation.accessScopes) {
  console.log('  -', s.handle);
}
