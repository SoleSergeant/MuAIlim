-- ============================================================
-- MuAIlim — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable pgvector for RAG (optional, run if needed)
-- create extension if not exists vector;

-- ── User profiles ──────────────────────────────────────────
create table if not exists public.user_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'O''quvchi',
  exam_type    text not null default 'dtm'
                 check (exam_type in ('dtm','attestat_9','teacher','national_cert')),
  subjects     text[] not null default array['math','history','uzbek'],
  goal_score   int  not null default 160,
  exam_date    date,
  streak       int  not null default 0,
  streak_freeze int not null default 0,
  is_premium   boolean not null default false,
  last_active  timestamptz default now(),
  created_at   timestamptz default now()
);

alter table public.user_profiles enable row level security;
create policy "Users manage own profile"
  on public.user_profiles for all using (auth.uid() = id);

-- ── Questions ──────────────────────────────────────────────
create table if not exists public.questions (
  id             text primary key,
  subject        text not null check (subject in ('math','history','uzbek','english','physics','chemistry','biology')),
  topic          text not null,
  difficulty     text not null check (difficulty in ('easy','medium','hard')),
  text           text not null,
  options        jsonb not null,
  correct_index  int  not null,
  source         text not null default 'ai_generated',
  year           int,
  created_at     timestamptz default now()
);

create index if not exists questions_subject_idx on public.questions(subject);
create index if not exists questions_topic_idx   on public.questions(topic);

-- ── Mock sessions ──────────────────────────────────────────
create table if not exists public.mock_sessions (
  id              text primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  exam_type       text not null default 'dtm',
  score_pct       int,
  correct_count   int,
  total_questions int,
  ai_summary      text,
  created_at      timestamptz default now()
);

alter table public.mock_sessions enable row level security;
create policy "Users see own sessions"
  on public.mock_sessions for all using (auth.uid() = user_id);

create index if not exists mock_sessions_user_idx on public.mock_sessions(user_id);

-- ── Mock answers ───────────────────────────────────────────
create table if not exists public.mock_answers (
  id               uuid primary key default gen_random_uuid(),
  session_id       text not null references public.mock_sessions(id) on delete cascade,
  question_id      text not null,
  selected_index   int  not null,
  is_correct       boolean not null,
  time_spent_secs  int  not null default 0,
  created_at       timestamptz default now()
);

alter table public.mock_answers enable row level security;
create policy "Users see own answers"
  on public.mock_answers for all
  using (
    exists (
      select 1 from public.mock_sessions ms
      where ms.id = session_id and ms.user_id = auth.uid()
    )
  );

-- ── Weakness topics ────────────────────────────────────────
create table if not exists public.weakness_topics (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  subject        text not null,
  topic          text not null,
  accuracy_pct   int  not null default 0,
  question_count int  not null default 0,
  priority       text not null default 'medium' check (priority in ('high','medium','low')),
  updated_at     timestamptz default now(),
  unique (user_id, subject, topic)
);

alter table public.weakness_topics enable row level security;
create policy "Users see own weaknesses"
  on public.weakness_topics for all using (auth.uid() = user_id);

create index if not exists weakness_user_idx on public.weakness_topics(user_id, accuracy_pct asc);

-- ── Error notebook (spaced repetition) ────────────────────
create table if not exists public.error_notebook (
  id              text primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,
  question_id     text not null,
  question_text   text not null,
  correct_answer  text not null,
  subject         text not null,
  topic           text not null,
  repetition      int  not null default 0,
  interval_days   int  not null default 1,
  next_review     timestamptz not null default now() + interval '1 day',
  mastered        boolean not null default false,
  created_at      timestamptz default now()
);

alter table public.error_notebook enable row level security;
create policy "Users manage own notebook"
  on public.error_notebook for all using (auth.uid() = user_id);

create index if not exists notebook_user_review_idx
  on public.error_notebook(user_id, next_review asc)
  where mastered = false;

-- ── Leaderboard scores ─────────────────────────────────────
create table if not exists public.leaderboard_scores (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  exam_type    text not null default 'dtm',
  score        int  not null default 0,
  streak       int  not null default 0,
  week_start   date not null default date_trunc('week', now())::date,
  updated_at   timestamptz default now(),
  unique (user_id, exam_type, week_start)
);

alter table public.leaderboard_scores enable row level security;
create policy "Leaderboard is public read"
  on public.leaderboard_scores for select using (true);
create policy "Users update own score"
  on public.leaderboard_scores for all using (auth.uid() = user_id);

create index if not exists leaderboard_score_idx
  on public.leaderboard_scores(exam_type, score desc, week_start desc);

-- ── Study plan ─────────────────────────────────────────────
create table if not exists public.study_plan (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  plan_date   date not null,
  subject     text not null,
  topic       text not null,
  question_target int not null default 15,
  completed   boolean not null default false,
  created_at  timestamptz default now(),
  unique (user_id, plan_date, subject, topic)
);

alter table public.study_plan enable row level security;
create policy "Users manage own plan"
  on public.study_plan for all using (auth.uid() = user_id);
