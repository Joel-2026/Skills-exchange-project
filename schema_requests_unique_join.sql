-- Ensure a learner can only join a group session once
alter table public.requests
add constraint unique_group_session_learner unique (group_session_id, learner_id);
