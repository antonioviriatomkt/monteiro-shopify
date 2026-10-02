/**
 * contact-to-sender — Cloudflare Worker (account: Viriato, d588850e…)
 *
 * The theme's `contact-block` (native Shopify {% form 'contact' %}) only emails the store.
 * This Worker receives a copy of each submission (navigator.sendBeacon from the theme)
 * and writes it to Sender, group `enzoW5` ("Contact form monteiro-fabrics.com"),
 * which is what the Leads report and pull-leads.mjs read.
 *
 * Secrets / vars (Cloudflare dashboard → Worker → Settings → Variables):
 *   SENDER_TOKEN  (secret)  Sender API token
 *   GROUP_ID      (var)     default enzoW5
 *
 * Behaviour verified against the Sender API on 2026-10-02:
 *   - POST /v2/subscribers upserts and MERGES custom fields (PATCH replaces them — not used).
 *   - phone must be E.164 or the whole request fails → sent only when it parses.
 *   - text fields over ~1000 chars are silently dropped → message truncated to 1000.
 *   - an existing subscriber who is not email-active is only added to the group, never
 *     re-upserted, so an unsubscribe is never reversed.
 */

const ALLOWED_ORIGINS = [
  'https://www.monteirofabrics.com',
  'https://monteirofabrics.com',
  'https://monteiro-fabrics.myshopify.com',
];
const SENDER = 'https://api.sender.net/v2';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

export default {
  async fetch(request, env) {
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

    const name = clip(d.name, 120);
    const [firstname, ...rest] = name.split(/\s+/);
    const phoneRaw = clip(d.phone, 40);
    const phone = e164(phoneRaw);
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
    const auth = {
      Authorization: `Bearer ${env.SENDER_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    try {
      // Existing subscriber who is not active → only add to the group.
      const look = await fetch(`${SENDER}/subscribers/${encodeURIComponent(email)}`, { headers: auth });
      if (look.ok) {
        const s = (await look.json()).data;
        if (s && s.status && s.status.email !== 'active') {
          const r = await fetch(`${SENDER}/subscribers/groups/${group}`, {
            method: 'POST', headers: auth, body: JSON.stringify({ subscribers: [email] }),
          });
          return new Response(r.ok ? 'ok' : 'sender error', { status: r.ok ? 200 : 502, headers: h });
        }
      }

      const body = { email, groups: [group], fields, trigger_automation: false };
      if (firstname) body.firstname = firstname;
      if (rest.length) body.lastname = rest.join(' ');
      if (phone) body.phone = phone;

      let r = await fetch(`${SENDER}/subscribers`, { method: 'POST', headers: auth, body: JSON.stringify(body) });
      if (!r.ok && body.phone) {           // phone rejected → retry without it
        delete body.phone;
        fields['{$message}'] = `Phone: ${phoneRaw}\n\n${fields['{$message}'] || ''}`.slice(0, 1000);
        r = await fetch(`${SENDER}/subscribers`, { method: 'POST', headers: auth, body: JSON.stringify(body) });
      }
      if (!r.ok) console.log('sender', r.status, await r.text());
      return new Response(r.ok ? 'ok' : 'sender error', { status: r.ok ? 200 : 502, headers: h });
    } catch (err) {
      console.log('error', String(err));
      return new Response('error', { status: 500, headers: h });
    }
  },
};
