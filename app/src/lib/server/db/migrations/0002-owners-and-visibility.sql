-- Users own the sources and API keys they create. Who may read a source is one of three levels:
-- `private` only with keys of its owner, `internal` with the key of any user, `public` also
-- without a key. A new source is private.
ALTER TABLE sources ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private'
	CHECK (visibility IN ('private', 'internal', 'public'));
-- Before owners, any key read a private source: `internal` keeps what existing keys read.
UPDATE sources SET visibility = CASE public WHEN 1 THEN 'public' ELSE 'internal' END;
ALTER TABLE sources DROP COLUMN public;

-- NULL while the source or key belongs to nobody: what existed before owners did on an instance
-- without an admin, or what a reset admin left behind. The next setup hands it to the new admin.
ALTER TABLE sources ADD COLUMN owner_id INTEGER REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE api_keys ADD COLUMN owner_id INTEGER REFERENCES users (id) ON DELETE CASCADE;
CREATE INDEX sources_owner ON sources (owner_id);
CREATE INDEX api_keys_owner ON api_keys (owner_id);

UPDATE sources SET owner_id = (SELECT min(user_id) FROM user_roles WHERE role = 'admin');
UPDATE api_keys SET owner_id = (SELECT min(user_id) FROM user_roles WHERE role = 'admin');
