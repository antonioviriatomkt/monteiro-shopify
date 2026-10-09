// PostHog — Shopify Custom Pixel (Monteiro Fabrics, 2026-10-09)
// Where: Shopify Admin → Settings → Customer events → Add custom pixel → name "PostHog checkout"
//        → paste this file → Permission: "Not required" → Data sale: "Data collected does not qualify
//        as data sale" → Save → Connect.
// Why: the theme snippet cannot see the checkout. This sends checkout_started / checkout_completed
//      to PostHog under the SAME person, by reading the PostHog cookie set by the storefront.
// Vault: WORK/Clients/Monteiro-Fabrics/projects/posthog-uso-completo.md

const PH_KEY = 'phc_nQ2CrNyE8JWYWRzcfUW2rfjX7iExbWSH8VKwsFbL8ebn';
const PH_HOST = 'https://eu.i.posthog.com';
const PH_COOKIE = 'ph_' + PH_KEY + '_posthog';

async function phIds() {
  try {
    const raw = await browser.cookie.get(PH_COOKIE);
    if (raw) {
      const c = JSON.parse(decodeURIComponent(raw));
      return { distinct_id: c.distinct_id, session_id: c.$sesid ? c.$sesid[1] : undefined };
    }
  } catch (e) {}
  return { distinct_id: undefined, session_id: undefined };
}

function attr(checkout, key) {
  const a = (checkout && checkout.attributes) || [];
  const hit = a.find((x) => x.key === key);
  return hit ? hit.value : undefined;
}

async function send(event, checkout, extra) {
  const ids = await phIds();
  // Fallback: the distinct_id the theme wrote into the cart attributes.
  const distinctId = ids.distinct_id || attr(checkout, 'ph_distinct_id') || ('checkout_' + checkout.token);
  const lines = (checkout.lineItems || []).map((l) => ({
    product: l.variant && l.variant.product ? l.variant.product.title : l.title,
    variant: l.variant ? l.variant.title : undefined,
    quantity: l.quantity,
  }));
  const body = {
    api_key: PH_KEY,
    event,
    distinct_id: distinctId,
    properties: Object.assign({
      $session_id: ids.session_id,
      $current_url: (init.context && init.context.document && init.context.document.location.href) || undefined,
      checkout_token: checkout.token,
      currency: checkout.currencyCode,
      total: checkout.totalPrice ? Number(checkout.totalPrice.amount) : undefined,
      is_sample_order: checkout.totalPrice ? Number(checkout.totalPrice.amount) === 0 : undefined,
      item_count: lines.reduce((n, l) => n + (l.quantity || 0), 0),
      items: lines,
      country: checkout.shippingAddress ? checkout.shippingAddress.countryCode : undefined,
      email_domain: checkout.email ? checkout.email.split('@')[1] : undefined,
      ph_utm_source: attr(checkout, 'ph_utm_source'),
      ph_utm_campaign: attr(checkout, 'ph_utm_campaign'),
      ph_utm_term: attr(checkout, 'ph_utm_term'),
      ph_referrer: attr(checkout, 'ph_referrer'),
      ph_landing: attr(checkout, 'ph_landing'),
    }, extra || {}),
  };
  try {
    await fetch(PH_HOST + '/i/v0/e/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), keepalive: true,
    });
  } catch (e) {}
}

analytics.subscribe('checkout_started', (event) => send('checkout_started', event.data.checkout));

analytics.subscribe('checkout_completed', async (event) => {
  const c = event.data.checkout;
  const ids = await phIds();
  const distinctId = ids.distinct_id || attr(c, 'ph_distinct_id');
  await send('checkout_completed', c, { order_id: c.order ? c.order.id : undefined });
  // Identify the buyer by email so the order joins the person who browsed (B2B lead).
  if (c.email && distinctId) {
    try {
      await fetch(PH_HOST + '/i/v0/e/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: PH_KEY, event: '$identify', distinct_id: c.email.toLowerCase(),
          properties: { $anon_distinct_id: distinctId, $set: { email: c.email.toLowerCase() } },
        }),
        keepalive: true,
      });
    } catch (e) {}
  }
});
