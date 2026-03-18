-- Migration: Add gamification tables (streaks, user_badges)

-- ============================================================
-- streaks
-- Tracks consecutive submission-days per trainee (global).
-- ============================================================
CREATE TABLE public.streaks (
  trainee_id      UUID  PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak  INT   NOT NULL DEFAULT 0,
  longest_streak  INT   NOT NULL DEFAULT 0,
  last_sub_date   DATE,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.streaks IS 'Consecutive daily submission streak per trainee';

-- ============================================================
-- user_badges
-- One row per earned badge per trainee (unique per badge_type).
-- ============================================================
CREATE TABLE public.user_badges (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_type  TEXT        NOT NULL,
  earned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trainee_id, badge_type)
);

COMMENT ON TABLE public.user_badges IS 'Gamification badges earned by trainees';

CREATE INDEX idx_user_badges_trainee_id ON public.user_badges (trainee_id);

-- ============================================================
-- RLS policies for new tables
-- ============================================================

ALTER TABLE public.streaks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Trainees see only their own streak
CREATE POLICY "trainees_select_own_streak" ON public.streaks
  FOR SELECT USING (auth.uid() = trainee_id);

-- Trainees see only their own badges
CREATE POLICY "trainees_select_own_badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = trainee_id);
