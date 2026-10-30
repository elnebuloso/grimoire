import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { migrate, type Migration } from './migrate';
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
			sql: `CREATE TABLE projects (id INTEGER PRIMARY KEY, slug TEXT);
				CREATE TABLE sources (id INTEGER PRIMARY KEY,
					project_id INTEGER NOT NULL REFERENCES projects (id) ON DELETE CASCADE);`
		};
		const rebuild = {
			name: '0002-rebuild.sql',
			sql: `CREATE TABLE projects_new (id INTEGER PRIMARY KEY, slug TEXT NOT NULL);
				INSERT INTO projects_new SELECT id, slug FROM projects;
				DROP TABLE projects;
				ALTER TABLE projects_new RENAME TO projects;`
		};
		migrate(db, [schema]);
		db.exec("INSERT INTO projects VALUES (1, 'platform'); INSERT INTO sources VALUES (1, 1);");
		db.exec('PRAGMA foreign_keys = ON');

		migrate(db, [schema, rebuild]);
		expect(rows(db, 'SELECT * FROM sources')).toEqual([{ id: 1, project_id: 1 }]);
	});

	it('rejects a migration that leaves rows with broken foreign keys', () => {
		const db = new DatabaseSync(':memory:');
		const schema = {
			name: '0001-schema.sql',
			sql: `CREATE TABLE projects (id INTEGER PRIMARY KEY);
				CREATE TABLE sources (project_id INTEGER REFERENCES projects (id));`
		};
		const orphan = { name: '0002-orphan.sql', sql: 'INSERT INTO sources VALUES (42);' };

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
	// Two real processes, because the write lock is held per connection and a single test process
	// could not race against itself. New files each round: switching to WAL is where they collide.
	it('applies each migration exactly once when two processes migrate a new file at once', async () => {
		const dir = mkdtempSync(join(tmpdir(), 'grimoire-migrate-'));
		try {
			// The WAL collision hits roughly one round in eight; 20 rounds catch it almost every run.
			for (let round = 0; round < 20; round++) {
				const path = join(dir, `round-${round}.db`);
				const exitCodes = await Promise.all(['a', 'b'].map((who) => runMigrator(path, who)));
				expect(exitCodes).toEqual([0, 0]);

				const db = new DatabaseSync(path);
				expect(userVersion(db)).toBe(2);
				expect(rows(db, 'SELECT count(*) AS n FROM log')).toEqual([{ n: 1 }]);
				db.close();
			}
		} finally {
			rmSync(dir, { recursive: true });
		}
	}, 30_000);
});

const SLOW_QUERY =
	'WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM c WHERE x < 200000) SELECT count(*) FROM c;';

function runMigrator(path: string, who: string): Promise<number | null> {
	const migrateUrl = pathToFileURL(join(import.meta.dirname, 'migrate.ts')).href;
	const script = `
		import { openMigratedDatabase } from ${JSON.stringify(migrateUrl)};
		const [path, who] = process.argv.slice(-2);
		openMigratedDatabase(path, [
			{ name: '0001-log.sql', sql: 'CREATE TABLE log (who TEXT); ${SLOW_QUERY}' },
			{ name: '0002-entry.sql', sql: "INSERT INTO log VALUES ('" + who + "'); ${SLOW_QUERY}" }
		]).close();
	`;
	return new Promise((resolve) => {
		const child = spawn(process.execPath, ['--input-type=module', '-e', script, path, who], {
			stdio: ['ignore', 'ignore', 'inherit']
		});
		child.on('exit', resolve);
	});
}
