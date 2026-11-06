import { describe, it, expect, beforeAll } from 'vitest';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { migrations, openDatabase } from './db/schema';
import { deriveKeys, encryptSecret } from './secret-encryption';
import {
	EMPTIED_TABLES,
	EXPORTED_COLUMNS,
	EXPORTED_TABLES,
	RUNTIME_COLUMNS,
	readExport,
	writeExport
} from './instance-export';

const PASSPHRASE = 'harbour lantern seventeen';
const tokenKey = deriveKeys(randomBytes(32)).sourceTokens;

function instance(): DatabaseSync {
	const db = openDatabase(':memory:');
	db.exec(`
		INSERT INTO users (id, email, password_hash) VALUES (1, 'ada@example.com', 'hash-ada'), (2, 'bob@example.com', 'hash-bob');
		INSERT INTO user_roles VALUES (1, 'admin');
		INSERT INTO user_identities VALUES (2, 'https://gitlab.example.com', '42');
		INSERT INTO sources (id, slug, name, git_url, branch, path, username, visibility,
			last_checked_at, last_commit, last_synced_at, index_generation, error, failed_commit, warnings)
			VALUES (1, 'billing-docs', 'Billing', 'https://git.example.com/billing.git', 'main', 'docs', 'deploy',
				'internal', '2026-11-01T10:00:00.000Z', 'abc123', '2026-11-01T10:00:00.000Z', 3, 'timeout', 'def456', '["a warning"]'),
			(2, 'platform-docs', 'Platform', 'https://git.example.com/platform.git', 'main', 'docs', NULL,
				'public', NULL, NULL, NULL, 0, NULL, NULL, '[]');
		INSERT INTO api_keys (id, name, key_hash, all_sources, owner_id, last_used_at)
			VALUES (1, 'ci', 'key-hash', 0, 1, '2026-11-01T10:00:00.000Z');
		INSERT INTO api_key_sources VALUES (1, 2);
		UPDATE settings SET syncs_paused = 1;
		INSERT INTO api_key_requests VALUES (1, '2026-11-01', 4);
		INSERT INTO sessions VALUES ('session-hash', 1, '2026-12-01T00:00:00.000Z', '2026-12-01T00:00:00.000Z');
		INSERT INTO password_resets VALUES ('reset-hash', 1, '2026-12-01T00:00:00.000Z');
		INSERT INTO invitations (email, token_hash, sent_at, expires_at)
			VALUES ('cleo@example.com', 'invite-hash', '2026-11-01T00:00:00.000Z', '2026-11-08T00:00:00.000Z');
		INSERT INTO sync_runs (source_id, started_at, finished_at, outcome)
			VALUES (1, '2026-11-01T10:00:00.000Z', '2026-11-01T10:00:01.000Z', 'synced');
		INSERT INTO missed_queries (id, question, asked_at) VALUES (1, 'refund rules', '2026-11-01T10:00:00.000Z');
		INSERT INTO pages (id, source_id, generation, file, title, content) VALUES (1, 1, 3, 'index.md', 'Billing', 'Text');
		INSERT INTO snippets (page_id, position, title_path, content, tokens) VALUES (1, 0, '["Billing"]', 'Text', 1);
		INSERT INTO links (page_id, target, dead) VALUES (1, 'other.md', 1);
	`);
	db.prepare('UPDATE sources SET encrypted_token = ? WHERE id = 1').run(
		encryptSecret('glpat-billing-token', tokenKey)
	);
	return db;
}

function rows(db: DatabaseSync, table: string) {
	return db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all();
}

function count(db: DatabaseSync, table: string): number {
	return (db.prepare(`SELECT count(*) AS n FROM ${table}`).get() as { n: number }).n;
}

async function exportFile(db: DatabaseSync): Promise<Buffer> {
	const result = await writeExport(db, migrations, tokenKey, PASSPHRASE);
	if (!('file' in result)) throw new Error(`export failed: ${result.error}`);
	return result.file;
}

let original: DatabaseSync;
let file: Buffer;

beforeAll(async () => {
	original = instance();
	file = await exportFile(original);
});

