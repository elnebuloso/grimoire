import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { inTransaction } from './transaction.ts';

export interface Migration {
	/** File name, numbered from `0001-`; the number is the schema version it leads to. */
	name: string;
	sql: string;
}

// Long enough for a migration of another process to finish, short enough to fail a stuck start.
const BUSY_TIMEOUT_MS = 5000;
const SQLITE_BUSY = 5;

/**
 * Opens the SQLite file at `path`, creating its directory if needed, and applies the migrations
 * it has not seen yet.
 */
export function openMigratedDatabase(path: string, migrations: Migration[]): DatabaseSync {
	mkdirSync(dirname(path), { recursive: true });
	const db = new DatabaseSync(path, { timeout: BUSY_TIMEOUT_MS });
	enableWriteAheadLog(db);
	migrate(db, migrations);
	db.exec('PRAGMA foreign_keys = ON');
	return db;
}

/**
 * Applies the migrations newer than the database's `user_version`, each in its own transaction.
 * Safe to run from several processes at once: each migration is applied exactly once.
 * Throws, naming the migration, when one fails; that migration is rolled back.
 */
export function migrate(db: DatabaseSync, migrations: Migration[]) {
	checkSequence(migrations);
	const current = userVersion(db);
	if (current > migrations.length) {
		throw new Error(
			`database schema is at version ${current}, this grimoire knows only ${migrations.length}: run a newer grimoire or restore a backup`
		);
	}

	// Has no effect inside a transaction. With it on, dropping a table while rebuilding it would
	// delete the rows of every table referencing it through ON DELETE CASCADE.
	db.exec('PRAGMA foreign_keys = OFF');
	migrations.forEach((migration, index) => {
		// IMMEDIATE takes the write lock up front; reading the version inside the transaction
		// lets a process that waited for it see that another one already migrated.
		try {
			inTransaction(db, () => {
				if (userVersion(db) > index) return;
				db.exec(migration.sql);
				const violations = db.prepare('PRAGMA foreign_key_check').all();
				if (violations.length > 0) {
					throw new Error(`${violations.length} rows violate foreign keys`);
				}
				db.exec(`PRAGMA user_version = ${index + 1}`);
			});
		} catch (error) {
			throw new Error(`migration ${migration.name} failed: ${(error as Error).message}`, {
				cause: error
			});
		}
	});
}

function checkSequence(migrations: Migration[]) {
	migrations.forEach((migration, index) => {
		const expected = `${String(index + 1).padStart(4, '0')}-`;
		if (!migration.name.startsWith(expected)) {
			throw new Error(`migration ${migration.name} is out of sequence: expected ${expected}…`);
		}
	});
}

function userVersion(db: DatabaseSync): number {
	return (db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version;
}

// Switching a new file to WAL can fail with SQLITE_BUSY while another process does the same,
// without waiting for the busy timeout, so it is retried here.
function enableWriteAheadLog(db: DatabaseSync) {
	const deadline = Date.now() + BUSY_TIMEOUT_MS;
	for (;;) {
		try {
			const { journal_mode } = db.prepare('PRAGMA journal_mode').get() as { journal_mode: string };
			if (journal_mode !== 'wal') db.exec('PRAGMA journal_mode = WAL');
			return;
		} catch (error) {
			if ((error as { errcode?: number }).errcode !== SQLITE_BUSY || Date.now() > deadline) {
				throw error;
			}
			sleep(50);
		}
	}
}

function sleep(milliseconds: number) {
	Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}
