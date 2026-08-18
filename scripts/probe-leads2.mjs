// Probe subscriber shape + recent new leads with channel attribution (Sender-only).
import { paginate, api } from './sender-lib.mjs';

// Raw sample from a TF group and a contact group
for (const gid of ['bDY4qx', 'enzoW5']) {
  try {
    const list = await paginate(`/groups/${gid}/subscribers`, {}, { perPage: 5, maxPages: 1 });
    console.log(`\n=== RAW SAMPLE from group ${gid} (showing 1) ===`);
    console.log(JSON.stringify(list[0], null, 2).slice(0, 1200));
  } catch (e) { console.log(`group ${gid}: ${e.message.slice(0,150)}`); }
}

// Build relevant group map
const groups = await paginate('/groups');
function canalFor(title) {
  const t = title.trim();
  if (/down\s*tf|down\s*ft/i.test(t)) {
    const coll = t.replace(/\s*down\s*(tf|ft).*/i, '').trim();
    return `TF Download: ${coll.charAt(0).toUpperCase()}${coll.slice(1).toLowerCase()}`;
  }
  if (/^contact form/i.test(t)) return 'Contact form (Shopify customer create)';
  if (/^shopify:\s*form|shopify-forms/i.test(t)) return 'Shopify Form (contact)';
  return null;
}
const relevant = groups.filter(g => canalFor(g.title));
console.log(`\n=== RELEVANT GROUPS (${relevant.length}) ===`);
for (const g of relevant) console.log(`  ${g.id}  active=${g.active_subscribers}  "${g.title}"  -> ${canalFor(g.title)}`);

// Pull subscribers from relevant groups, find those created in last 10 days
const now = new Date();
const cutoff = new Date(now.getTime() - 10 * 864e5);
const byEmail = new Map();
for (const g of relevant) {
  let list = [];
  try { list = await paginate(`/groups/${g.id}/subscribers`); }
  catch (e) { if (e.message.includes('no active subscribers')) continue; else { console.log(`err ${g.id}: ${e.message.slice(0,100)}`); continue; } }
  for (const s of list) {
    const created = new Date((s.created || '').replace(' ', 'T'));
    if (isNaN(created) || created < cutoff) continue;
    const key = (s.email || '').toLowerCase();
    if (!byEmail.has(key)) byEmail.set(key, { email: s.email, created: s.created, location: s.location, canals: new Set() });
    byEmail.get(key).canals.add(canalFor(g.title));
  }
}
console.log(`\n=== NEW SUBSCRIBERS (last 10 days) across relevant groups: ${byEmail.size} ===`);
for (const r of [...byEmail.values()].sort((a,b)=>(b.created||'').localeCompare(a.created||''))) {
  console.log(`  ${r.created}  ${r.email}  | ${r.location||'-'} | ${[...r.canals].join(', ')}`);
}