describe('writeExport and readExport', () => {
	it('lists every table of the schema as exported or emptied', () => {
		// FTS5 keeps its index in shadow tables of its own, emptied with the virtual table.
		const tables = original
			.prepare(
				`SELECT name FROM sqlite_master WHERE type = 'table'
				AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'snippets_fts_%'`
			)
			.all()
			.map((row) => row.name as string);
		expect([...EXPORTED_TABLES, ...EMPTIED_TABLES].sort()).toEqual(tables.sort());
	});

	it('lists every column of an exported table as exported or runtime', () => {
		for (const table of EXPORTED_TABLES) {
			const columns = original
				.prepare('SELECT name FROM pragma_table_info(?)')
				.all(table)
				.map((row) => `${table}.${row.name}`);
			const listed = [...EXPORTED_COLUMNS[table], ...(RUNTIME_COLUMNS[table] ?? [])].map(
				(column) => `${table}.${column}`
			);
			expect(listed.sort()).toEqual(columns.sort());
		}
	});

	it('carries the real state, the token in plain text, at the schema version it was written at', async () => {
		const result = await readExport(file, PASSPHRASE);
		if (!('db' in result)) throw new Error(result.error);
		const { db } = result;

		for (const table of EXPORTED_TABLES.filter((table) => !(table in RUNTIME_COLUMNS))) {
			expect(rows(db, table), table).toEqual(rows(original, table));
		}
		expect(rows(db, 'sources')).toEqual([
			{
				...rows(original, 'sources')[0],
				encrypted_token: 'glpat-billing-token',
				last_checked_at: null,
				last_commit: null,
				last_synced_at: null,
				index_generation: 0,
				error: null,
				failed_commit: null,
				warnings: '[]'
			},
			rows(original, 'sources')[1]
		]);
		expect(rows(db, 'api_keys')).toEqual([
			{ ...rows(original, 'api_keys')[0], last_used_at: null }
		]);
		expect(db.prepare('PRAGMA user_version').get()).toEqual(
			original.prepare('PRAGMA user_version').get()
		);
		db.close();
	});

	it('leaves derived and transient data behind', async () => {
		const result = await readExport(file, PASSPHRASE);
		if (!('db' in result)) throw new Error(result.error);
		for (const table of EMPTIED_TABLES) expect(count(result.db, table), table).toBe(0);
		result.db.close();
	});

	it('leaves the exported database as it was', () => {
		expect(count(original, 'sessions')).toBe(1);
		expect(count(original, 'pages')).toBe(1);
		expect(original.prepare('SELECT last_commit FROM sources WHERE id = 1').get()).toEqual({
			last_commit: 'abc123'
		});
	});

	it('exports a database file in WAL mode, rows not yet checkpointed included', async () => {
		const directory = mkdtempSync(join(tmpdir(), 'grimoire-export-'));
		const db = openDatabase(join(directory, 'grimoire.db'));
		try {
			db.exec("INSERT INTO users (id, email) VALUES (1, 'ada@example.com')");
			expect(db.prepare('PRAGMA journal_mode').get()).toEqual({ journal_mode: 'wal' });

			const result = await readExport(await exportFile(db), PASSPHRASE);
			if (!('db' in result)) throw new Error(result.error);
			expect(rows(result.db, 'users')).toEqual([
				{ id: 1, email: 'ada@example.com', password_hash: null }
			]);
			result.db.close();
		} finally {
			db.close();
			rmSync(directory, { recursive: true, force: true });
		}
	});

	it('refuses to export a token that does not decrypt, naming its source', async () => {
		const db = instance();
		const otherKey = deriveKeys(randomBytes(32)).sourceTokens;
		db.prepare('UPDATE sources SET encrypted_token = ? WHERE id = 2').run(
			encryptSecret('glpat-platform-token', otherKey)
		);
		expect(await writeExport(db, migrations, tokenKey, PASSPHRASE)).toEqual({
			error: 'unreadable-tokens',
			sources: ['platform-docs']
		});
	});
});

describe('readExport refusals', () => {
	function headerOf(exportFile: Buffer): Record<string, unknown> {
		return JSON.parse(exportFile.subarray(0, exportFile.indexOf('\n')).toString());
	}

	function withHeader(exportFile: Buffer, header: Record<string, unknown>): Buffer {
		const body = exportFile.subarray(exportFile.indexOf('\n'));
		return Buffer.concat([Buffer.from(JSON.stringify(header)), body]);
	}

	it('answers a wrong passphrase', async () => {
		expect(await readExport(file, 'harbour lantern eighteen')).toEqual({
			error: 'wrong-passphrase-or-damaged'
		});
	});

	it('answers a changed byte of the content', async () => {
		const changed = Buffer.from(file);
		changed[changed.length - 100] ^= 1;
		expect(await readExport(changed, PASSPHRASE)).toEqual({
			error: 'wrong-passphrase-or-damaged'
		});
	});

	it('answers a file cut short', async () => {
		expect(await readExport(file.subarray(0, file.length - 1), PASSPHRASE)).toEqual({
			error: 'wrong-passphrase-or-damaged'
		});
		expect(await readExport(file.subarray(0, file.indexOf('\n') + 5), PASSPHRASE)).toEqual({
			error: 'wrong-passphrase-or-damaged'
		});
	});

	it('answers a changed header, which the content authenticates', async () => {
		const header = headerOf(file);
		const iv = Buffer.from(header.iv as string, 'base64');
		iv[0] ^= 1;
		expect(
			await readExport(withHeader(file, { ...header, iv: iv.toString('base64') }), PASSPHRASE)
		).toEqual({ error: 'wrong-passphrase-or-damaged' });
	});

	it('tells a file that is no export', async () => {
		for (const other of [
			Buffer.alloc(0),
			Buffer.from('SQLite format 3\0'),
			Buffer.from('{"format":"something-else","version":1}\nbody'),
			Buffer.from('not json\nbody'),
			withHeader(file, { ...headerOf(file), salt: 'short' }),
			Buffer.alloc(4096, 'a')
		]) {
			expect(await readExport(other, PASSPHRASE)).toEqual({ error: 'not-an-export' });
		}
	});

	it('tells an export of a newer format version, whatever else its header holds', async () => {
		expect(
			await readExport(Buffer.from('{"format":"grimoire-export","version":2}\nbody'), PASSPHRASE)
		).toEqual({ error: 'newer-format' });
	});
});
