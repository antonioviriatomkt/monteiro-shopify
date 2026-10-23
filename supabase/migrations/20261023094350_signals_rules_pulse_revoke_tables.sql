-- Task 3 hardening: same table-level access as the Task 2 tables (RLS already on, no policies).
revoke all on public.signals_rules, public.signals_free_email_domains, public.signals_leads_seen,
              public.signals_flags, public.signals_pulse_runs
  from anon, authenticated;
