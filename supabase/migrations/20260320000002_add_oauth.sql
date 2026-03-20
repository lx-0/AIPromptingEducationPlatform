-- Add Google OAuth support to users table.
-- password_hash becomes nullable for OAuth-only accounts.
-- oauth_provider + oauth_provider_id track the linked provider.

ALTER TABLE users
  ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE users
  ADD COLUMN oauth_provider    TEXT,
  ADD COLUMN oauth_provider_id TEXT;

ALTER TABLE users
  ADD CONSTRAINT users_oauth_provider_id_unique
  UNIQUE (oauth_provider, oauth_provider_id);

CREATE INDEX idx_users_oauth
  ON users (oauth_provider, oauth_provider_id)
  WHERE oauth_provider IS NOT NULL;
