-- How many requests each API key authenticated per calendar day, in the time zone of the instance,
-- so owners and admins can tell a key in heavy use from a forgotten or abused one. Days older than
-- 90 are removed as new counts are written.
CREATE TABLE api_key_requests (
	api_key_id INTEGER NOT NULL REFERENCES api_keys (id) ON DELETE CASCADE,
	day TEXT NOT NULL CHECK (day GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
	requests INTEGER NOT NULL CHECK (requests > 0),
	PRIMARY KEY (api_key_id, day)
) STRICT;
CREATE INDEX api_key_requests_day ON api_key_requests (day);
