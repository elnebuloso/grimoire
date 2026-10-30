-- Links that set a new password, sent by mail. Only a hash of the token is stored, like the
-- session tokens: whoever reads the database cannot use the links.
CREATE TABLE password_resets (
	token_hash TEXT PRIMARY KEY,
	user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	expires_at TEXT NOT NULL
) STRICT;
CREATE INDEX password_resets_user ON password_resets (user_id);
