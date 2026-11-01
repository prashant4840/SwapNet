-- Drop view if exists to prevent column data type mismatch (SQLSTATE 42P16)
drop view if exists public.platform_metrics;

-- Create platform_metrics view for landing page dynamic stats
-- Ensure completed_swaps and tracked_skills retain bigint data type
create view public.platform_metrics as
select
  coalesce((select round(avg(rating)::numeric, 1) from public.reviews), 0.0) as average_rating,
  (select count(*)::bigint from public.swap_requests where status = 'Completed') as completed_swaps,
  (select count(distinct lower(trim(skill_name)))::bigint from (
     select skill_name from public.skills_offered
     union all
     select skill_name from public.skills_wanted
   ) as s
  ) as tracked_skills;

-- Expose select privileges to public roles
grant select on public.platform_metrics to anon, authenticated;
