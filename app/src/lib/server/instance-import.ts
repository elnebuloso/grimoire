import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import { migrate, type Migration } from './db/migrate.ts';
import { inTransaction } from './db/transaction.ts';
import { EXPORTED_TABLES, readExport, type ExportProblem } from './instance-export.ts';
import { encryptSecret } from './secret-encryption.ts';

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
		if (version > migrations.length) return { error: 'newer-schema' };
		migrate(content, migrations);
		return inTransaction(db, () => {
			if (!isEmpty(db)) return { error: 'instance-not-empty' as const };
			// The settings row comes with the schema; the one of the export replaces it.
			db.exec('DELETE FROM settings');
			for (const table of EXPORTED_TABLES) copyRows(content, db, table, tokenKey);
			return { users: count(db, 'users'), sources: count(db, 'sources') };
		});
	} finally {
		content.close();
	}
}

function isEmpty(db: DatabaseSync): boolean {
	return count(db, 'users') === 0 && count(db, 'sources') === 0;
}

function count(db: DatabaseSync, table: string): number {
	return db.prepare(`SELECT count(*) AS n FROM ${table}`).get()!.n as number;
}

function copyRows(from: DatabaseSync, to: DatabaseSync, table: string, tokenKey: Buffer) {
	const rows = from.prepare(`SELECT * FROM ${table}`).all() as Record<string, SQLInputValue>[];
	if (rows.length === 0) return;
	const columns = Object.keys(rows[0]);
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
