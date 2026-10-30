import type { DatabaseSync } from 'node:sqlite';

/**
 * Runs `work` in a transaction that takes the write lock up front, and commits what it returns;
 * a throw rolls everything back and is passed on. `work` must not await: other requests share the
 * connection and would end up inside the transaction.
 */
export function inTransaction<T>(db: DatabaseSync, work: () => T): T {
	db.exec('BEGIN IMMEDIATE');
	try {
		const result = work();
		db.exec('COMMIT');
		return result;
	} catch (error) {
		if (db.isTransaction) db.exec('ROLLBACK');
		throw error;
	}
}
