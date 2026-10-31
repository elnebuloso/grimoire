import { describe, it, expect, onTestFinished } from 'vitest';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Worker } from 'node:worker_threads';
import { migrate, openMigratedDatabase, type Migration } from './migrate';
import { migrations as shippedMigrations } from './schema';

function userVersion(db: DatabaseSync): number {
	return (db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version;
}

function rows(db: DatabaseSync, sql: string) {
	return db
		.prepare(sql)
		.all()
		.map((row) => ({ ...row }));
}

const createNotes: Migration = { name: '0001-notes.sql', sql: 'CREATE TABLE notes (text TEXT);' };
const addAuthor: Migration = {
	name: '0002-author.sql',
	sql: "ALTER TABLE notes ADD COLUMN author TEXT NOT NULL DEFAULT 'unknown';"
};

describe('migrate', () => {
	it('applies all migrations to a new database', () => {
		const db = new DatabaseSync(':memory:');
		migrate(db, [createNotes, addAuthor]);
		expect(userVersion(db)).toBe(2);
		expect(rows(db, 'PRAGMA table_info(notes)').map((column) => column.name)).toEqual([
			'text',
			'author'
		]);
	});

	it('applies only the newer migrations and keeps the data', () => {
		const db = new DatabaseSync(':memory:');
		migrate(db, [createNotes]);
		db.exec("INSERT INTO notes VALUES ('kept')");

		migrate(db, [createNotes, addAuthor]);
		expect(userVersion(db)).toBe(2);
		expect(rows(db, 'SELECT * FROM notes')).toEqual([{ text: 'kept', author: 'unknown' }]);
	});

	it('rolls back a failing migration, keeps the previous version and names the file', () => {
		const db = new DatabaseSync(':memory:');
		const broken = {
			name: '0002-broken.sql',
			sql: 'CREATE TABLE half (x); SELECT * FROM missing;'
		};

		expect(() => migrate(db, [createNotes, broken])).toThrow(
			/migration 0002-broken.sql failed: no such table: missing/
		);
		expect(userVersion(db)).toBe(1);
		expect(rows(db, "SELECT name FROM sqlite_master WHERE name = 'half'")).toEqual([]);
		expect(db.isTransaction).toBe(false);
	});

	it('rebuilds a referenced table without cascading deletes', () => {
		const db = new DatabaseSync(':memory:');
		const schema = {
			name: '0001-schema.sql',
			sql: `CREATE TABLE sources (id INTEGER PRIMARY KEY, slug TEXT);
				CREATE TABLE pages (id INTEGER PRIMARY KEY,
					source_id INTEGER NOT NULL REFERENCES sources (id) ON DELETE CASCADE);`
		};
		const rebuild = {
			name: '0002-rebuild.sql',
			sql: `CREATE TABLE sources_new (id INTEGER PRIMARY KEY, slug TEXT NOT NULL);
				INSERT INTO sources_new SELECT id, slug FROM sources;
				DROP TABLE sources;
				ALTER TABLE sources_new RENAME TO sources;`
		};
		migrate(db, [schema]);
		db.exec("INSERT INTO sources VALUES (1, 'platform'); INSERT INTO pages VALUES (1, 1);");
		db.exec('PRAGMA foreign_keys = ON');

		migrate(db, [schema, rebuild]);
		expect(rows(db, 'SELECT * FROM pages')).toEqual([{ id: 1, source_id: 1 }]);
	});

	it('rejects a migration that leaves rows with broken foreign keys', () => {
		const db = new DatabaseSync(':memory:');
		const schema = {
			name: '0001-schema.sql',
			sql: `CREATE TABLE sources (id INTEGER PRIMARY KEY);
				CREATE TABLE pages (source_id INTEGER REFERENCES sources (id));`
		};
		const orphan = { name: '0002-orphan.sql', sql: 'INSERT INTO pages VALUES (42);' };

		expect(() => migrate(db, [schema, orphan])).toThrow(/0002-orphan.sql failed: 1 rows violate/);
		expect(rows(db, 'SELECT * FROM sources')).toEqual([]);
	});

	it('refuses a database newer than the migrations it knows', () => {
		const db = new DatabaseSync(':memory:');
		migrate(db, [createNotes, addAuthor]);
		expect(() => migrate(db, [createNotes])).toThrow(/at version 2, this grimoire knows only 1/);
	});

	it('refuses migrations out of sequence', () => {
		const db = new DatabaseSync(':memory:');
		expect(() => migrate(db, [createNotes, { ...addAuthor, name: '0003-author.sql' }])).toThrow(
			/0003-author.sql is out of sequence: expected 0002-/
		);
	});

	it('ships migrations numbered in sequence', () => {
		const db = new DatabaseSync(':memory:');
		migrate(db, shippedMigrations);
		expect(userVersion(db)).toBe(shippedMigrations.length);
	});
});

describe('openMigratedDatabase', () => {
	it('switches a new file to WAL while another connection holds its write lock', async () => {
		const path = join(tempDir(), 'new.db');
		// On a new file this makes the WAL switch fail with SQLITE_BUSY at once, without waiting.
		const { released } = await holdWriteLock(path, 'BEGIN IMMEDIATE');

		const db = openMigratedDatabase(path, [createNotes]);
		await released;
		expect(rows(db, 'PRAGMA journal_mode')).toEqual([{ journal_mode: 'wal' }]);
		expect(userVersion(db)).toBe(1);
		db.close();
	});

	it('skips a migration another connection applied while this one waited for the lock', async () => {
		const path = join(tempDir(), 'shared.db');
		const setup = new DatabaseSync(path);
		setup.exec('PRAGMA journal_mode = WAL');
		setup.close();
		const { released } = await holdWriteLock(
			path,
			"BEGIN IMMEDIATE; CREATE TABLE notes (text TEXT); INSERT INTO notes VALUES ('other'); PRAGMA user_version = 1;"
		);

		const db = openMigratedDatabase(path, [
			createNotes,
			{ name: '0002-note.sql', sql: "INSERT INTO notes VALUES ('this');" }
		]);
		await released;
		expect(userVersion(db)).toBe(2);
		expect(rows(db, 'SELECT text FROM notes')).toEqual([{ text: 'other' }, { text: 'this' }]);
		db.close();
	});
});

function tempDir(): string {
	const dir = mkdtempSync(join(tmpdir(), 'grimoire-migrate-'));
	onTestFinished(() => rmSync(dir, { recursive: true }));
	return dir;
}

// A worker thread has its own connection, so it keeps the lock while openMigratedDatabase blocks
// the test thread. It commits after a fixed time, well within the busy timeout.
async function holdWriteLock(path: string, sql: string) {
	const worker = new Worker(
		`
		const { DatabaseSync } = require('node:sqlite');
		const { parentPort, workerData } = require('node:worker_threads');
		const db = new DatabaseSync(workerData.path);
		db.exec(workerData.sql);
		parentPort.postMessage('locked');
		Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300);
		db.exec('COMMIT');
		db.close();
		`,
		{ eval: true, workerData: { path, sql } }
	);
	await once(worker, 'message');
	return { released: once(worker, 'exit') };
}
