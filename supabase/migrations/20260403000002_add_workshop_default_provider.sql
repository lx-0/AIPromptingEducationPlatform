-- Add default_provider to workshops for workshop-level LLM provider configuration.
-- Exercises override this via their model_config.provider field.
ALTER TABLE workshops
  ADD COLUMN IF NOT EXISTS default_provider TEXT NOT NULL DEFAULT 'anthropic'
    CHECK (default_provider IN ('anthropic', 'openai', 'google'));
