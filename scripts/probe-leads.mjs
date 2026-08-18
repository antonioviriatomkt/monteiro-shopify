// One-off probe: list Sender groups + test Shopify customer read access.
import { paginate } from './sender-lib.mjs';
import { graphql } from './lib.mjs';

// --- Sender groups ---
console.log('=== SENDER GROUPS ===');
try {
  const groups = await paginate('/groups');
  console.log(`Total groups: ${groups.length}`);
  for (const g of groups) {
    console.log(`  ${g.id}  active=${String(g.active_subscribers ?? '?').padStart(5)}  "${g.title}"`);
  }
} catch (e) {
  console.log('Sender groups error: ' + e.message);
}

// --- Shopify customer read test ---
console.log('\n=== SHOPIFY CUSTOMER READ TEST ===');
try {
  const q = `query { customers(first: 3, sortKey: CREATED_AT, reverse: true) { edges { node { id email createdAt defaultAddress { country } } } } }`;
  const d = await graphql(q);
  console.log('OK customers read:', JSON.stringify(d.customers.edges.map(e => e.node), null, 2));
} catch (e) {
  console.log('Shopify customers error: ' + e.message.slice(0, 300));
}

// --- Shopify shop info (sanity) ---
console.log('\n=== SHOPIFY SHOP ===');
try {
  const d = await graphql(`query { shop { name myshopifyDomain } }`);
  console.log(JSON.stringify(d.shop));
} catch (e) {
  console.log('Shopify shop error: ' + e.message.slice(0, 200));
}
