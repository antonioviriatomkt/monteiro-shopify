-- signals_invoke accepts collect-health (05:15 Lisbon, see 20261023113000_signals_probes.sql).
create or replace function public.signals_invoke(fn text, body jsonb default '{}'::jsonb)
 returns bigint language plpgsql security definer set search_path to ''
as $function$
declare
  key text;
begin
  if fn not in ('collect-gsc', 'collect-shopify', 'collect-sender', 'collect-health') then
    raise exception 'unknown collector %', fn;
  end if;
  select ds.decrypted_secret into key from vault.decrypted_secrets ds where ds.name = 'signals_cron_key';
  return net.http_post(
    url := 'https://btlkcbilpsjtyiqwnsal.supabase.co/functions/v1/' || fn,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-signals-key', key),
    body := body,
    timeout_milliseconds := 10000
  );
end $function$;
