-- Award tiers are now: Gold 85+, Silver 75+, Pass 61+, else Fail (no separate "incentive" tier).
-- Postgres can't drop enum values, so 'incentive' stays in the types but is relabelled and blocked.

update public.ippt_attempts
set award = case
  when total >= 85 then 'gold'
  when total >= 75 then 'silver'
  when total >= 61 then 'pass'
  else 'fail'
end::public.ippt_award;

update public.goals set ippt_target = 'pass' where ippt_target = 'incentive';

alter table public.ippt_attempts
  add constraint ippt_attempts_award_no_incentive check (award <> 'incentive');

alter table public.goals
  add constraint goals_ippt_target_no_incentive check (ippt_target <> 'incentive');
