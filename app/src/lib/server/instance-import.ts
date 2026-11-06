import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import { migrate, type Migration } from './db/migrate.ts';
import { inTransaction } from './db/transaction.ts';
import {
	EXPORTED_COLUMNS,
	EXPORTED_TABLES,
	readExport,
	type ExportProblem
} from './instance-export.ts';
import { encryptSecret } from './secret-encryption.ts';

// grimoire writes exports from this schema version on; a database below it was never one.
const FIRST_EXPORTED_SCHEMA = 4;

export type ImportProblem =
	| ExportProblem
	/** The instance has a user or a source: an import never merges. */
	| 'instance-not-empty'
	/** Written by a grimoire whose schema is newer than this one's. */
	| 'newer-schema';

/**
 * Imports an export into `db`, which must hold no user and no source. The content is migrated to
 * the schema of `migrations` first, then copied in one transaction, every Git token encrypted with
 * `tokenKey`. Nothing is written on a refusal.
 */
export async function importExport(
	db: DatabaseSync,
	file: Buffer,
	passphrase: string,
	migrations: Migration[],
	tokenKey: Buffer
): Promise<{ users: number; sources: number } | { error: ImportProblem }> {
	// Checked before the passphrase costs its derivation, and again under the write lock.
	if (!isEmpty(db)) return { error: 'instance-not-empty' };
	const read = await readExport(file, passphrase);
	if ('error' in read) return read;
	const content = read.db;
	try {
		const version = content.prepare('PRAGMA user_version').get()!.user_version as number;
		if (version < FIRST_EXPORTED_SCHEMA) return { error: 'not-an-export' };
		if (version > migrations.length) return { error: 'newer-schema' };
		migrate(content, migrations);
		return inTransaction(db, () => {
			if (!isEmpty(db)) return { error: 'instance-not-empty' as const };
			// The settings row comes with the schema; the one of the export replaces it.
			db.exec('DELETE FROM settings');
			for (const table of EXPORTED_TABLES) copyRows(content, db, table, tokenKey);
			return { users: count(db, 'users'), sources: count(db, 'sources') };
		});
	} catch (error) {
		// It decrypted, so it was sealed with the passphrase, but it is no database of this schema.
		// Unless the instance's database failed: locked by the server, read-only, broken or full.
		if (isSqliteError(error) && !isInstanceProblem(error)) return { error: 'not-an-export' };
		throw error;
	} finally {
		content.close();
	}
}

function isSqliteError(error: unknown): boolean {
	return (error as { code?: unknown })?.code === 'ERR_SQLITE_ERROR';
}

// SQLITE_BUSY, SQLITE_READONLY, SQLITE_IOERR and SQLITE_FULL; extended codes keep the primary one
// in their low byte.
const INSTANCE_PROBLEMS = new Set([5, 8, 10, 13]);

function isInstanceProblem(error: unknown): boolean {
	const code = (error as { errcode?: unknown }).errcode;
	return typeof code === 'number' && INSTANCE_PROBLEMS.has(code & 0xff);
}

function isEmpty(db: DatabaseSync): boolean {
	return count(db, 'users') === 0 && count(db, 'sources') === 0;
}

function count(db: DatabaseSync, table: string): number {
	return db.prepare(`SELECT count(*) AS n FROM ${table}`).get()!.n as number;
}

// Only the columns an export carries: whatever else the file holds stays behind.
function copyRows(from: DatabaseSync, to: DatabaseSync, table: string, tokenKey: Buffer) {
	const columns = EXPORTED_COLUMNS[table];
	const rows = from.prepare(`SELECT ${columns.join(', ')} FROM ${table}`).all() as Record<
		string,
		SQLInputValue
	>[];
	if (rows.length === 0) return;
	const insert = to.prepare(
		`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`
	);
	for (const row of rows) {
		// Plain text inside the export, encrypted again under the key of this instance.
		if (table === 'sources' && typeof row.encrypted_token === 'string') {
			row.encrypted_token = encryptSecret(row.encrypted_token, tokenKey);
		}
		insert.run(...columns.map((column) => row[column]));
	}
}
