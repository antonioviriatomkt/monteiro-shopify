-- signals_leads_origin — one attribution rule for every lead event (fix 4 of the simplification, 23/10).
-- Precedence: gclid / utm_medium=cpc → Google Ads · utm_source chatgpt → ChatGPT · utm_source (other) → its
-- value · session-entry referrer host (google → orgânico, chatgpt → ChatGPT, bing/yahoo/duckduckgo → that
-- engine, internal host = none, other → the host) · landing without referrer → Direto.
-- Sources: cart ph_* (samples) · Worker ph_* (contact form v2) · fallback: Shopify customerJourneySummary
-- only when the cart carried no ph_* and the journey is not a reset (/cart or /checkouts landing).
-- Applied 23/10 in three steps (signals_leads_origin, …_journey_fallback, signals_origin_internal_referrer);
-- this file is the final state.
create or replace function public.signals_origin(utm_source text, utm_medium text, gclid text, referrer text, landing text)
 returns text language sql immutable set search_path to '' as $$
  with r as (select case when lower(coalesce(referrer, '')) like '%monteirofabrics.com%' or lower(coalesce(referrer, '')) like '%myshopify.com%' then '' else coalesce(referrer, '') end as ref)
  select case
    when coalesce(gclid, '') <> '' or lower(coalesce(utm_medium, '')) in ('cpc', 'ppc', 'paid') then 'Google Ads'
    when lower(coalesce(utm_source, '')) like '%chatgpt%' then 'ChatGPT'
    when coalesce(utm_source, '') <> '' then utm_source
    when lower(ref) like '%google.%' or lower(ref) = 'google' then 'Google (orgânico)'
    when lower(ref) like '%chatgpt%' or lower(ref) like '%openai%' then 'ChatGPT'
    when lower(ref) like '%bing.%' then 'Bing'
    when lower(ref) like '%yahoo.%' then 'Yahoo'
    when lower(ref) like '%duckduckgo%' then 'DuckDuckGo'
    when lower(ref) like '%qr-codes%' then 'QR code'
    when ref <> '' then regexp_replace(regexp_replace(lower(ref), '^https?://', ''), '^www\.|/.*$', '', 'g')
    when coalesce(landing, '') <> '' then 'Direto'
    else null end
  from r
$$;

create or replace view public.signals_leads_origin with (security_invoker = true) as
select 'shopify:' || o.order_id as event_key,
       coalesce(
         public.signals_origin(o.ph_utm_source, o.ph_utm_medium, o.ph_gclid, o.ph_referrer, o.ph_landing),
         case when o.first_visit_landing_page like '%/cart%' or o.first_visit_landing_page like '%/checkouts/%' then null
              else public.signals_origin(o.first_visit_utm_source, o.first_visit_utm_medium, null,
                     coalesce(nullif(o.first_visit_referrer_url, ''), case when lower(o.first_visit_source) in ('google','chatgpt','bing','yahoo','duckduckgo') then o.first_visit_source end),
                     case when lower(o.first_visit_source) = 'direct' then coalesce(o.first_visit_landing_page, '/') end) end
       ) as origin,
       coalesce(o.ph_utm_campaign, o.first_visit_utm_campaign) as utm_campaign,
       coalesce(o.ph_landing, o.first_visit_landing_page) as landing,
       o.ph_distinct_id,
       case when o.ph_landing is not null or o.ph_utm_source is not null or o.ph_referrer is not null then 'cart_attributes' else 'shopify_journey' end as origin_source
from public.signals_shopify_orders o
union all
select 'worker:' || e.id,
       public.signals_origin(e.ph_utm_source, e.ph_utm_medium, e.ph_gclid, e.ph_referrer, e.ph_landing),
       e.ph_utm_campaign, e.ph_landing, e.ph_distinct_id, 'worker'
from public.signals_lead_events e;
revoke all on public.signals_leads_origin from public, anon, authenticated;
