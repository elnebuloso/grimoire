-- When a key last authenticated a request, so unused keys can be found and revoked. Written at
-- most once a minute per key, not on every request.
ALTER TABLE api_keys ADD COLUMN last_used_at TEXT;
-- The last calendar day, in the time zone of the instance, on which the key is accepted; NULL for
-- a key that does not expire.
ALTER TABLE api_keys ADD COLUMN valid_until TEXT
	CHECK (valid_until GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]');
