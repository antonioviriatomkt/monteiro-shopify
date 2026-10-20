// collect-gsc — Search Console (searchType web) for https://www.monteirofabrics.com/.
//
// Body (all optional):
//   {}                         daily run: the last 5 complete days (GSC final data lags 2–3 days)
//   { "backfill": true }       everything GSC still holds (16 months)
//   { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" }
// Writes signals_gsc_daily (date×page×query×country×device) and signals_gsc_daily_totals (date).
// Vault: gsc_service_account_json.

import { addDays, isoDay, secret, serve, upsert } from '../_shared/signals.ts';

const SITE = 'https://www.monteirofabrics.com/';
const API = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`;
const PAGE = 25_000;

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const enc = (s: string) => new TextEncoder().encode(s);

let token: string | null = null;
async function accessToken(): Promise<string> {
  if (token) return token;
  const sa = JSON.parse(await secret('gsc_service_account_json'));
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(enc(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claim = b64url(enc(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  })));
  const der = Uint8Array.from(
    atob(sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')),
    (c) => c.charCodeAt(0),
  );
  const key = await crypto.subtle.importKey(
    'pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc(`${head}.${claim}`)));
  const r = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${head}.${claim}.${b64url(sig)}`,
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`Google token: ${r.status} ${JSON.stringify(j)}`);
  return (token = j.access_token as string);
}

type GscRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };
async function query(body: Record<string, unknown>): Promise<GscRow[]> {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'web', rowLimit: PAGE, ...body }),
    });
    if ((r.status === 429 || r.status >= 500) && attempt < 3) {
      await new Promise((res) => setTimeout(res, 2000 * (attempt + 1)));
      continue;
    }
    const j = await r.json();
    if (!r.ok) throw new Error(`GSC ${r.status}: ${JSON.stringify(j).slice(0, 500)}`);
    return (j.rows ?? []) as GscRow[];
  }
}

serve('gsc', 'collect-gsc', async (params, deadline) => {
  const yesterday = addDays(isoDay(new Date()), -1);
  const end = (params.end as string) ?? yesterday;
  let start = params.start as string | undefined;
  if (!start) {
    if (params.backfill) {
      const d = new Date();
      d.setUTCMonth(d.getUTCMonth() - 16);
      start = addDays(isoDay(d), 1);
    } else {
      start = addDays(end, -4);
    }
  }

  let totalsRows = 0;
  if (!params.totals_done) {
    const totals = await query({ startDate: start, endDate: end, dimensions: ['date'] });
    const now = new Date().toISOString();
    await upsert('signals_gsc_daily_totals', totals.map((r) => ({
      date: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position,
      collected_at: now,
    })), 'date');
    totalsRows = totals.length;
  }

  let rows = 0, days = 0;
  let day = (params.cursor as string) ?? start;
  while (day <= end) {
    if (Date.now() > deadline) {
      return {
        rows, details: { gsc_rows: rows, totals_rows: totalsRows, days },
        next: { start, end, cursor: day, totals_done: true },
      };
    }
    const now = new Date().toISOString();
    for (let startRow = 0; ; startRow += PAGE) {
      const page = await query({
        startDate: day, endDate: day, startRow,
        dimensions: ['date', 'page', 'query', 'country', 'device'],
      });
      await upsert('signals_gsc_daily', page.map((r) => ({
        date: r.keys[0], page: r.keys[1], query: r.keys[2], country: r.keys[3], device: r.keys[4],
        clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position, collected_at: now,
      })), 'date,page,query,country,device');
      rows += page.length;
      if (page.length < PAGE) break;
    }
    days++;
    day = addDays(day, 1);
  }
  return { rows, details: { gsc_rows: rows, totals_rows: totalsRows, days, window: `${start}..${end}` } };
});
