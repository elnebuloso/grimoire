import type { DatabaseSync } from 'node:sqlite';

export interface Settings {
	/** Polling checks no source; the sources keep their own `paused` flag and schedule. */
	syncsPaused: boolean;
}

export function readSettings(db: DatabaseSync): Settings {
	const row = db.prepare('SELECT syncs_paused FROM settings').get() as { syncs_paused: number };
	return { syncsPaused: row.syncs_paused === 1 };
}

export function saveSettings(db: DatabaseSync, settings: Settings) {
	db.prepare('UPDATE settings SET syncs_paused = ?').run(settings.syncsPaused ? 1 : 0);
}
