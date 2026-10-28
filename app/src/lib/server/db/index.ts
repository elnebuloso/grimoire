import type { DatabaseSync } from 'node:sqlite';
import { DATABASE_PATH } from '$app/env/private';
import { openDatabase } from './schema';

let db: DatabaseSync | undefined;

/** The application database, opened from `DATABASE_PATH` on first use. */
export function database(): DatabaseSync {
	db ??= openDatabase(DATABASE_PATH);
	return db;
}
