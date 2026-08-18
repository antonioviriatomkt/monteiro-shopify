// Lists the companies that downloaded MEDIFLEX and ELECTRA technical files.
// Extracts the "company" column from each subscriber (custom field).

import fs from 'node:fs';
import { paginate } from './sender-lib.mjs';

const GROUPS = {
  MEDIFLEX: [{ id: 'bDY4qx', label: 'Mediflex down TF' }],
  ELECTRA:  [
    { id: 'bWoJvE', label: 'ELECTRA down FT' },
    { id: 'eXpKwv', label: 'ELECTRA down pt' },
  ],
};

function getCompany(sub) {
  if (!sub.columns) return null;
  const col = sub.columns.find(
    (c) => (c.title || '').toLowerCase() === 'company' && c.value,
  );
  return col?.value || null;
}

function getCountry(sub) {
  const loc = (sub.location || '').trim();
  if (!loc) return null;
  const idx = loc.lastIndexOf(',');
  return (idx >= 0 ? loc.slice(idx + 1) : loc).trim() || null;
}

async function gatherFor(product) {
  const seen = new Map();
  for (const g of GROUPS[product]) {
    try {
      const list = await paginate(`/groups/${g.id}/subscribers`);
      for (const s of list) if (!seen.has(s.id)) seen.set(s.id, s);
    } catch (err) {
      if (err.message.includes('no active subscribers')) continue;
      throw err;
    }
  }
  return [...seen.values()].filter((s) => s.status?.email === 'active' && !s.unsubscribed_at && !s.bounced_at);
}

const mediflex = await gatherFor('MEDIFLEX');
const electra  = await gatherFor('ELECTRA');

function summarize(subs, productLabel) {
  const rows = subs.map((s) => ({
    company: getCompany(s),
    country: getCountry(s) || '—',
    name:    [s.firstname, s.lastname].filter(Boolean).join(' ') || '',
    email:   s.email,
    created: (s.created || '').split(' ')[0],
  }));
  const withCompany    = rows.filter((r) => r.company);
  const withoutCompany = rows.filter((r) => !r.company);
  const sorted = [...withCompany, ...withoutCompany].sort((a, b) => (b.created || '').localeCompare(a.created || ''));

  console.log(`\n=== ${productLabel} — ${rows.length} downloaders (${withCompany.length} with a company name) ===`);
  const cWidth = Math.max(7, ...sorted.map((r) => (r.company || '—').length));
  const cnWidth = Math.max(7, ...sorted.map((r) => r.country.length));
  console.log(`  ${'Company'.padEnd(cWidth)}  ${'Country'.padEnd(cnWidth)}  ${'Date'.padEnd(10)}  Contact`);
  console.log(`  ${'-'.repeat(cWidth)}  ${'-'.repeat(cnWidth)}  ${'-'.repeat(10)}  -------`);
  for (const r of sorted) {
    const company = (r.company || '—').slice(0, cWidth);
    const contact = `${r.name || ''} <${r.email}>`.trim();
    console.log(`  ${company.padEnd(cWidth)}  ${r.country.padEnd(cnWidth)}  ${(r.created || '').padEnd(10)}  ${contact}`);
  }
  return rows;
}

const mediflexRows = summarize(mediflex, 'MEDIFLEX');
const electraRows  = summarize(electra,  'ELECTRA');

const outPath = new URL('../data/sender-downloaders.json', import.meta.url);
fs.writeFileSync(outPath, JSON.stringify({
  generated_at: new Date().toISOString(),
  mediflex: mediflexRows,
  electra:  electraRows,
}, null, 2));
console.log(`\nFull list saved to data/sender-downloaders.json`);
