-- Tokens are encrypted by the application, which SQL cannot do; no installation stored clear
-- tokens before this migration, so clearing them loses nothing.
ALTER TABLE sources RENAME COLUMN token TO encrypted_token;
UPDATE sources SET encrypted_token = NULL;
