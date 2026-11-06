import { describe, it, expect, vi } from 'vitest';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { login } from './admin/auth';
import { scopeForKey } from './api-keys';
import { migrate } from './db/migrate';
import { migrations, openDatabase } from './db/schema';
import { sealExport } from './instance-export';
import { importExport } from './instance-import';
import { decryptSecret, deriveKeys } from './secret-encryption';

// The fixture was written with the production cost of scrypt, which the test setup lowers. Each
// read of it takes half a second alone and several on a busy machine, past the default timeout.
vi.unmock('node:crypto');
vi.setConfig({ testTimeout: 30_000 });

// Written once by `writeExport` at schema version 4, the first that exports. Never write it again:
// it stands for the exports already out there, which every later version must import.
const FIXTURE = readFileSync(
	new URL('./fixtures/export-schema-4.grimoire-export', import.meta.url)
);
const FIXTURE_SCHEMA = 4;
const PASSPHRASE = 'fixture passphrase 2026';
const tokenKey = deriveKeys(randomBytes(32)).sourceTokens;
const clock = { now: new Date('2026-11-04T12:00:00Z'), today: '2026-11-04' };

function rows(db: DatabaseSync, sql: string) {
	return db.prepare(sql).all();
}

describe('importExport', () => {
	it('brings users, sources, keys and settings into an empty instance', async () => {
		const db = openDatabase(':memory:');
		expect(await importExport(db, FIXTURE, PASSPHRASE, migrations, tokenKey)).toEqual({
			users: 2,
			sources: 2
		});

		expect(rows(db, 'SELECT id, email FROM users ORDER BY id')).toEqual([
			{ id: 1, email: 'ada@example.com' },
			{ id: 2, email: 'bob@example.com' }
		]);
		const loggedIn = await login(db, 'client', {
			email: 'ada@example.com',
			password: 'ada-password-2026'
		});
		expect('session' in loggedIn).toBe(true);
		expect(rows(db, 'SELECT * FROM user_roles')).toEqual([{ user_id: 1, role: 'admin' }]);
		// The fixture was written while sources could be private: its private source arrives internal.
		expect(rows(db, 'SELECT slug, visibility FROM sources ORDER BY id')).toEqual([
			{ slug: 'billing-docs', visibility: 'internal' },
			{ slug: 'platform-docs', visibility: 'internal' }
		]);
		const { encrypted_token } = db
			.prepare('SELECT encrypted_token FROM sources WHERE id = 1')
			.get()!;
		expect(decryptSecret(encrypted_token as string, tokenKey)).toBe('glpat-fixture-billing');
		expect(scopeForKey(db, 'grimoire_fixture-key', clock)).toEqual({ scope: ['billing-docs'] });
		expect(rows(db, 'SELECT syncs_paused FROM settings')).toEqual([{ syncs_paused: 1 }]);
	});

	it('migrates an export written at an older schema to the current one', async () => {
		const next = [
			...migrations,
			{
				name: `${String(migrations.length + 1).padStart(4, '0')}-nickname.sql`,
				sql: "ALTER TABLE users ADD COLUMN nickname TEXT NOT NULL DEFAULT 'none'"
			}
		];
		const db = new DatabaseSync(':memory:');
		migrate(db, next);

		expect(await importExport(db, FIXTURE, PASSPHRASE, next, tokenKey)).toEqual({
			users: 2,
			sources: 2
		});
		expect(rows(db, 'SELECT email, nickname FROM users ORDER BY id')).toEqual([
			{ email: 'ada@example.com', nickname: 'none' },
			{ email: 'bob@example.com', nickname: 'none' }
		]);
	});

	it('refuses an export of a newer schema and writes nothing', async () => {
		// One migration fewer than the schema the fixture was written at.
		const older = migrations.slice(0, FIXTURE_SCHEMA - 1);
		const db = new DatabaseSync(':memory:');
		migrate(db, older);

		expect(await importExport(db, FIXTURE, PASSPHRASE, older, tokenKey)).toEqual({
			error: 'newer-schema'
		});
		expect(rows(db, 'SELECT * FROM users')).toEqual([]);
	});

	it('refuses an instance that has a user or a source, before asking for the passphrase', async () => {
		const withUser = openDatabase(':memory:');
		withUser.exec("INSERT INTO users (email, password_hash) VALUES ('cleo@example.com', 'hash')");
		expect(await importExport(withUser, FIXTURE, 'wrong', migrations, tokenKey)).toEqual({
			error: 'instance-not-empty'
		});
		expect(rows(withUser, 'SELECT email FROM users')).toEqual([{ email: 'cleo@example.com' }]);

		const withSource = openDatabase(':memory:');
		withSource.exec(`INSERT INTO sources (slug, name, git_url, branch, path)
			VALUES ('docs', 'Docs', 'https://git.example.com/docs.git', 'main', 'docs')`);
		expect(await importExport(withSource, FIXTURE, PASSPHRASE, migrations, tokenKey)).toEqual({
			error: 'instance-not-empty'
		});
		expect(rows(withSource, 'SELECT slug FROM sources')).toEqual([{ slug: 'docs' }]);
	});

	it('passes on a refusal of the file and writes nothing', async () => {
		const db = openDatabase(':memory:');
		expect(await importExport(db, FIXTURE, 'not the passphrase', migrations, tokenKey)).toEqual({
			error: 'wrong-passphrase-or-damaged'
		});
		expect(await importExport(db, Buffer.from('hello'), PASSPHRASE, migrations, tokenKey)).toEqual({
			error: 'not-an-export'
		});
		expect(rows(db, 'SELECT * FROM users')).toEqual([]);
		expect(rows(db, 'SELECT syncs_paused FROM settings')).toEqual([{ syncs_paused: 0 }]);
	});

	it('copies only the exported columns of a file that carries more', async () => {
		const content = new DatabaseSync(':memory:');
		migrate(content, migrations);
		content.exec(`INSERT INTO users (id, email) VALUES (1, 'ada@example.com');
			INSERT INTO sources (id, slug, name, git_url, branch, path, error, last_commit)
			VALUES (1, 'docs', 'Docs', 'https://git.example.com/docs.git', 'main', 'docs', 'timeout', 'abc123')`);
		const file = await sealExport(content, PASSPHRASE);
		const db = openDatabase(':memory:');

		expect(await importExport(db, file, PASSPHRASE, migrations, tokenKey)).toEqual({
			users: 1,
			sources: 1
		});
		expect(rows(db, 'SELECT error, last_commit FROM sources')).toEqual([
			{ error: null, last_commit: null }
		]);
	});

	it('refuses a file that decrypts but holds another schema, and writes nothing', async () => {
		const content = new DatabaseSync(':memory:');
		migrate(content, migrations);
		content.exec('ALTER TABLE users DROP COLUMN password_hash');
		const foreign = new DatabaseSync(':memory:');
		foreign.exec('CREATE TABLE notes (text TEXT)');
		const db = openDatabase(':memory:');

		for (const other of [content, foreign]) {
			const file = await sealExport(other, PASSPHRASE);
			expect(await importExport(db, file, PASSPHRASE, migrations, tokenKey)).toEqual({
				error: 'not-an-export'
			});
		}
		expect(rows(db, 'SELECT * FROM users')).toEqual([]);
	});
});
