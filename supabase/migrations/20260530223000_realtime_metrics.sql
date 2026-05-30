-- Create platform_metrics view for landing page dynamic stats
create or replace view public.platform_metrics as
select
  coalesce((select round(avg(rating)::numeric, 1) from public.reviews), 0.0) as average_rating,
  (select count(*)::integer from public.swap_requests where status = 'Completed') as completed_swaps,
  (select count(distinct lower(trim(skill_name)))::integer from (
     select skill_name from public.skills_offered
     union all
     select skill_name from public.skills_wanted
   ) as s
  ) as tracked_skills;

-- Expose select privileges to public roles
grant select on public.platform_metrics to anon, authenticated;
