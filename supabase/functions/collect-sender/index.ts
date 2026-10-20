// collect-sender — Sender subscribers in the two lead groups:
//   enzoW5  "Contact form monteiro-fabrics.com"
//   dNYvDp  "Download Technical file"
//
// Scans /v2/subscribers (the whole account, ~30 pages) rather than /groups/{id}/subscribers: the group
// endpoint returns only active subscribers, and an unsubscribed or bounced contact was still a lead.
// Sender returns `created` in UTC. Every run is a full scan, so status changes are picked up too.
//
// Body (optional): { "since": "YYYY-MM-DD" } — default 2025-02-01 (registry start).
// Writes signals_sender_subscribers (one row per subscriber × group). is_test is set by the table
// trigger; is_shopify_sync is generated from source = 'SHOPIFY'.
// Vault: sender_api_token.

import { secret, serve, sleep, upsert } from '../_shared/signals.ts';

const API = 'https://api.sender.net/v2';
const GROUPS = new Set(['enzoW5', 'dNYvDp']);
const DEFAULT_SINCE = '2025-02-01';

// deno-lint-ignore no-explicit-any
async function page(n: number): Promise<any> {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(`${API}/subscribers?limit=100&page=${n}`, {
      headers: { Authorization: `Bearer ${await secret('sender_api_token')}`, Accept: 'application/json' },
    });
    if ((r.status === 429 || r.status >= 500) && attempt < 4) { await sleep(2000 * (attempt + 1)); continue; }
    const text = await r.text();
    if (!r.ok) throw new Error(`Sender ${r.status}: ${text.slice(0, 500)}`);
    return JSON.parse(text);
  }
}

// deno-lint-ignore no-explicit-any
function column(s: any, title: string): string | null {
  // deno-lint-ignore no-explicit-any
  const c = (s.columns ?? []).find((c: any) => (c.title ?? '').toLowerCase() === title && c.value);
  return c?.value?.trim() || null;
}

serve('sender', 'collect-sender', async (params, deadline) => {
  const since = new Date(((params.since as string) ?? DEFAULT_SINCE) + 'T00:00:00Z');
  let n = (params.page as number) ?? 1;
  let rows = 0, scanned = 0, before = 0;
  const perGroup: Record<string, number> = { enzoW5: 0, dNYvDp: 0 };

  while (true) {
    if (Date.now() > deadline) {
      return { rows, details: { scanned, rows_enzoW5: perGroup.enzoW5, rows_dNYvDp: perGroup.dNYvDp, before_since: before },
        next: { since: params.since, page: n } };
    }
    const j = await page(n);
    const data = j.data ?? [];
    const now = new Date().toISOString();
    const batch = [];
    for (const s of data) {
      scanned++;
      const groups = (s.subscriber_tags ?? []).map((t: { id: string }) => t.id).filter((id: string) => GROUPS.has(id));
      if (!groups.length || !s.email) continue;
      const created = new Date(String(s.created).replace(' ', 'T') + 'Z');
      if (isNaN(+created) || created < since) { before += groups.length; continue; }
      const loc = (s.location ?? '').trim();
      const country = column(s, 'country') ?? (loc ? loc.slice(loc.lastIndexOf(',') + 1).trim() || null : null);
      for (const g of groups) {
        batch.push({
          subscriber_id: s.id,
          group_id: g,
          email: String(s.email).trim().toLowerCase(),
          source: s.source ?? null,
          created_at: created.toISOString(),
          company: column(s, 'company'),
          country,
          email_status: s.status?.email ?? null,
          collected_at: now,
        });
        perGroup[g]++;
      }
    }
    await upsert('signals_sender_subscribers', batch, 'subscriber_id,group_id');
    rows += batch.length;
    if (!data.length || n >= (j.meta?.last_page ?? n)) break;
    n++;
  }
  return { rows, details: { scanned, rows_enzoW5: perGroup.enzoW5, rows_dNYvDp: perGroup.dNYvDp, before_since: before } };
});
