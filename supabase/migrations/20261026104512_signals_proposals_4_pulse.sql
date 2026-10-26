-- Task 4 part 4: weekly pulse payload gets 'proposals'; ack moves this run's drafts to proposed.

-- ── Pulse: weekly payload gets proposals; ack turns them from draft into proposed ─────────────
create or replace function public.signals_pulse_prepare(p_kind text) returns jsonb
language plpgsql set search_path = '' as $$
declare
  v_flags jsonb; v_resolved jsonb; v_leads jsonb; v_payload jsonb; v_noop boolean; v_id bigint; v_props jsonb;
  v_rank constant jsonb := '{"critical": 3, "warn": 2, "info": 1}';
  v_min int;
begin
  if p_kind not in ('daily', 'weekly') then raise exception 'kind must be daily or weekly'; end if;
  v_min := case p_kind when 'daily' then 2 else 1 end;

  select coalesce(jsonb_agg(jsonb_build_object('id', f.id, 'rule', f.rule, 'title', r.title, 'severity', f.severity,
           'subject', f.subject, 'message', f.message, 'metrics', f.metrics, 'opened_at', f.opened_at,
           'resolved_at', f.resolved_at)
           order by (v_rank->>f.severity)::int desc, f.opened_at), '[]')
    into v_flags
  from public.signals_flags f join public.signals_rules r using (rule)
  where f.notified_at is null and (v_rank->>f.severity)::int >= v_min;

  select coalesce(jsonb_agg(jsonb_build_object('id', f.id, 'rule', f.rule, 'subject', f.subject,
           'message', f.message, 'opened_at', f.opened_at, 'resolved_at', f.resolved_at) order by f.resolved_at), '[]')
    into v_resolved
  from public.signals_flags f
  where f.resolved_at is not null and f.resolved_notified_at is null and f.notified_at is not null
    and (v_rank->>f.severity)::int >= v_min;

  select coalesce(jsonb_agg(jsonb_build_object('event_key', l.event_key, 'source', l.source, 'day', l.day,
           'domain', l.domain, 'company', l.company, 'country', l.country, 'order', l.order_name,
           'collections', l.collections, 'first_visit_source', l.first_visit_source,
           'utm_source', l.first_visit_utm_source, 'utm_campaign', l.first_visit_utm_campaign,
           'landing', l.first_visit_landing_page) order by l.occurred_at), '[]')
    into v_leads
  from public.signals_leads_seen s
  join public.signals_leads l using (event_key)
  join public.signals_rules r on r.rule = 'L1' and r.enabled
  where s.notified_at is null and l.excluded_reason is null and (v_rank->>r.severity)::int >= v_min;

  v_noop := p_kind = 'daily'
            and jsonb_array_length(v_flags) = 0 and jsonb_array_length(v_resolved) = 0
            and jsonb_array_length(v_leads) = 0;

  v_payload := jsonb_build_object(
    'kind', p_kind,
    'generated_at', now(),
    'noop', v_noop,
    'flags', v_flags,
    'resolved', v_resolved,
    'new_leads', v_leads,
    'health', (select jsonb_agg(to_jsonb(h) - 'last_error' || jsonb_build_object('last_error', left(h.last_error, 200)))
               from public.signals_collector_health h),
    'blocklist', jsonb_build_object('domains', (select count(*) from public.signals_free_email_domains),
                                    'fingerprint', public.signals_free_email_domains_fingerprint()));

  if p_kind = 'weekly' then
    v_payload := v_payload || jsonb_build_object(
      'leads_weeks', (select jsonb_agg(to_jsonb(w) order by w.week desc)
                      from (select * from public.signals_leads_weekly
                            where week >= date_trunc('week', now() at time zone 'Europe/Lisbon')::date - 63
                            order by week desc) w),
      'gsc', (select to_jsonb(g) from public.signals_gsc_totals_rolling g
              where g.date = (select max(date) from public.signals_gsc_daily_totals)),
      'open_flags', (select coalesce(jsonb_agg(jsonb_build_object('rule', f.rule, 'subject', f.subject,
                       'severity', f.severity, 'message', f.message, 'opened_at', f.opened_at)), '[]')
                     from public.signals_flags f where f.resolved_at is null),
      'page_movers', (select coalesce(jsonb_agg(to_jsonb(m) order by abs(m.impressions_delta) desc), '[]')
                      from (select * from public.signals_gsc_page_movers
                            order by abs(impressions_delta) desc limit 10) m),
      'query_movers', (select coalesce(jsonb_agg(to_jsonb(m)), '[]')
                       from (select * from public.signals_gsc_query_movers
                             order by greatest(impressions_cur, impressions_prev) desc limit 15) m));
  end if;

  insert into public.signals_pulse_runs (kind, noop, payload, delivered_at, channel)
  values (p_kind, v_noop, v_payload, case when v_noop then now() end, case when v_noop then 'none' end)
  returning id into v_id;

  if p_kind = 'weekly' then
    v_props := public.signals_proposals_pick(v_id);
    v_payload := v_payload || jsonb_build_object('proposals', v_props);
    update public.signals_pulse_runs set payload = v_payload where id = v_id;
  end if;

  return v_payload || jsonb_build_object('run_id', v_id);
end $$;

create or replace function public.signals_pulse_ack(p_run_id bigint, p_channel text default 'gmail') returns jsonb
language plpgsql set search_path = '' as $$
declare p jsonb; nf int; nr int; nl int; np int;
begin
  update public.signals_pulse_runs set delivered_at = now(), channel = p_channel
  where id = p_run_id and delivered_at is null
  returning payload into p;
  if p is null then raise exception 'pulse run % not found or already delivered', p_run_id; end if;

  update public.signals_flags set notified_at = now()
  where notified_at is null and id in (select (e->>'id')::bigint from jsonb_array_elements(p->'flags') e);
  get diagnostics nf = row_count;

  update public.signals_flags set resolved_notified_at = now()
  where resolved_notified_at is null and id in (select (e->>'id')::bigint from jsonb_array_elements(p->'resolved') e);
  get diagnostics nr = row_count;

  update public.signals_leads_seen set notified_at = now()
  where notified_at is null and event_key in (select e->>'event_key' from jsonb_array_elements(p->'new_leads') e);
  get diagnostics nl = row_count;

  update public.signals_proposals set status = 'proposed', proposed_at = now()
  where run_id = p_run_id and status = 'draft';
  get diagnostics np = row_count;

  return jsonb_build_object('flags', nf, 'resolved', nr, 'leads', nl, 'proposals', np);
end $$;

revoke all on function public.signals_pulse_prepare(text)     from public, anon, authenticated;
revoke all on function public.signals_pulse_ack(bigint, text) from public, anon, authenticated;
