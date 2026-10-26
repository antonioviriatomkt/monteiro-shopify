-- Task 4 fix (26/10): cooldown per page, any rule, while a proposal is open or recent;
-- a rejection still blocks that page + rule for good. Backtest: week 2 no longer re-proposes week-1 pages.

create or replace function public.signals_proposals_pick(p_run_id bigint) returns jsonb
language plpgsql set search_path = '' as $$
declare p jsonb; v jsonb;
begin
  select params into p from public.signals_rules where rule = 'P0' and enabled;
  if p is null then return '[]'; end if;

  delete from public.signals_proposals where status = 'draft';                -- undelivered earlier runs
  update public.signals_proposals set status = 'expired', note = coalesce(note, 'no decision in time')
  where status = 'proposed' and proposed_at < now() - make_interval(days => (p->>'expire_days')::int);

  with c as (
    select distinct on (c.path) c.*
    from public.signals_proposal_candidates c
    where c.score >= (p->>'min_score')::numeric
      and not exists (select 1 from public.signals_proposals s
                      where s.path = c.path
                        and ((s.status = 'rejected' and s.rule = c.rule)
                             or s.status in ('proposed', 'approved')
                             or (s.status in ('applied', 'expired', 'rejected')
                                 and coalesce(s.decided_at, s.proposed_at, s.created_at) > now() - make_interval(days => (p->>'cooldown_days')::int))))
    order by c.path, c.score desc),
  top as (select c.*, row_number() over (order by c.score desc, c.path) as n
          from c order by c.score desc, c.path limit (p->>'max')::int),
  ins as (
    insert into public.signals_proposals (id, run_id, rule, page, path, sector, tier, score, evidence)
    select format('P-%s-%s', p_run_id, t.n), p_run_id, t.rule, t.page, t.path, t.sector, t.tier, t.score,
           jsonb_build_object('queries', t.queries, 'impressions', t.impressions, 'clicks', t.clicks,
                              'missed_clicks', t.missed_clicks, 'confidence', t.confidence, 'weight', t.weight,
                              'is_en', t.is_en,
                              'window_end', (select max(date) from public.signals_gsc_daily_totals),
                              'window_days', (p->>'window_days')::int)
    from top t
    returning *)
  select coalesce(jsonb_agg(jsonb_build_object('id', i.id, 'rule', i.rule, 'title', r.title, 'tier', i.tier,
           'page', i.page, 'path', i.path, 'sector', i.sector, 'score', i.score, 'evidence', i.evidence)
           order by i.score desc), '[]')
    into v
  from ins i join public.signals_rules r using (rule);
  return v;
end $$;

revoke all on function public.signals_proposals_pick(bigint) from public, anon, authenticated;
