import type { DatabaseSync } from 'node:sqlite';

export interface Settings {
	/** Polling checks no source; the sources keep their own `paused` flag and schedule. */
	syncsPaused: boolean;
}

export function readSettings(db: DatabaseSync): Settings {
	const row = db.prepare('SELECT syncs_paused FROM settings').get() as { syncs_paused: number };
	return { syncsPaused: row.syncs_paused === 1 };
}

/** Whether polling syncs a source: neither the source nor all syncs are paused. */
export function syncsAutomatically(db: DatabaseSync, source: { paused: boolean }): boolean {
	return !source.paused && !readSettings(db).syncsPaused;
}

export function saveSettings(db: DatabaseSync, settings: Settings) {
	db.prepare('UPDATE settings SET syncs_paused = ?').run(settings.syncsPaused ? 1 : 0);
}
