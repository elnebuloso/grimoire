-- A source is `internal`, read with the key of any user, or `public`, also read without a key; a new
-- source is internal. Sources have no owner: only admins manage them. A private source becomes
-- internal, so nothing that was indexed disappears.
ALTER TABLE sources RENAME COLUMN visibility TO old_visibility;
ALTER TABLE sources ADD COLUMN visibility TEXT NOT NULL DEFAULT 'internal'
	CHECK (visibility IN ('internal', 'public'));
UPDATE sources SET visibility = CASE old_visibility WHEN 'public' THEN 'public' ELSE 'internal' END;
ALTER TABLE sources DROP COLUMN old_visibility;

DROP INDEX sources_owner;
ALTER TABLE sources DROP COLUMN owner_id;
