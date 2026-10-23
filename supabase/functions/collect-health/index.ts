// collect-health — external probes for the Monteiro Fabrics control centre.
//
// Once a day (05:15 Lisbon, after the collectors) it checks that the pieces outside Supabase still
// answer: the live site (and that PostHog / GTM / Clarity are in the HTML), the sitemap, the
// contact-to-sender Worker, the Shopify Admin API token, the Sender API token, the report portal,
// and — when a `posthog_personal_api_key` secret exists in Vault — how many theme events PostHog
// received in the last 24 h. Writes one row per probe in signals_probes and a run row in
// signals_collector_runs (source 'health'). Nothing is retried: a failed probe is the signal.
//
// Body (optional): {} — no parameters. Vault: shopify_admin_token, sender_api_token,
// posthog_personal_api_key (optional).

import { db, optionalSecret, secret, serve } from '../_shared/signals.ts';

const SITE = 'https://www.monteirofabrics.com';
const WORKER = 'https://contact-to-sender.antoniodias.workers.dev';
const PORTAL = 'https://reports.viriato.com.pt';
const SHOP = 'monteiro-fabrics.myshopify.com';
const POSTHOG_PROJECT = '198836';
const TIMEOUT_MS = 15_000;
const UA = 'mf-collect-health/1.0 (+Supabase Edge Function)';

type Probe = { probe: string; target: string; ok: boolean; status: number | null; latency_ms: number; detail: string | null; value: number | null };

async function timed(probe: string, target: string, fn: (signal: AbortSignal) => Promise<{ ok: boolean; status?: number | null; detail?: string | null; value?: number | null }>): Promise<Probe> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  const t0 = Date.now();
  try {
    const r = await fn(ctl.signal);
    return { probe, target, ok: r.ok, status: r.status ?? null, latency_ms: Date.now() - t0, detail: r.detail ?? null, value: r.value ?? null };
  } catch (e) {
    return { probe, target, ok: false, status: null, latency_ms: Date.now() - t0, detail: String((e as Error)?.message ?? e).slice(0, 500), value: null };
  } finally {
    clearTimeout(timer);
  }
}

const get = (url: string, signal: AbortSignal, init: RequestInit = {}) =>
  fetch(url, { ...init, signal, headers: { 'User-Agent': UA, ...(init.headers ?? {}) }, redirect: 'manual' });

serve('health', 'collect-health', async () => {
  const probes: Probe[] = [];

  // 1. Live site + tracking tags present in the served HTML.
  probes.push(await timed('site_home', SITE + '/', async (signal) => {
    const r = await get(SITE + '/', signal);
    const html = r.status === 200 ? await r.text() : '';
    const missing = ['eu.i.posthog.com', 'GTM-KWHH9H5K', 'clarity.ms'].filter((s) => !html.includes(s));
    return { ok: r.status === 200 && missing.length === 0, status: r.status, detail: missing.length ? 'missing in HTML: ' + missing.join(', ') : null, value: html.length };
  }));
  probes.push(await timed('site_pt', SITE + '/pt', async (signal) => {
    const r = await get(SITE + '/pt', signal);
    return { ok: r.status === 200, status: r.status };
  }));
  probes.push(await timed('sitemap', SITE + '/sitemap.xml', async (signal) => {
    const r = await get(SITE + '/sitemap.xml', signal);
    const xml = r.status === 200 ? await r.text() : '';
    const n = (xml.match(/<loc>/g) ?? []).length;
    return { ok: r.status === 200 && n > 0, status: r.status, value: n, detail: n ? null : 'no <loc> entries' };
  }));

  // 2. Contact form → Sender Worker (CORS preflight from the site origin answers 204).
  probes.push(await timed('worker_contact_to_sender', WORKER, async (signal) => {
    const r = await get(WORKER, signal, { method: 'OPTIONS', headers: { Origin: SITE, 'Access-Control-Request-Method': 'POST' } });
    return { ok: r.status === 204 || r.status === 200, status: r.status };
  }));

  // 3. Shopify Admin API token (same token the collectors use).
  probes.push(await timed('shopify_admin_api', `https://${SHOP}/admin/api/2026-10/graphql.json`, async (signal) => {
    const r = await get(`https://${SHOP}/admin/api/2026-10/graphql.json`, signal, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': await secret('shopify_admin_token') },
      body: JSON.stringify({ query: '{ shop { name } }' }),
    });
    const j = r.ok ? await r.json().catch(() => ({})) : {};
    const name = j?.data?.shop?.name ?? null;
    return { ok: r.status === 200 && !!name, status: r.status, detail: name ? null : (j?.errors ? JSON.stringify(j.errors).slice(0, 300) : 'no shop name') };
  }));

  // 4. Sender API token.
  probes.push(await timed('sender_api', 'https://api.sender.net/v2/groups', async (signal) => {
    const r = await get('https://api.sender.net/v2/groups?limit=1', signal, {
      headers: { Authorization: `Bearer ${await secret('sender_api_token')}`, Accept: 'application/json' },
    });
    return { ok: r.status === 200, status: r.status };
  }));

  // 5. Report portal answers (login redirect is fine).
  probes.push(await timed('portal', PORTAL, async (signal) => {
    const r = await get(PORTAL + '/', signal);
    return { ok: r.status < 500, status: r.status };
  }));

  // 6. PostHog theme events in the last 24 h (optional — needs a personal API key in Vault).
  const phKey = await optionalSecret('posthog_personal_api_key');
  if (phKey) {
    const url = `https://eu.posthog.com/api/projects/${POSTHOG_PROJECT}/query/`;
    probes.push(await timed('posthog_events_24h', url, async (signal) => {
      const r = await get(url, signal, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${phKey}` },
        body: JSON.stringify({ query: { kind: 'HogQLQuery', query:
          "SELECT countIf(event = '$pageview') AS pageviews, countIf(event IN ('sample_requested','catalogue_downloaded','technical_file_requested','lead_submitted','checkout_started','checkout_completed')) AS theme_events FROM events WHERE timestamp >= now() - INTERVAL 24 HOUR" } }),
      });
      const j = r.ok ? await r.json().catch(() => ({})) : {};
      const row = j?.results?.[0] ?? [];
      const pageviews = Number(row[0] ?? 0), themeEvents = Number(row[1] ?? 0);
      return { ok: r.status === 200 && pageviews > 0, status: r.status, value: themeEvents, detail: r.status === 200 ? `pageviews ${pageviews}, theme events ${themeEvents}` : JSON.stringify(j).slice(0, 300) };
    }));
  } else {
    probes.push({ probe: 'posthog_events_24h', target: 'vault:posthog_personal_api_key', ok: false, status: null, latency_ms: 0, detail: 'no posthog_personal_api_key in Vault — probe skipped', value: null });
  }

  const now = new Date().toISOString();
  const { error } = await db.from('signals_probes').insert(probes.map((p) => ({ ...p, probed_at: now })));
  if (error) throw new Error(`insert signals_probes: ${error.message}`);
  const failed = probes.filter((p) => !p.ok).map((p) => p.probe);
  return { rows: probes.length, details: { failed: failed.length, failed_probes: failed.join(', ') || null } };
});
