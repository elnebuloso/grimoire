-- Accounts, any number of them; what a user may do follows from their roles. Replaces the
-- single-row admin table, whose account becomes the first user with the role admin.
CREATE TABLE users (
	id INTEGER PRIMARY KEY,
	username TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL
) STRICT;

-- One row per user and role. The roles that exist are the ones the code knows; a new role is a
-- new migration widening this check.
CREATE TABLE user_roles (
	user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	role TEXT NOT NULL CHECK (role IN ('admin')),
	PRIMARY KEY (user_id, role)
) STRICT;

CREATE TABLE sessions (
	token_hash TEXT PRIMARY KEY,
	user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	expires_at TEXT NOT NULL
) STRICT;
CREATE INDEX sessions_user ON sessions (user_id);

INSERT INTO users (id, username, password_hash) SELECT id, username, password_hash FROM admin;
INSERT INTO user_roles (user_id, role) SELECT id, 'admin' FROM admin;
-- The old sessions all belonged to the one admin.
INSERT INTO sessions (token_hash, user_id, expires_at)
	SELECT token_hash, admin.id, expires_at FROM admin_sessions JOIN admin;

DROP TABLE admin_sessions;
DROP TABLE admin;
