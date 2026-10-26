-- Task 4 part 2: page × query window + scored candidates. See part 1 for the overview.

-- ── Page × query window (final GSC days only: anchor = latest final day in the totals) ────────
create view public.signals_gsc_pq_window with (security_invoker = true) as
with a as (select max(date) as anchor from public.signals_gsc_daily_totals),
     c as (select params from public.signals_rules where rule = 'P0')
select a.anchor, g.page, lower(g.query) as query,
       sum(g.impressions)::bigint as impressions, sum(g.clicks)::bigint as clicks,
       round((sum(g.position * g.impressions) / nullif(sum(g.impressions), 0))::numeric, 1) as position,
       count(distinct g.date)::int as days
from public.signals_gsc_daily g, a, c
where g.date > a.anchor - (c.params->>'window_days')::int and g.date <= a.anchor
  and g.query is not null and g.query <> ''
  and lower(g.query) !~ (c.params->>'exclude_query_regex')
group by a.anchor, g.page, lower(g.query);

-- ── Candidates ────────────────────────────────────────────────────────────────────────────────
create view public.signals_proposal_candidates with (security_invoker = true) as
with p0 as (select params from public.signals_rules where rule = 'P0' and enabled),
     r1 as (select params from public.signals_rules where rule = 'P1' and enabled),
     r2 as (select params from public.signals_rules where rule = 'P2' and enabled),
     r3 as (select params from public.signals_rules where rule = 'P3' and enabled),
     r5 as (select params from public.signals_rules where rule = 'P5' and enabled),
     pq as (select w.*, public.signals_page_path(w.page) as path,
                   (p0.params->'ctr_curve'->>(least(greatest(round(w.position)::int, 1), 20) - 1))::numeric as exp_ctr
            from public.signals_gsc_pq_window w, p0),
     curve as (select p0.params->'ctr_curve' as c from p0),
     p1 as (
       select 'P1'::text as rule, pq.page,
              jsonb_agg(jsonb_build_object('query', pq.query, 'impressions', pq.impressions, 'clicks', pq.clicks,
                        'position', pq.position, 'expected_ctr', pq.exp_ctr) order by pq.impressions desc) as queries,
              sum(pq.impressions)::bigint as impressions, sum(pq.clicks)::bigint as clicks,
              sum(greatest(pq.impressions * pq.exp_ctr - pq.clicks, 0)) as missed_clicks, max(pq.days) as days
       from pq, r1
       where pq.position between (r1.params->>'pos_min')::numeric and (r1.params->>'pos_max')::numeric
         and pq.impressions >= (r1.params->>'min_impressions')::int
         and pq.clicks < (r1.params->>'ctr_factor')::numeric * pq.exp_ctr * pq.impressions
       group by pq.page),
     p2 as (
       select 'P2'::text, pq.page,
              jsonb_agg(jsonb_build_object('query', pq.query, 'impressions', pq.impressions, 'clicks', pq.clicks,
                        'position', pq.position) order by pq.impressions desc),
              sum(pq.impressions)::bigint, sum(pq.clicks)::bigint,
              sum(greatest(pq.impressions * (curve.c->>((r2.params->>'target_position')::int - 1))::numeric - pq.clicks, 0)),
              max(pq.days)
       from pq, r2, curve
       where pq.position between (r2.params->>'pos_min')::numeric and (r2.params->>'pos_max')::numeric
         and pq.impressions >= (r2.params->>'min_impressions')::int
       group by pq.page),
     q3 as (
       select pq.query, count(distinct pq.path) as paths, min(pq.position) as best_pos,
              sum(pq.impressions)::bigint as impressions, sum(pq.clicks)::bigint as clicks, max(pq.days) as days,
              (array_agg(pq.page order by pq.impressions desc))[1] as top_page,
              jsonb_agg(jsonb_build_object('page', pq.page, 'impressions', pq.impressions, 'clicks', pq.clicks,
                        'position', pq.position) order by pq.impressions desc) as pages
       from pq, r3
       where pq.impressions >= (r3.params->>'min_impressions')::int
       group by pq.query),
     p3 as (
       select 'P3'::text, q3.top_page,
              jsonb_build_array(jsonb_build_object('query', q3.query, 'best_position', q3.best_pos, 'pages', q3.pages)),
              q3.impressions, q3.clicks,
              greatest(q3.impressions * (curve.c->>((r3.params->>'target_position')::int - 1))::numeric - q3.clicks, 0),
              q3.days
       from q3, r3, curve
       where q3.paths >= (r3.params->>'min_paths')::int and q3.best_pos > (r3.params->>'best_pos_above')::numeric),
     land as (
       select distinct public.signals_page_path(l.first_visit_landing_page) as path
       from public.signals_leads l, r5
       where l.excluded_reason is null and l.first_visit_landing_page is not null
         and l.day > (now() at time zone 'Europe/Lisbon')::date - (r5.params->>'lead_days')::int),
     p5 as (
       select 'P5'::text, m.page,
              jsonb_build_array(jsonb_build_object('impressions_cur', m.impressions_cur, 'impressions_prev', m.impressions_prev,
                                'clicks_cur', m.clicks_cur, 'clicks_prev', m.clicks_prev, 'direction', m.direction)),
              m.impressions_cur, m.clicks_cur,
              greatest(m.clicks_prev - m.clicks_cur, 1)::numeric, 28
       from public.signals_gsc_page_movers m join land on land.path = public.signals_page_path(m.page)
       where m.direction in ('down', 'gone')),
     allc as (select * from p1 union all select * from p2 union all select * from p3 union all select * from p5)
select c.rule, c.page, public.signals_page_path(c.page) as path,
       (public.signals_page_path(c.page) = regexp_replace(split_part(c.page, '?', 1), '^https?://[^/]+', '')
        or regexp_replace(c.page, '^https?://[^/]+', '') in ('', '/')) as is_en,
       w.sector, w.weight, c.queries, c.impressions, c.clicks,
       round(c.missed_clicks, 1) as missed_clicks,
       round(least(c.days / 28.0, 1), 2) as confidence,
       case when c.rule in ('P1', 'P2')
             and (public.signals_page_path(c.page) = regexp_replace(split_part(c.page, '?', 1), '^https?://[^/]+', '')
                  or regexp_replace(c.page, '^https?://[^/]+', '') in ('', '/'))
            then 'T1' else 'T2' end as tier,
       round(c.missed_clicks * w.weight * least(c.days / 28.0, 1)
             * case when c.rule in ('P1', 'P2') then 1.0 else 0.5 end, 1) as score
from allc c cross join lateral public.signals_page_weight(c.page) w;

revoke all on public.signals_gsc_pq_window, public.signals_proposal_candidates from public, anon, authenticated;
grant select on public.signals_gsc_pq_window, public.signals_proposal_candidates to service_role;
