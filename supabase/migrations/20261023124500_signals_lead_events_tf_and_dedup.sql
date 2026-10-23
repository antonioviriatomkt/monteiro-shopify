-- Technical file via the Worker (kind technical_file, posted by posthog-events.liquid after the Sender
-- popup succeeds) + robust dedup: a Sender row (enzoW5 API/FORM or dNYvDp) is 'worker_mirror' when a
-- Worker event with the same email and kind arrived within ±10 min (so a Worker outage never loses a
-- lead — the Sender row then counts). Sign-ups stay 'shopify_sync' = out of the lead definition.
-- Applied 23/10 12:50. The view body is the one in 20261023121000_signals_lead_events.sql with the
-- worker_mirror rule replaced and the worker branch carrying collection; see the live definition
-- (`select pg_get_viewdef('public.signals_leads')`) — kept short here on purpose.
alter table public.signals_lead_events
  add column if not exists sender_form text,
  add column if not exists product_handle text,
  add column if not exists product_title text,
  add column if not exists collection text;
-- signals_ingest_lead: + sender_form, product_handle, product_title, collection (same checks as before).
-- signals_leads: worker_mirror by email ±10 min per kind, on enzoW5 API/FORM and dNYvDp rows.
