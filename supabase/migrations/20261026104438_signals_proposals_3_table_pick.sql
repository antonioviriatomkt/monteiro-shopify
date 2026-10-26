-- Task 4 part 3: proposals table + pick / text / decide (pick replaced in part 5).

-- ── Proposals ─────────────────────────────────────────────────────────────────────────────────
create table public.signals_proposals (
  id            text        primary key,            -- 'P-<run>-<n>', e.g. P-14-1
  run_id        bigint      not null references public.signals_pulse_runs (id),
  rule          text        not null references public.signals_rules (rule),
  page          text        not null,
  path          text        not null,
  sector        text,
  tier          text        not null check (tier in ('T1', 'T2')),
  score         numeric     not null,
  evidence      jsonb       not null,
  status        text        not null default 'draft'
                check (status in ('draft', 'proposed', 'approved', 'rejected', 'applied', 'expired')),
  proposal_text text,
  created_at    timestamptz not null default now(),
  proposed_at   timestamptz,
  decided_at    timestamptz,
  applied_at    timestamptz,
  note          text
);
comment on table public.signals_proposals is
  'Weekly site proposals (Task 4): draft until the pulse is acked, then proposed → approved/rejected → applied, or expired. Service role only.';
create index on public.signals_proposals (path, rule);

create function public.signals_proposals_pick(p_run_id bigint) returns jsonb
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
                      where s.path = c.path and s.rule = c.rule
                        and (s.status = 'rejected'
                             or (s.status in ('proposed', 'approved', 'applied')
                                 and coalesce(s.proposed_at, s.created_at) > now() - make_interval(days => (p->>'cooldown_days')::int))
                             or (s.status = 'expired'
                                 and s.proposed_at > now() - make_interval(days => (p->>'cooldown_days')::int))))
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

create function public.signals_proposal_text(p_id text, p_text text) returns void
language plpgsql set search_path = '' as $$
begin
  update public.signals_proposals set proposal_text = left(p_text, 4000)
  where id = p_id and status in ('draft', 'proposed');
  if not found then raise exception 'proposal % not found or already decided', p_id; end if;
end $$;

create function public.signals_proposal_decide(p_id text, p_decision text, p_note text default null) returns void
language plpgsql set search_path = '' as $$
begin
  if p_decision not in ('approved', 'rejected', 'applied') then
    raise exception 'decision must be approved, rejected or applied';
  end if;
  update public.signals_proposals
     set status = p_decision,
         decided_at = case when p_decision in ('approved', 'rejected') then now() else coalesce(decided_at, now()) end,
         applied_at = case when p_decision = 'applied' then now() else applied_at end,
         note = coalesce(p_note, note)
   where id = p_id
     and ((p_decision in ('approved', 'rejected') and status = 'proposed')
          or (p_decision = 'applied' and status = 'approved'));
  if not found then raise exception 'proposal % not in a state that allows %', p_id, p_decision; end if;
end $$;

alter table public.signals_proposals enable row level security;
revoke all on public.signals_proposals from public, anon, authenticated;
grant all on public.signals_proposals to service_role;
revoke all on function public.signals_proposals_pick(bigint)            from public, anon, authenticated;
revoke all on function public.signals_proposal_text(text, text)         from public, anon, authenticated;
revoke all on function public.signals_proposal_decide(text, text, text) from public, anon, authenticated;
