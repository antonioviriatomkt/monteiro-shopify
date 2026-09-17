// Pull qualifying B2B leads (professional email only) from Sender for a date window.
// Usage: node scripts/pull-leads.mjs <startISO> <endISO>
// Dates inclusive, compared on subscriber "created" (account local time as stored).
import { paginate } from './sender-lib.mjs';

const start = process.argv[2] || '2026-06-01';
const end = process.argv[3] || '2026-06-08';
const startD = new Date(start + 'T00:00:00');
const endD = new Date(end + 'T23:59:59');

const FREE = new Set([
  'gmail.com','googlemail.com','hotmail.com','hotmail.fr','hotmail.co.uk','hotmail.de','hotmail.it','hotmail.es',
  'outlook.com','outlook.fr','outlook.de','live.com','live.fr','live.nl','msn.com',
  'yahoo.com','yahoo.fr','yahoo.co.uk','yahoo.de','yahoo.es','yahoo.it','ymail.com',
  'icloud.com','me.com','mac.com','aol.com','gmx.com','gmx.de','gmx.net','gmx.at','gmx.ch','gmx.fr',
  'web.de','t-online.de','centrum.cz','seznam.cz','email.cz','proton.me','protonmail.com','pm.me',
  'mail.com','yandex.com','yandex.ru','qq.com','163.com','126.com','naver.com','sina.com',
  'free.fr','orange.fr','wanadoo.fr','sfr.fr','laposte.net','neuf.fr','bbox.fr','numericable.fr',
  'sapo.pt','netcabo.pt','clix.pt','iol.pt','bluewin.ch','sunrise.ch','telenet.be','skynet.be',
  'libero.it','virgilio.it','alice.it','tin.it','tiscali.it','terra.es','telefonica.net',
]);

function canalFor(title) {
  const t = title.trim();
  // Umbrella group every technical-file download lands in, whatever the collection
  // or the language variant of the collection group. Kept as a fallback so a lead
  // is never dropped when its collection-specific group is missing or oddly named.
  if (/^download\s+technical\s+file/i.test(t)) {
    return { kind: 'tfgen', label: 'TF Download' };
  }
  // Collection groups: "OCEAN DOWN TF", "Origin down FT", "ELECTRA down pt" (PT variant).
  if (/down\s*(tf|ft|pt)\b/i.test(t)) {
    const coll = t.replace(/\s*down\s*(tf|ft|pt).*/i, '').trim();
    return { kind: 'tf', label: `TF Download: ${coll.charAt(0).toUpperCase()}${coll.slice(1).toLowerCase()}` };
  }
  if (/^contact form/i.test(t)) return { kind: 'contact', label: 'Contact form (Shopify customer create)' };
  if (/^shopify:\s*form|shopify-forms/i.test(t)) return { kind: 'shopify', label: 'Shopify Form (contact)' };
  return null;
}
// canal priority for a lead present in multiple groups
// (named collection beats the umbrella TF group, which beats the form groups)
const RANK = { tf: 4, tfgen: 3, contact: 2, shopify: 1 };

function col(sub, name) {
  const c = (sub.columns || []).find(c => (c.title||'').toLowerCase() === name.toLowerCase() && c.value);
  return c?.value || null;
}
function country(sub) {
  const c = col(sub, 'country');
  if (c) return c.trim();
  const loc = (sub.location || '').trim();
  if (!loc) return null;
  const i = loc.lastIndexOf(',');
  return (i >= 0 ? loc.slice(i+1) : loc).trim() || null;
}

const groups = await paginate('/groups');
const relevant = groups.filter(g => canalFor(g.title));

const byEmail = new Map();
for (const g of relevant) {
  const canal = canalFor(g.title);
  let list = [];
  try { list = await paginate(`/groups/${g.id}/subscribers`); }
  catch (e) { if (e.message.includes('no active subscribers')) continue; else continue; }
  for (const s of list) {
    const created = new Date((s.created || '').replace(' ', 'T'));
    if (isNaN(created) || created < startD || created > endD) continue;
    const email = (s.email || '').toLowerCase();
    if (!email.includes('@')) continue;
    const domain = email.split('@')[1];
    if (FREE.has(domain)) continue; // professional emails only
    const cur = byEmail.get(email);
    if (!cur) {
      byEmail.set(email, {
        nome: domain, email, name: [s.firstname, s.lastname].filter(Boolean).join(' ') || null,
        company: col(s, 'company'), country: country(s),
        canal: canal.label, canalKind: canal.kind, created: s.created,
      });
    } else if (RANK[canal.kind] > RANK[cur.canalKind]) {
      cur.canal = canal.label; cur.canalKind = canal.kind;
    }
  }
}
const rows = [...byEmail.values()].sort((a,b)=>(a.created||'').localeCompare(b.created||''));
console.log(JSON.stringify({ window: { start, end }, count: rows.length, rows }, null, 2));
