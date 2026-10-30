-- `last_synced_at` now means "the index is from then"; failed syncs used to set it as well. Take
-- the newest successful run instead, and none where the source never had an index. A source with
-- an index but no successful run left in its trimmed history keeps the value it has.
UPDATE sources SET last_synced_at = coalesce(
	(SELECT max(finished_at) FROM sync_runs WHERE source_id = sources.id AND outcome = 'synced'),
	CASE WHEN last_commit IS NULL THEN NULL ELSE last_synced_at END
);
