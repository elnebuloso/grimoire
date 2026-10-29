-- Settings of the whole instance, changed in the admin area: one row, one typed column per setting.
CREATE TABLE settings (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	-- 1 while the admin has paused all syncs: polling checks no source, "sync now" still syncs.
	syncs_paused INTEGER NOT NULL DEFAULT 0 CHECK (syncs_paused IN (0, 1))
);
INSERT INTO settings (id) VALUES (1);
