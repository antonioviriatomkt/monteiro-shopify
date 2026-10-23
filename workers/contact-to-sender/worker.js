/**
 * contact-to-sender — Cloudflare Worker (account: Viriato, d588850e…) — v2, 2026-10-23
 *
 * The theme's `contact-block` (native Shopify {% form 'contact' %}) only emails the store.
 * This Worker receives a copy of each submission (navigator.sendBeacon from the theme) and
 *   1. writes it to Supabase (`signals_lead_events`, via the RPC `signals_ingest_lead`) — the
 *      system of record for leads since v2, with the PostHog id + entry UTMs the theme sends;
 *   2. upserts the person into Sender group `enzoW5` — marketing copy only (best-effort).
 * The response is 200 as soon as Supabase accepted the row; a Sender failure is logged, not fatal.
 *
 * Secrets / vars (Cloudflare dashboard → Worker → Settings → Variables):
 *   SUPABASE_URL          (var)     https://btlkcbilpsjtyiqwnsal.supabase.co
 *   SUPABASE_ANON_KEY     (var)     the project's publishable key (sb_publishable_…) — public, not a secret
 *   SUPABASE_INGEST_KEY   (secret)  = Vault secret `signals_ingest_key` (checked inside the RPC)
 *   SENDER_TOKEN          (secret)  Sender API token
 *   GROUP_ID              (var)     default enzoW5
 *
 * Sender behaviour verified 2026-10-02: POST /v2/subscribers upserts and MERGES custom fields;
 * phone must be E.164 or the call fails; text fields over ~1000 chars are silently dropped; an
 * existing non-active subscriber is only added to the group, never re-upserted.
 */

const ALLOWED_ORIGINS = [
  'https://www.monteirofabrics.com',
  'https://monteirofabrics.com',
  'https://monteiro-fabrics.myshopify.com',
];
const SENDER = 'https://api.sender.net/v2';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PH_KEYS = ['ph_distinct_id', 'ph_session_id', 'ph_utm_source', 'ph_utm_medium', 'ph_utm_campaign',
  'ph_utm_term', 'ph_utm_content', 'ph_gclid', 'ph_referrer', 'ph_landing'];

// Light per-isolate rate limit: 5 submissions / 10 min / IP.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < 600000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 5;
}

const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

function e164(raw) {
  if (!raw) return '';
  let p = raw.replace(/[\s().-]/g, '');
  if (p.startsWith('00')) p = '+' + p.slice(2);
  return /^\+[1-9]\d{6,14}$/.test(p) ? p : '';
}

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

async function toSupabase(env, d, email, request) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY || !env.SUPABASE_INGEST_KEY) return 'not configured';
  const payload = {
    kind: d.kind === 'technical_file' ? 'technical_file' : 'contact_form',
    email,
    name: clip(d.name, 120), company: clip(d.company, 200), country: clip(d.country, 100),
    sector: clip(d.sector, 100), phone: clip(d.phone, 40), message: clip(d.message, 4000),
    page: clip(d.page, 300), locale: clip(d.locale, 10),
    ip_country: request.cf && request.cf.country ? String(request.cf.country) : '',
    user_agent: clip(request.headers.get('User-Agent') || '', 300),
  };
  for (const k of PH_KEYS) if (clip(d[k], 300)) payload[k] = clip(d[k], 300);
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/signals_ingest_lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: env.SUPABASE_ANON_KEY },
    body: JSON.stringify({ key: env.SUPABASE_INGEST_KEY, payload }),
  });
  if (!r.ok) throw new Error(`supabase ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return 'ok';
}

async function toSender(env, d, email, phoneRaw, phone) {
  const name = clip(d.name, 120);
  const [firstname, ...rest] = name.split(/\s+/);
  let message = clip(d.message, 2000);
  if (phoneRaw && !phone) message = `Phone: ${phoneRaw}\n\n${message}`;
  const page = clip(d.page, 300);
  if (page) message = `${message}\n\n— sent from ${page}`;
  message = message.slice(0, 1000);

  const fields = {};
  if (clip(d.company, 200)) fields['{$company}'] = clip(d.company, 200);
  if (clip(d.country, 100)) fields['{$country}'] = clip(d.country, 100);
  if (clip(d.sector, 100)) fields['{$industry}'] = clip(d.sector, 100);
  if (message) fields['{$message}'] = message;

  const group = env.GROUP_ID || 'enzoW5';
  const auth = { Authorization: `Bearer ${env.SENDER_TOKEN}`, 'Content-Type': 'application/json', Accept: 'application/json' };

  const look = await fetch(`${SENDER}/subscribers/${encodeURIComponent(email)}`, { headers: auth });
  if (look.ok) {
    const s = (await look.json()).data;
    if (s && s.status && s.status.email !== 'active') {
      const r = await fetch(`${SENDER}/subscribers/groups/${group}`, { method: 'POST', headers: auth, body: JSON.stringify({ subscribers: [email] }) });
      return r.ok ? 'ok (group only)' : `sender ${r.status}`;
    }
  }
  const body = { email, groups: [group], fields, trigger_automation: false };
  if (firstname) body.firstname = firstname;
  if (rest.length) body.lastname = rest.join(' ');
  if (phone) body.phone = phone;
  let r = await fetch(`${SENDER}/subscribers`, { method: 'POST', headers: auth, body: JSON.stringify(body) });
  if (!r.ok && body.phone) {
    delete body.phone;
    fields['{$message}'] = `Phone: ${phoneRaw}\n\n${fields['{$message}'] || ''}`.slice(0, 1000);
    r = await fetch(`${SENDER}/subscribers`, { method: 'POST', headers: auth, body: JSON.stringify(body) });
  }
  if (!r.ok) throw new Error(`sender ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return 'ok';
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const h = cors(origin);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    if (request.method !== 'POST') return new Response('ok', { status: 200, headers: h });
    if (!ALLOWED_ORIGINS.includes(origin)) return new Response('forbidden', { status: 403, headers: h });

    const ip = request.headers.get('CF-Connecting-IP') || 'x';
    if (limited(ip)) return new Response('slow down', { status: 429, headers: h });

    let d;
    try { d = JSON.parse(await request.text()); } catch { return new Response('bad json', { status: 400, headers: h }); }

    // Honeypot: bots fill it, people never see it. Pretend success.
    if (d.website) return new Response('ok', { status: 200, headers: h });

    const email = clip(d.email, 254).toLowerCase();
    if (!EMAIL_RE.test(email)) return new Response('bad email', { status: 400, headers: h });
    const phoneRaw = clip(d.phone, 40);
    const phone = e164(phoneRaw);

    // 1. System of record.
    let supa = 'error';
    try { supa = await toSupabase(env, d, email, request); }
    catch (err) { console.log('supabase', String(err)); }

    // 2. Marketing copy, after the response (never delays the visitor).
    ctx.waitUntil(toSender(env, d, email, phoneRaw, phone)
      .then(s => console.log('sender', s))
      .catch(err => console.log('sender', String(err))));

    return new Response(supa === 'ok' ? 'ok' : 'stored?', { status: supa === 'ok' ? 200 : 502, headers: h });
  },
};
