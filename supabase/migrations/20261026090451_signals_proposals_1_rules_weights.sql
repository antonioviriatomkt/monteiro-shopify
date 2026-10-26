-- Task 4 (Monteiro agent system) — weekly proposals from GSC + leads, 2026-10-26
--
-- SQL finds and scores candidates; the Monday Claude run only words them. Nothing here changes
-- the site: a proposal is a row in signals_proposals (status draft → proposed → approved/rejected
-- → applied | expired). Task 5 applies approved T1 changes (EN titles/metas only).
--
--   signals_page_weights         path regex → ICP sector + weight (tune with UPDATE / INSERT)
--   signals_page_path(url)       locale-free path ('/pt/collections/x' → '/collections/x')
--   signals_page_weight(url)     first matching weight (lowest priority number wins)
--   signals_gsc_pq_window        page × query over the last N final GSC days (brand/junk out)
--   signals_proposal_candidates  P1 CTR gap · P2 striking distance · P3 cannibalisation ·
--                                P5 lead landing losing impressions — scored
--   signals_proposals            proposals made, with evidence + Claude's text + decisions
--   signals_proposals_pick(run)  top N new candidates → draft rows of that pulse run
--   signals_proposal_text(id,t)  Claude stores its wording
--   signals_proposal_decide(id,d,note)  approve / reject / applied (António, Task 5)
--   signals_pulse_prepare / _ack replaced: weekly payload gets 'proposals'; ack drafts → proposed
--
-- Decisions 26/10 (António): sources v1 = GSC + leads · weight by ICP sector · T1 = EN only ·
-- empty week = «sem propostas» (min_score floor, no filler).
-- Access as in Task 3: RLS on, no policies, views security_invoker, nothing for anon/authenticated.

-- ── Rules (thresholds as data) ────────────────────────────────────────────────────────────────
insert into public.signals_rules (rule, title, severity, params, description) values
('P0', 'Proposal selection', 'info',
 '{"window_days": 28, "max": 3, "min_score": 2, "cooldown_days": 28, "expire_days": 28,
   "ctr_curve": [0.28, 0.15, 0.10, 0.07, 0.05, 0.04, 0.03, 0.025, 0.02, 0.018,
                 0.012, 0.011, 0.010, 0.009, 0.008, 0.007, 0.006, 0.006, 0.005, 0.005],
   "exclude_query_regex": "monteiro|^[0-9 .,]+( ?(euros?|eur|€))?$"}',
 'Shared settings: GSC window, max proposals per week, score floor, re-proposal cooldown, expected CTR by rounded position (1–20), brand/junk queries excluded.'),
('P1', 'CTR gap', 'info',
 '{"pos_min": 4, "pos_max": 8, "min_impressions": 50, "ctr_factor": 0.5}',
 'Page × query at avg position 4–8 with ≥50 impressions and CTR below half the expected CTR for that position → rewrite title/meta.'),
('P2', 'Striking distance', 'info',
 '{"pos_min": 8.05, "pos_max": 20, "min_impressions": 80, "target_position": 5}',
 'Page × query at avg position 8–20 with ≥80 impressions → work the query into title/H1/intro or add an internal link. Missed clicks = clicks it would get at position 5.'),
('P3', 'Cannibalisation', 'info',
 '{"min_impressions": 30, "min_paths": 2, "best_pos_above": 5, "target_position": 3}',
 'Same query with ≥30 impressions on ≥2 different (locale-free) pages, none better than position 5 → pick one target, link/merge.'),
('P5', 'Lead landing losing impressions', 'info',
 '{"lead_days": 90}',
 'A page that was the first-visit landing of a counted lead in 90 days is a page mover going down/gone → check indexing/title.');

-- ── Page weights (ICP 20/10: tier A = contract, office, hospitality, healthcare, marine) ──────
create table public.signals_page_weights (
  pattern  text    primary key,             -- POSIX regex on signals_page_path()
  sector   text    not null,
  weight   numeric not null check (weight between 0 and 1),
  priority int     not null default 100     -- lower wins
);
comment on table public.signals_page_weights is
  'Business weight of a page for proposals, by ICP sector (draft ICP, pending Ivana). Service role only.';
insert into public.signals_page_weights (pattern, sector, weight, priority) values
('^/collections/(healthcare|medical|chance-mediflex)(/|$)|^/pages/mediflex', 'healthcare', 1.0, 10),
('^/collections/(hospitality-fabrics|hospitality)(/|$)', 'hospitality', 1.0, 10),
('^/collections/(contract|office-fabrics-upholstery|public-spaces|retail)(/|$)', 'contract & office', 1.0, 10),
('^/collections/(marine|outdoor|outdoor-pt|chance-outdoor)(/|$)|^/pages/siesta', 'marine & outdoor', 1.0, 10),
('^/collections/(fashion|mode|footwear)(/|$)', 'not a target', 0.1, 15),
('^/collections/(automotive|automobile[^/]*|motorcycle|recreational-vehicles|aviation|mass-transportation|train)(/|$)', 'automotive & transport', 0.7, 20),
('^/pages/(amostras-gratis|free-samples|muestras[^/]*|echantillons[^/]*|campioni[^/]*|contact|contacto|contatti|kontakt)', 'conversion page', 0.9, 30),
('^/(products|collections/[^/]+/products)/', 'product', 0.8, 40),
('^/collections/(chance|chance-[^/]+|coated-fabrics|tissus-enduits|tecidos-revestidos|tejidos-recubiertos|all)(/|$)', 'product', 0.8, 40),
('^/pages/([a-z0-9-]*collection[a-z0-9-]*|straw|mcdonalds-fabrics|amazonia[a-z0-9-]*)$', 'product', 0.8, 45),
('^/blogs/technical-hub/', 'technical hub', 0.6, 50),
('^/$|^/pages/(about-us|sobre-nos|press|quality)', 'brand', 0.4, 60),
('.*', 'other', 0.3, 999);

create function public.signals_page_path(p_url text) returns text
language sql immutable set search_path = '' as $$
  select coalesce(nullif(
           regexp_replace(
             regexp_replace(split_part(split_part(coalesce(p_url, ''), '?', 1), '#', 1), '^https?://[^/]+', ''),
             '^/(pt|fr|it|es|de|en)(-[a-z]{2})?(?=/|$)', ''),
         ''), '/')
$$;

create function public.signals_page_weight(p_url text) returns table (sector text, weight numeric)
language sql stable set search_path = '' as $$
  select w.sector, w.weight from public.signals_page_weights w
  where public.signals_page_path(p_url) ~ w.pattern
  order by w.priority limit 1
$$;

alter table public.signals_page_weights enable row level security;
revoke all on public.signals_page_weights from public, anon, authenticated;
grant all on public.signals_page_weights to service_role;
revoke all on function public.signals_page_path(text)   from public, anon, authenticated;
revoke all on function public.signals_page_weight(text) from public, anon, authenticated;
grant execute on function public.signals_page_path(text), public.signals_page_weight(text) to service_role;
