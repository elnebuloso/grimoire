import { describe, it, expect, beforeEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../db/schema';
import { deleteUser, listUsers, setAdmin } from './users';

let db: DatabaseSync;

const ADMIN = 1;
const WRITER = 2;

function count(sql: string): number {
	return (db.prepare(sql).get() as { n: number }).n;
}

beforeEach(() => {
	db = openDatabase(':memory:');
	db.exec(`
		INSERT INTO users (id, email, password_hash) VALUES
			(1, 'admin@example.com', 'hash'), (2, 'writer@example.com', 'hash');
		INSERT INTO user_roles VALUES (1, 'admin');
		INSERT INTO sources (slug, name, git_url, branch, path, owner_id)
			VALUES ('release-drafts', 'Drafts', 'https://git.example.com/r.git', 'main', 'docs', 2);
		INSERT INTO api_keys (name, key_hash, all_sources, owner_id) VALUES ('laptop', 'hash', 1, 2);
		INSERT INTO api_key_requests VALUES (1, '2026-11-03', 5);
		INSERT INTO sessions VALUES ('session-hash', 2, '2026-11-04T00:00:00.000Z', '2026-11-04T00:00:00.000Z');
	`);
});

describe('listUsers', () => {
	it('lists every user with their roles', () => {
		expect(listUsers(db)).toEqual([
			{ id: 1, email: 'admin@example.com', roles: ['admin'] },
			{ id: 2, email: 'writer@example.com', roles: [] }
		]);
	});
});

describe('setAdmin', () => {
	it('makes a user an admin and takes the role away again', () => {
		expect(setAdmin(db, WRITER, true)).toBeUndefined();
		expect(listUsers(db)[1].roles).toEqual(['admin']);
		expect(setAdmin(db, WRITER, true)).toBeUndefined();

		expect(setAdmin(db, ADMIN, false)).toBeUndefined();
		expect(listUsers(db).map((user) => user.roles)).toEqual([[], ['admin']]);
	});

	it('never takes the role from the last admin', () => {
		expect(setAdmin(db, ADMIN, false)).toEqual({ error: 'last-admin' });
		expect(listUsers(db)[0].roles).toEqual(['admin']);
		expect(setAdmin(db, 99, true)).toEqual({ error: 'unknown-user' });
	});
});

describe('deleteUser', () => {
	it('hands the sources to the deleting admin and removes keys, their counts and sessions', () => {
		expect(deleteUser(db, WRITER, ADMIN)).toBeUndefined();

		expect(listUsers(db).map((user) => user.email)).toEqual(['admin@example.com']);
		expect(db.prepare('SELECT owner_id FROM sources').get()).toEqual({ owner_id: ADMIN });
		expect(count('SELECT count(*) AS n FROM api_keys')).toBe(0);
		expect(count('SELECT count(*) AS n FROM api_key_requests')).toBe(0);
		expect(count('SELECT count(*) AS n FROM sessions')).toBe(0);
	});

	it('refuses to delete the own account, and the last admin', () => {
		expect(deleteUser(db, ADMIN, ADMIN)).toEqual({ error: 'self' });
		// Only reachable when the deleting account lost the role meanwhile.
		expect(deleteUser(db, ADMIN, WRITER)).toEqual({ error: 'last-admin' });
		expect(deleteUser(db, 99, ADMIN)).toEqual({ error: 'unknown-user' });
		expect(listUsers(db)).toHaveLength(2);
	});
});
