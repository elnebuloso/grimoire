-- An account created through an identity provider has no password until its owner sets one with a
-- password reset. SQLite cannot drop NOT NULL in place: the table is built anew and takes the old
-- name, so every reference to `users` points at it again. Renaming the old table away first would
-- make SQLite rewrite those references to the old name.
CREATE TABLE users_new (
	id INTEGER PRIMARY KEY,
	email TEXT NOT NULL UNIQUE CHECK (email = lower(email)),
	password_hash TEXT
) STRICT;
INSERT INTO users_new (id, email, password_hash) SELECT id, email, password_hash FROM users;
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- The identity a user is known by at an identity provider: its issuer and the subject it names the
-- user by, never the email address the provider reports. One per provider and user; an identity
-- belongs to one user.
CREATE TABLE user_identities (
	user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
	issuer TEXT NOT NULL,
	subject TEXT NOT NULL,
	PRIMARY KEY (issuer, subject),
	UNIQUE (user_id, issuer)
) STRICT;
