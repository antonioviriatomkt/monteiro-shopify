-- signals_get_secret allowlist: + posthog_personal_api_key (collect-health PostHog probe).
create or replace function public.signals_get_secret(secret_name text)
 returns text language sql stable security definer set search_path to ''
as $function$
  select ds.decrypted_secret
  from vault.decrypted_secrets ds
  where ds.name = secret_name
    and secret_name in (
      'gsc_service_account_json',
      'shopify_admin_token',
      'shopify_client_id',
      'shopify_client_secret',
      'sender_api_token',
      'signals_cron_key',
      'posthog_personal_api_key'
    );
$function$;
