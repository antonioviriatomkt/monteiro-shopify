// Turn Shopify sample orders into B2B lead rows, using the same qualification
// rules as the Sender path (scripts/pull-leads.mjs).
//
// WHY THIS EXISTS: sample-order customers usually have no marketing opt-in, so
// they never land in a Sender group. A Sender-only pull silently misses them --
// that is how #mf1501 (Van der Valk Design) went unrecorded until the 22 Sep
// reconciliation. The daily and weekly jobs now feed orders through here.
//
// This repo has no Shopify Admin API token (see CLAUDE.md -- the custom-app
// token was retired 2026-09-14), so the ORDERS ARE NOT FETCHED HERE. The caller
// pulls them with the Shopify MCP connector and pipes the JSON in on stdin.
//
// Usage:
//   <orders JSON> | node scripts/filter-orders.mjs <startISO> <endISO>
//
// Accepts, on stdin, any of:
//   { "orders": [ ... ] }                 <- list-orders tool output
//   { "data": { "orders": { "nodes": [...] } } }   <- graphql_query output
//   [ ... ]                               <- a bare array
//
// Each order may use either shape:
//   { name, createdAt, customerEmail, customerName, totalPrice, tags,
//     shippingAddress: { city, country } }
//   { name, createdAt, totalPriceSet: { shopMoney: { amount } },
//     customer: { email, firstName, lastName, defaultAddress: { city, country } } }
//
// Prints { window, count, rows: [...] } with the same row shape pull-leads.mjs
// emits, plus `order` (e.g. "#mf1501") and `city`, and a `skipped` list so the
// caller can see and report what was dropped and why.

import { professionalDomain } from './leads-lib.mjs';

const start = process.argv[2];
const end = process.argv[3];
if (!start || !end) {
  console.error('Usage: <orders JSON on stdin> | node scripts/filter-orders.mjs <startISO> <endISO>');
  process.exit(2);
}
const startD = new Date(start + 'T00:00:00');
const endD = new Date(end + 'T23:59:59');

const raw = await new Promise((resolve, reject) => {
  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => (buf += d));
  process.stdin.on('end', () => resolve(buf));
  process.stdin.on('error', reject);
});
if (!raw.trim()) {
  console.error('No JSON on stdin. Pipe the Shopify orders payload in.');
  process.exit(2);
}

let parsed;
try {
  parsed = JSON.parse(raw);
} catch (e) {
  console.error('stdin is not valid JSON: ' + e.message);
  process.exit(2);
}

const orders =
  (Array.isArray(parsed) && parsed) ||
  parsed.orders?.nodes ||
  (Array.isArray(parsed.orders) && parsed.orders) ||
  parsed.data?.orders?.nodes ||
  null;
if (!orders) {
  console.error('Could not find an order list in the payload (looked for orders / orders.nodes / data.orders.nodes).');
  process.exit(2);
}

function emailOf(o) {
  return (o.customerEmail || o.customer?.email || '').trim().toLowerCase();
}
function nameOf(o) {
  if (o.customerName) return o.customerName;
  const n = [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(' ');
  return n || null;
}
function totalOf(o) {
  const t = o.totalPrice ?? o.totalPriceSet?.shopMoney?.amount;
  return t == null ? null : Number(t);
}
function addressOf(o) {
  return o.shippingAddress || o.customer?.defaultAddress || {};
}

const rows = [];
const skipped = [];
for (const o of orders) {
  const order = o.name || null;
  const created = o.createdAt || null;
  const d = created ? new Date(created) : null;
  if (!d || isNaN(d) || d < startD || d > endD) continue; // outside the window

  const total = totalOf(o);
  if (total !== 0) { // sample orders are the EUR 0.00 ones
    skipped.push({ order, created, reason: `not a sample order (total ${total})` });
    continue;
  }

  const email = emailOf(o);
  if (!email) {
    skipped.push({ order, created, reason: 'no customer email' });
    continue;
  }

  // Shopify auto-cancels personal-email sample orders and tags them; treat the
  // tag as authoritative even if the domain is not on the blocklist.
  const tags = (o.tags || []).map((t) => String(t).toLowerCase());
  if (tags.includes('auto-cancel-personal-email')) {
    skipped.push({ order, created, email, reason: 'tagged auto-cancel-personal-email' });
    continue;
  }

  const domain = professionalDomain(email);
  if (!domain) {
    skipped.push({ order, created, email, reason: 'free/personal email domain' });
    continue;
  }

  const addr = addressOf(o);
  rows.push({
    nome: domain,
    email,
    name: nameOf(o),
    company: null,
    country: addr.country || null,
    city: addr.city || null,
    canal: 'Sample order (Shopify)',
    canalKind: 'order',
    order,
    created,
  });
}

rows.sort((a, b) => (a.created || '').localeCompare(b.created || ''));
console.log(JSON.stringify({ window: { start, end }, count: rows.length, rows, skipped }, null, 2));
