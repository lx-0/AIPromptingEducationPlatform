-- Add llm_call_logs table for token usage tracking.
-- Referenced in app/api/exercises/[id]/execute/route.ts but was missing from migrations.
CREATE TABLE IF NOT EXISTS public.llm_call_logs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id  UUID        NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  provider       TEXT        NOT NULL,
  model          TEXT        NOT NULL,
  input_tokens   INTEGER,
  output_tokens  INTEGER,
  logged_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.llm_call_logs IS 'Token usage log per LLM call for cost tracking';

CREATE INDEX idx_llm_call_logs_submission_id ON public.llm_call_logs (submission_id);
