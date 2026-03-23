-- Migration: Add public workshop marketplace
-- Tables: workshop_categories, workshop_tags, workshop_tag_links, workshop_reviews
-- Columns added to workshops: category_id, is_featured, enrollment_count (cached)

-- ============================================================
-- workshop_categories
-- ============================================================
CREATE TABLE public.workshop_categories (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL UNIQUE,
  slug       TEXT        NOT NULL UNIQUE,
  icon       TEXT,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.workshop_categories IS 'Taxonomy categories for workshop discovery';

-- Seed default categories
INSERT INTO public.workshop_categories (name, slug, icon, sort_order) VALUES
  ('Prompt Engineering',   'prompt-engineering',   '🧠', 1),
  ('Creative Writing',     'creative-writing',     '✍️', 2),
  ('Code Generation',      'code-generation',      '💻', 3),
  ('Data Analysis',        'data-analysis',        '📊', 4),
  ('Customer Support',     'customer-support',     '🎧', 5),
  ('Research & Synthesis', 'research-synthesis',   '🔬', 6),
  ('Marketing & Copy',     'marketing-copy',       '📣', 7),
  ('Education & Training', 'education-training',   '🎓', 8),
  ('Business Strategy',    'business-strategy',    '📈', 9),
  ('Other',                'other',                '📦', 10);

-- ============================================================
-- workshop_tags
-- ============================================================
CREATE TABLE public.workshop_tags (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.workshop_tags IS 'Free-form tags for fine-grained workshop discovery';

-- ============================================================
-- workshop_tag_links
-- ============================================================
CREATE TABLE public.workshop_tag_links (
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES public.workshop_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (workshop_id, tag_id)
);

COMMENT ON TABLE public.workshop_tag_links IS 'Many-to-many link between workshops and tags';

CREATE INDEX idx_workshop_tag_links_tag_id ON public.workshop_tag_links (tag_id);

-- ============================================================
-- workshop_reviews
-- ============================================================
CREATE TABLE public.workshop_reviews (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID        NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  trainee_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating      INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workshop_id, trainee_id)   -- one review per trainee per workshop
);

COMMENT ON TABLE public.workshop_reviews IS '1-5 star ratings and text reviews from trainees';

CREATE INDEX idx_workshop_reviews_workshop_id ON public.workshop_reviews (workshop_id);
CREATE INDEX idx_workshop_reviews_trainee_id  ON public.workshop_reviews (trainee_id);

-- ============================================================
-- Add marketplace columns to workshops
-- ============================================================
ALTER TABLE public.workshops
  ADD COLUMN category_id  UUID REFERENCES public.workshop_categories(id) ON DELETE SET NULL,
  ADD COLUMN is_featured  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN trending_score NUMERIC NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.workshops.category_id    IS 'FK to workshop_categories for marketplace filtering';
COMMENT ON COLUMN public.workshops.is_featured    IS 'Pinned to featured section of marketplace';
COMMENT ON COLUMN public.workshops.trending_score IS 'Cached weighted score: enrollments + recent reviews + completion rate';

CREATE INDEX idx_workshops_category_id    ON public.workshops (category_id);
CREATE INDEX idx_workshops_trending_score ON public.workshops (trending_score DESC);

-- ============================================================
-- Add bio column to profiles for instructor public profiles
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN bio          TEXT,
  ADD COLUMN avatar_url   TEXT;

COMMENT ON COLUMN public.profiles.bio        IS 'Instructor public profile bio';
COMMENT ON COLUMN public.profiles.avatar_url IS 'Public avatar URL';

-- ============================================================
-- RLS policies for new tables
-- ============================================================

ALTER TABLE public.workshop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_tags       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_tag_links  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_reviews    ENABLE ROW LEVEL SECURITY;

-- Categories: public read, no writes from client
CREATE POLICY "Anyone can read categories"
  ON public.workshop_categories FOR SELECT USING (true);

-- Tags: public read
CREATE POLICY "Anyone can read tags"
  ON public.workshop_tags FOR SELECT USING (true);

-- Tag links: public read; instructors manage their own workshop's tags
CREATE POLICY "Anyone can read tag links"
  ON public.workshop_tag_links FOR SELECT USING (true);

CREATE POLICY "Instructors manage tag links for their workshops"
  ON public.workshop_tag_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workshops w
      WHERE w.id = workshop_id AND w.instructor_id = auth.uid()
    )
  );

-- Reviews: public read; trainees write their own; no update/delete (immutable)
CREATE POLICY "Anyone can read reviews"
  ON public.workshop_reviews FOR SELECT USING (true);

CREATE POLICY "Trainees can insert their own review"
  ON public.workshop_reviews FOR INSERT
  WITH CHECK (trainee_id = auth.uid());
