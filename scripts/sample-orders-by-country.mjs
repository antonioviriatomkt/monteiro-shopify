// Aggregates sample orders by country from the Shopify orders CSV export.
// Uses Shipping Country (falls back to Billing Country if shipping is blank).

import fs from 'node:fs';

const CSV_PATH = '/Users/upscale/Desktop/orders_export_all.csv';

// Minimal RFC4180-ish CSV parser that handles quoted fields with embedded commas/newlines.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        rows.push(row); row = [];
      } else field += c;
    }
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((f) => f !== ''));
}

const text = fs.readFileSync(CSV_PATH, 'utf8');
const rows = parseCsv(text);
const header = rows[0];
const data = rows.slice(1);

const idx = (name) => header.indexOf(name);
const COL = {
  name:        idx('Name'),
  email:       idx('Email'),
  created:     idx('Created at'),
  lineitem:    idx('Lineitem name'),
  bCountry:    idx('Billing Country'),
  bCity:       idx('Billing City'),
  bCompany:    idx('Billing Company'),
  sCountry:    idx('Shipping Country'),
  sCity:       idx('Shipping City'),
};

console.log(`Parsed ${data.length} rows from CSV`);
console.log(`Header columns: ${header.length}\n`);

// Each row in the CSV is one line item; multiple rows per order share Order Name.
// Group by Order Name to count distinct orders, not line items.
const orders = new Map(); // orderName → { country, email, company, created, lineItems[] }
for (const r of data) {
  const orderName = r[COL.name];
  if (!orderName) continue;
  const country = (r[COL.sCountry] || r[COL.bCountry] || '').trim();
  if (!orders.has(orderName)) {
    orders.set(orderName, {
      orderName,
      country: country || '—',
      email:   r[COL.email],
      company: r[COL.bCompany],
      created: r[COL.created],
      lineItems: [],
    });
  }
  if (r[COL.lineitem]) orders.get(orderName).lineItems.push(r[COL.lineitem]);
}

const orderList = [...orders.values()];
console.log(`Distinct orders: ${orderList.length}\n`);

// Aggregate by country.
const tally = new Map();
let unknown = 0;
for (const o of orderList) {
  if (!o.country || o.country === '—') { unknown++; continue; }
  tally.set(o.country, (tally.get(o.country) || 0) + 1);
}
const ranked = [...tally.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([country, count]) => ({ country, count }));

const width = Math.max(8, ...ranked.map((r) => r.country.length));
console.log('=== Sample orders by country (ranked) ===');
console.log(`  ${'Country'.padEnd(width)}  Orders  Share`);
console.log(`  ${'-'.repeat(width)}  ------  -----`);
const totalKnown = ranked.reduce((s, r) => s + r.count, 0);
for (const r of ranked) {
  const pct = ((r.count / totalKnown) * 100).toFixed(1) + '%';
  console.log(`  ${r.country.padEnd(width)}  ${String(r.count).padStart(6)}  ${pct.padStart(5)}`);
}
console.log(`\nKnown-country orders: ${totalKnown}   Unknown: ${unknown}`);

// Snapshot
const outPath = new URL('../data/sample-orders-by-country.json', import.meta.url);
fs.writeFileSync(outPath, JSON.stringify({
  generated_at: new Date().toISOString(),
  total_orders: orderList.length,
  unknown_country: unknown,
  by_country: ranked,
}, null, 2));
console.log(`\nSaved to data/sample-orders-by-country.json`);
