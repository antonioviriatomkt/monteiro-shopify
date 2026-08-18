// Pulls all subscribers from the MEDIFLEX and ELECTRA download groups,
// extracts each subscriber's country from `location` (format "City, Country"),
// and prints a ranked breakdown per product and combined.

import fs from 'node:fs';
import { paginate } from './sender-lib.mjs';

const GROUPS = {
  MEDIFLEX: [
    { id: 'bDY4qx', label: 'Mediflex down TF' },
  ],
  ELECTRA: [
    { id: 'bWoJvE', label: 'ELECTRA down FT' },
    { id: 'eXpKwv', label: 'ELECTRA down pt' },
  ],
};

function parseCountry(location) {
  if (!location) return null;
  const trimmed = String(location).trim();
  if (!trimmed) return null;
  // Format observed: "City, Country" or ", Country" or just "Country"
  const lastComma = trimmed.lastIndexOf(',');
  const country = lastComma >= 0 ? trimmed.slice(lastComma + 1).trim() : trimmed;
  return country || null;
}

async function fetchAllForProduct(product) {
  const groups = GROUPS[product];
  const subs = new Map(); // dedupe by subscriber id
  for (const g of groups) {
    console.error(`  fetching ${g.label} (${g.id})...`);
    let list = [];
    try {
      list = await paginate(`/groups/${g.id}/subscribers`);
    } catch (err) {
      if (err.message.includes('no active subscribers')) {
        console.error(`    (group has no active subscribers, skipping)`);
        continue;
      }
      throw err;
    }
    for (const s of list) {
      if (!subs.has(s.id)) subs.set(s.id, s);
    }
    console.error(`    +${list.length} subs (${subs.size} unique so far)`);
  }
  return [...subs.values()];
}

function tallyByCountry(subs) {
  const tally = new Map();
  let unknown = 0;
  for (const s of subs) {
    // Only count active subscribers (skip bounced/unsubscribed).
    if (s.status?.email !== 'active') continue;
    if (s.unsubscribed_at || s.bounced_at) continue;
    const country = parseCountry(s.location);
    if (!country) { unknown++; continue; }
    tally.set(country, (tally.get(country) || 0) + 1);
  }
  const ranked = [...tally.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([country, count]) => ({ country, count }));
  return { ranked, unknown, total: subs.length };
}

function printTable(title, { ranked, unknown, total }) {
  console.log(`\n=== ${title} ===`);
  console.log(`Subscribers in groups: ${total}   Unknown country: ${unknown}`);
  const width = Math.max(8, ...ranked.map((r) => r.country.length));
  console.log(`  ${'Country'.padEnd(width)}  Count`);
  console.log(`  ${'-'.repeat(width)}  -----`);
  for (const r of ranked) {
    console.log(`  ${r.country.padEnd(width)}  ${String(r.count).padStart(5)}`);
  }
}

console.error('Fetching MEDIFLEX...');
const mediflex = await fetchAllForProduct('MEDIFLEX');
console.error('\nFetching ELECTRA...');
const electra  = await fetchAllForProduct('ELECTRA');

const mediflexTally = tallyByCountry(mediflex);
const electraTally  = tallyByCountry(electra);

const combinedMap = new Map();
for (const { country, count } of mediflexTally.ranked) {
  combinedMap.set(country, (combinedMap.get(country) || 0) + count);
}
for (const { country, count } of electraTally.ranked) {
  combinedMap.set(country, (combinedMap.get(country) || 0) + count);
}
const combinedRanked = [...combinedMap.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([country, count]) => ({ country, count }));

printTable('MEDIFLEX downloads by country', mediflexTally);
printTable('ELECTRA downloads by country',  electraTally);
printTable('Combined (Mediflex + Electra)', {
  ranked: combinedRanked,
  unknown: mediflexTally.unknown + electraTally.unknown,
  total:   mediflexTally.total   + electraTally.total,
});

// Save a JSON snapshot
const out = {
  generated_at: new Date().toISOString(),
  mediflex: mediflexTally,
  electra:  electraTally,
  combined: { ranked: combinedRanked },
};
const outPath = new URL('../data/sender-downloads-by-country.json', import.meta.url);
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`\nSnapshot saved to data/sender-downloads-by-country.json`);
