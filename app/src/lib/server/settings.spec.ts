import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from './db/schema';
import { readSettings, saveSettings, syncsAutomatically } from './settings';

let dir: string | undefined;

afterEach(() => {
	if (dir) rmSync(dir, { recursive: true, force: true });
	dir = undefined;
});

describe('settings', () => {
	it('start with syncs not paused', () => {
		expect(readSettings(openDatabase(':memory:'))).toEqual({ syncsPaused: false });
	});

	it('are kept in the database file across a restart', () => {
		dir = mkdtempSync(join(tmpdir(), 'grimoire-settings-'));
		const path = join(dir, 'grimoire.db');
		const db = openDatabase(path);
		saveSettings(db, { syncsPaused: true });
		db.close();

		expect(readSettings(openDatabase(path))).toEqual({ syncsPaused: true });
	});

	it('are a single row the schema keeps single', () => {
		const db = openDatabase(':memory:');
		expect(() => db.prepare('INSERT INTO settings (id) VALUES (2)').run()).toThrow(/CHECK/);
		expect(() => db.prepare('UPDATE settings SET syncs_paused = 2').run()).toThrow(/CHECK/);
	});
});

describe('syncsAutomatically', () => {
	it('is true only while neither the source nor all syncs are paused', () => {
		const db = openDatabase(':memory:');

		expect(syncsAutomatically(db, { paused: false })).toBe(true);
		expect(syncsAutomatically(db, { paused: true })).toBe(false);
		saveSettings(db, { syncsPaused: true });
		expect(syncsAutomatically(db, { paused: false })).toBe(false);
	});
});
