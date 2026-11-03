-- Invitations an admin sent to an email address that has no account yet. Only a hash of the token
-- in the link is stored, like the password reset links. Accepting one deletes it.
CREATE TABLE invitations (
	id INTEGER PRIMARY KEY,
	email TEXT NOT NULL UNIQUE CHECK (email = lower(email)),
	token_hash TEXT NOT NULL UNIQUE,
	invited_by INTEGER REFERENCES users (id) ON DELETE SET NULL,
	-- When the current link was sent; sending again replaces the link and this time.
	sent_at TEXT NOT NULL,
	expires_at TEXT NOT NULL
) STRICT;
