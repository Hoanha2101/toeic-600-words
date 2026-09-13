-- ==============================================================================
-- 0002_leaderboard.sql: Leaderboard view and additional performance indexes
-- ==============================================================================

-- 1. Performance indexes
create index if not exists idx_ts_user_finished on public.test_sessions(user_id, finished_at desc);
create index if not exists idx_uwp_user_status on public.user_word_progress(user_id, status);
create index if not exists idx_words_lesson on public.words(lesson_id);

-- 2. Leaderboard view
create or replace view public.leaderboard_view as
select
  p.id as user_id,
  coalesce(p.display_name, 'Học viên') as display_name,
  count(distinct uwp.word_id) filter (where uwp.status in ('learned','mastered')) as words_learned,
  count(distinct uwp.word_id) filter (where uwp.status = 'mastered') as words_mastered,
  coalesce(round(avg(ts.score_percent)::numeric, 1), 0.0) as avg_test_score,
  coalesce(us.streak_days, 0) as streak_days,
  coalesce(us.total_study_seconds, 0) as total_study_seconds
from public.profiles p
left join public.user_word_progress uwp on uwp.user_id = p.id
left join public.test_sessions ts on ts.user_id = p.id and ts.finished_at is not null
left join public.user_state us on us.user_id = p.id
group by p.id, p.display_name, us.streak_days, us.total_study_seconds;

-- 3. Security on view: allow authenticated users to select
grant select on public.leaderboard_view to authenticated, anon;
