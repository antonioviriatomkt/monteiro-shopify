// collect-shopify — orders of monteiro-fabrics.myshopify.com (sample €0 and paid alike).
//
// Body (all optional):
//   {}                         daily run: orders updated in the last 3 days (new + cancelled/edited)
//   { "backfill": true }       orders created since 2025-02-01
//   { "field": "created_at" | "updated_at", "since": "<ISO>" }
// Writes signals_shopify_orders. is_test / is_ucp are set by the table trigger, not here.
// Vault: shopify_admin_token, or shopify_client_id + shopify_client_secret (client-credentials app).

import { optionalSecret, secret, serve, sleep, upsert } from '../_shared/signals.ts';

const SHOP = 'monteiro-fabrics.myshopify.com';
const API = `https://${SHOP}/admin/api/2026-07/graphql.json`;
const BACKFILL_SINCE = '2025-02-01';

let token: string | null = null;
async function accessToken(): Promise<string> {
  if (token) return token;
  const admin = await optionalSecret('shopify_admin_token');
  if (admin) return (token = admin);
  const r = await fetch(`https://${SHOP}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: await secret('shopify_client_id'),
      client_secret: await secret('shopify_client_secret'),
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`Shopify token: ${r.status} ${JSON.stringify(j)}`);
  return (token = j.access_token as string);
}

// deno-lint-ignore no-explicit-any
async function gql(query: string, variables: Record<string, unknown>): Promise<any> {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(API, {
      method: 'POST',
      headers: { 'X-Shopify-Access-Token': await accessToken(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    if ((r.status === 429 || r.status >= 500) && attempt < 4) { await sleep(2000 * (attempt + 1)); continue; }
    const j = await r.json();
    const throttled = j.errors?.some((e: { extensions?: { code?: string } }) => e.extensions?.code === 'THROTTLED');
    if (throttled && attempt < 4) { await sleep(2000 * (attempt + 1)); continue; }
    if (!r.ok || j.errors) throw new Error(`Shopify ${r.status}: ${JSON.stringify(j.errors ?? j).slice(0, 800)}`);
    const t = j.extensions?.cost?.throttleStatus;
    if (t && t.currentlyAvailable < 400) await sleep(Math.ceil((400 - t.currentlyAvailable) / t.restoreRate) * 1000);
    return j.data;
  }
}

const ORDERS = `query($q: String!, $after: String) {
  orders(first: 15, after: $after, sortKey: CREATED_AT, query: $q) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id name createdAt updatedAt cancelledAt test email displayFinancialStatus sourceName tags currencyCode
      totalPriceSet { shopMoney { amount } }
      customAttributes { key value }
      shippingAddress { countryCodeV2 company }
      billingAddress { countryCodeV2 company }
      customer { email }
      customerJourneySummary {
        ready daysToConversion momentsCount { count }
        firstVisit { occurredAt source sourceType landingPage referrerUrl
                     utmParameters { source medium campaign term content } }
        lastVisit { source landingPage }
      }
      lineItems(first: 50) {
        pageInfo { hasNextPage }
        nodes { title quantity sku variantTitle product { id handle productType } }
      }
    }
  }
}`;

const COLLECTIONS = `query($ids: [ID!]!) {
  nodes(ids: $ids) { ... on Product { id collections(first: 25) { nodes { handle } } } }
}`;

const productCollections = new Map<string, string[]>();
async function loadCollections(ids: string[]) {
  const missing = [...new Set(ids)].filter((id) => !productCollections.has(id));
  for (let i = 0; i < missing.length; i += 30) {
    const data = await gql(COLLECTIONS, { ids: missing.slice(i, i + 30) });
    for (const n of data.nodes ?? []) {
      if (n?.id) productCollections.set(n.id, (n.collections?.nodes ?? []).map((c: { handle: string }) => c.handle));
    }
    for (const id of missing.slice(i, i + 30)) if (!productCollections.has(id)) productCollections.set(id, []);
  }
}

const PH = ['ph_distinct_id', 'ph_session_id', 'ph_referrer', 'ph_landing', 'ph_utm_source', 'ph_utm_medium',
  'ph_utm_campaign', 'ph_utm_term', 'ph_utm_content', 'ph_gclid'];

// deno-lint-ignore no-explicit-any
function toRow(o: any, now: string) {
  const attrs: Record<string, string> = Object.fromEntries(
    (o.customAttributes ?? []).map((a: { key: string; value: string }) => [a.key, a.value]),
  );
  const j = o.customerJourneySummary ?? {};
  const fv = j.firstVisit ?? {};
  const utm = fv.utmParameters ?? {};
  // deno-lint-ignore no-explicit-any
  const lines = (o.lineItems?.nodes ?? []).map((l: any) => ({
    title: l.title,
    quantity: l.quantity,
    sku: l.sku || null,
    variant_title: l.variantTitle,
    product_handle: l.product?.handle ?? null,
    product_type: l.product?.productType || null,
    collections: l.product ? productCollections.get(l.product.id) ?? [] : [],
  }));
  const email = (o.email ?? o.customer?.email ?? '').trim().toLowerCase() || null;
  return {
    order_id: Number(String(o.id).split('/').pop()),
    order_name: o.name,
    created_at: o.createdAt,
    updated_at: o.updatedAt,
    cancelled_at: o.cancelledAt,
    total: Number(o.totalPriceSet?.shopMoney?.amount ?? 0),
    currency: o.currencyCode,
    financial_status: o.displayFinancialStatus,
    source_name: o.sourceName,
    tags: o.tags ?? [],
    email,
    company: o.shippingAddress?.company || o.billingAddress?.company || null,
    country: o.shippingAddress?.countryCodeV2 ?? o.billingAddress?.countryCodeV2 ?? null,
    line_items: lines,
    product_handles: [...new Set(lines.map((l: { product_handle: string | null }) => l.product_handle).filter(Boolean))],
    collections: [...new Set(lines.flatMap((l: { collections: string[] }) => l.collections))],
    journey_ready: j.ready ?? null,
    days_to_conversion: j.daysToConversion ?? null,
    moments_count: j.momentsCount?.count ?? null,
    first_visit_at: fv.occurredAt ?? null,
    first_visit_source: fv.source ?? null,
    first_visit_source_type: fv.sourceType ?? null,
    first_visit_landing_page: fv.landingPage ?? null,
    first_visit_referrer_url: fv.referrerUrl ?? null,
    first_visit_utm_source: utm.source ?? null,
    first_visit_utm_medium: utm.medium ?? null,
    first_visit_utm_campaign: utm.campaign ?? null,
    first_visit_utm_term: utm.term ?? null,
    first_visit_utm_content: utm.content ?? null,
    last_visit_source: j.lastVisit?.source ?? null,
    last_visit_landing_page: j.lastVisit?.landingPage ?? null,
    ...Object.fromEntries(PH.map((k) => [k, attrs[k] ?? null])),
    cart_attributes: attrs,
    shopify_test: !!o.test,
    collected_at: now,
  };
}

serve('shopify', 'collect-shopify', async (params, deadline) => {
  const field = (params.field as string) ?? (params.backfill ? 'created_at' : 'updated_at');
  const since = (params.since as string) ??
    (params.backfill ? BACKFILL_SINCE : new Date(Date.now() - 3 * 86_400_000).toISOString());
  const q = `${field}:>='${since}'`;

  let after = (params.cursor as string) ?? null;
  let rows = 0, truncated = 0, samples = 0;
  while (true) {
    if (Date.now() > deadline) {
      return { rows, details: { orders: rows, samples, line_items_truncated: truncated },
        next: { field, since, cursor: after } };
    }
    const data = await gql(ORDERS, { q, after });
    const nodes = data.orders.nodes;
    // deno-lint-ignore no-explicit-any
    await loadCollections(nodes.flatMap((o: any) => (o.lineItems?.nodes ?? []).map((l: any) => l.product?.id).filter(Boolean)));
    const now = new Date().toISOString();
    const batch = nodes.map((o: unknown) => toRow(o, now));
    await upsert('signals_shopify_orders', batch, 'order_id');
    rows += batch.length;
    samples += batch.filter((r: { total: number }) => r.total === 0).length;
    // deno-lint-ignore no-explicit-any
    truncated += nodes.filter((o: any) => o.lineItems?.pageInfo?.hasNextPage).length;
    if (!data.orders.pageInfo.hasNextPage) break;
    after = data.orders.pageInfo.endCursor;
  }
  return { rows, details: { orders: rows, samples, line_items_truncated: truncated, query: q } };
});
