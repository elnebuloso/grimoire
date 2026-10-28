-- The one local admin account; set up in the admin area on first start.
CREATE TABLE admin (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	username TEXT NOT NULL,
	password_hash TEXT NOT NULL
) STRICT;

CREATE TABLE admin_sessions (
	token_hash TEXT PRIMARY KEY,
	expires_at TEXT NOT NULL
) STRICT;
