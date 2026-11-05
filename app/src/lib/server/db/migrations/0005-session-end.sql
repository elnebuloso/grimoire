-- A session ends after an hour without a request of its user, and at the latest 12 hours after the
-- login: each request moves `expires_at` on, never past `ends_at`. Sessions from before have no end
-- of their own; their users log in again.
DROP TABLE sessions;
CREATE TABLE sessions (
	token_hash TEXT PRIMARY KEY,
	user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	expires_at TEXT NOT NULL,
	ends_at TEXT NOT NULL,
	CHECK (expires_at <= ends_at)
) STRICT;
CREATE INDEX sessions_user ON sessions (user_id);
