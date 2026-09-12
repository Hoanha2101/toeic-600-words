-- ==============================================================================
-- 0001_init.sql: Initial schema for 600 Essential Words TOEIC Learning App
-- ==============================================================================

-- 1. Lessons table
create table if not exists public.lessons (
  id serial primary key,
  lesson_number int unique not null,
  title_en text not null,
  title_vi text not null
);

-- 2. Words table
create table if not exists public.words (
  id serial primary key,
  lesson_id int references public.lessons(id) on delete cascade,
  word text not null,
  part_of_speech text,
  definition_en text,
  related_forms text,
  meaning_vi text,
  audio_url text,           -- cache link phát âm lấy từ dictionary API
  audio_url_uk text,        -- (optional) giọng UK nếu có
  created_at timestamptz default now(),
  unique(lesson_id, word)
);

create index if not exists idx_words_lesson_id on public.words(lesson_id);
create index if not exists idx_words_word on public.words(word);

-- 3. Profiles table (synced with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

-- 4. User word progress
do $$ begin
  create type word_status as enum ('new', 'learning', 'learned', 'mastered');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.user_word_progress (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  word_id int references public.words(id) on delete cascade,
  status word_status not null default 'new',
  -- Spaced Repetition (thuật toán SM-2 rút gọn)
  ease_factor numeric not null default 2.5,
  interval_days numeric not null default 0,
  repetitions int not null default 0,
  due_date timestamptz not null default now(),   -- lần ôn tập kế tiếp
  last_reviewed_at timestamptz,
  correct_count int not null default 0,
  wrong_count int not null default 0,
  is_marked_known boolean not null default false, -- user tự đánh dấu "đã thuộc"
  updated_at timestamptz not null default now(),
  unique(user_id, word_id)
);

create index if not exists idx_uwp_due on public.user_word_progress(user_id, due_date);
create index if not exists idx_uwp_user_word on public.user_word_progress(user_id, word_id);
create index if not exists idx_uwp_status on public.user_word_progress(user_id, status);

-- 5. User lesson progress
create table if not exists public.user_lesson_progress (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  lesson_id int references public.lessons(id) on delete cascade,
  words_total int not null default 0,
  words_learned int not null default 0,
  is_completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);

create index if not exists idx_ulp_user_lesson on public.user_lesson_progress(user_id, lesson_id);

-- 6. User state (phiên học gần nhất)
create table if not exists public.user_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_lesson_id int references public.lessons(id),
  current_word_index int default 0,       -- vị trí từ đang học dở trong bài (0-indexed)
  current_mode text default 'learn',       -- 'learn' | 'flashcard' | 'review' | 'test'
  last_active_at timestamptz default now(),
  streak_days int default 0,
  last_streak_date date,
  total_study_seconds int default 0
);

-- 7. Test sessions & test answers
create table if not exists public.test_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  lesson_id int references public.lessons(id),      -- null nếu test tổng hợp nhiều bài
  test_type text not null,                          -- 'multiple_choice' | 'listening' | 'fill_blank' | 'mixed'
  total_questions int not null,
  correct_answers int not null default 0,
  score_percent numeric,
  started_at timestamptz default now(),
  finished_at timestamptz
);

create index if not exists idx_ts_user on public.test_sessions(user_id, started_at desc);

create table if not exists public.test_answers (
  id bigserial primary key,
  test_session_id uuid references public.test_sessions(id) on delete cascade,
  word_id int references public.words(id),
  question_type text not null,
  is_correct boolean not null,
  user_answer text,
  correct_answer text,
  answered_at timestamptz default now()
);

create index if not exists idx_ta_session on public.test_answers(test_session_id);

-- 8. Trigger handle_new_user: auto create profile and initial user_state
create or replace function public.handle_new_user()
returns trigger as $$
declare
  first_lesson_id int;
begin
  -- Get first lesson id if available
  select id into first_lesson_id from public.lessons order by lesson_number asc limit 1;

  -- Insert profile
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email))
  on conflict (id) do nothing;

  -- Insert default user_state
  insert into public.user_state (user_id, current_lesson_id, current_word_index, current_mode, streak_days)
  values (new.id, first_lesson_id, 0, 'learn', 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 9. Row Level Security (RLS)
alter table public.lessons enable row level security;
alter table public.words enable row level security;
alter table public.profiles enable row level security;
alter table public.user_word_progress enable row level security;
alter table public.user_lesson_progress enable row level security;
alter table public.user_state enable row level security;
alter table public.test_sessions enable row level security;
alter table public.test_answers enable row level security;

-- Lessons: public read, service role write
create policy "Lessons are viewable by everyone"
  on public.lessons for select
  using (true);

-- Words: public read, allow authenticated users to update audio_url if empty, service role full
create policy "Words are viewable by everyone"
  on public.words for select
  using (true);

create policy "Authenticated users can update word audio_url"
  on public.words for update
  to authenticated
  using (true)
  with check (true);

-- Profiles: users can select and update own profile
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

-- User Word Progress: users have full control of their own progress
create policy "Users can view own word progress"
  on public.user_word_progress for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own word progress"
  on public.user_word_progress for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own word progress"
  on public.user_word_progress for update
  to authenticated
  using (user_id = auth.uid());

-- User Lesson Progress
create policy "Users can view own lesson progress"
  on public.user_lesson_progress for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own lesson progress"
  on public.user_lesson_progress for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own lesson progress"
  on public.user_lesson_progress for update
  to authenticated
  using (user_id = auth.uid());

-- User State
create policy "Users can view own state"
  on public.user_state for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own state"
  on public.user_state for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own state"
  on public.user_state for update
  to authenticated
  using (user_id = auth.uid());

-- Test Sessions
create policy "Users can view own test sessions"
  on public.test_sessions for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert own test sessions"
  on public.test_sessions for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own test sessions"
  on public.test_sessions for update
  to authenticated
  using (user_id = auth.uid());

-- Test Answers
create policy "Users can view own test answers"
  on public.test_answers for select
  to authenticated
  using (
    exists (
      select 1 from public.test_sessions
      where test_sessions.id = test_answers.test_session_id
      and test_sessions.user_id = auth.uid()
    )
  );

create policy "Users can insert own test answers"
  on public.test_answers for insert
  to authenticated
  with check (
    exists (
      select 1 from public.test_sessions
      where test_sessions.id = test_answers.test_session_id
      and test_sessions.user_id = auth.uid()
    )
  );
