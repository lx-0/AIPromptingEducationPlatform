-- Migration: Add collaboration features
-- Tables: discussions, peer_reviews, follows, notifications
-- Columns added to workshops: peer_review_enabled

-- ============================================================
-- discussions
-- ============================================================
CREATE TABLE public.discussions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID        NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  author_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body        TEXT        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  parent_id   UUID        REFERENCES public.discussions(id) ON DELETE CASCADE,
  is_pinned   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.discussions IS 'Threaded Q&A discussions attached to exercises';

CREATE INDEX idx_discussions_exercise_id ON public.discussions (exercise_id, created_at DESC);
CREATE INDEX idx_discussions_parent_id   ON public.discussions (parent_id)  WHERE parent_id IS NOT NULL;
CREATE INDEX idx_discussions_author_id   ON public.discussions (author_id);

-- ============================================================
-- peer_review_settings (column on workshops)
-- ============================================================
ALTER TABLE public.workshops
  ADD COLUMN IF NOT EXISTS peer_review_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- peer_reviews
-- ============================================================
CREATE TABLE public.peer_reviews (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id  UUID        NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  reviewer_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feedback_text  TEXT        NOT NULL CHECK (char_length(feedback_text) BETWEEN 10 AND 3000),
  rating         SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id, reviewer_id)
);

COMMENT ON TABLE public.peer_reviews IS 'Peer-to-peer feedback on exercise submissions';

CREATE INDEX idx_peer_reviews_submission_id ON public.peer_reviews (submission_id);
CREATE INDEX idx_peer_reviews_reviewer_id   ON public.peer_reviews (reviewer_id);

-- ============================================================
-- peer_review_assignments
-- ============================================================
CREATE TABLE public.peer_review_assignments (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id   UUID        NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  reviewer_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_id UUID        NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  UNIQUE (reviewer_id, submission_id)
);

COMMENT ON TABLE public.peer_review_assignments IS 'Tracks which trainee is assigned to review which submission';

CREATE INDEX idx_pra_workshop_id   ON public.peer_review_assignments (workshop_id);
CREATE INDEX idx_pra_reviewer_id   ON public.peer_review_assignments (reviewer_id, completed_at);
CREATE INDEX idx_pra_submission_id ON public.peer_review_assignments (submission_id);

-- ============================================================
-- follows
-- ============================================================
CREATE TABLE public.follows (
  follower_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  instructor_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, instructor_id),
  CHECK (follower_id <> instructor_id)
);

COMMENT ON TABLE public.follows IS 'Trainees following instructors for new-workshop notifications';

CREATE INDEX idx_follows_instructor_id ON public.follows (instructor_id);

-- ============================================================
-- notifications
-- ============================================================
CREATE TYPE public.notification_type AS ENUM (
  'discussion_reply',
  'peer_review_received',
  'new_workshop_from_followed',
  'peer_review_assigned'
);

CREATE TABLE public.notifications (
  id         UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID                      NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       public.notification_type  NOT NULL,
  payload    JSONB                     NOT NULL DEFAULT '{}',
  read       BOOLEAN                   NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ               NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.notifications IS 'In-app notification inbox for users';

CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, created_at DESC) WHERE read = FALSE;
CREATE INDEX idx_notifications_user_id     ON public.notifications (user_id, created_at DESC);
