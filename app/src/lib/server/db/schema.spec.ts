import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { isSlug } from '../../slug';
import { openDatabase } from './schema';

function insert(db: DatabaseSync, sql: string, ...values: (string | number | null)[]): number {
	return Number(db.prepare(sql).run(...values).lastInsertRowid);
}

function addSource(db: DatabaseSync, slug: string): number {
	return insert(
		db,
		`INSERT INTO sources (slug, name, git_url, branch, path) VALUES (?, 'Docs', 'https://git.example/x.git', 'main', 'docs/')`,
		slug
	);
}

function addPage(db: DatabaseSync, sourceId: number, file: string): number {
	return insert(
		db,
		`INSERT INTO pages (source_id, file, title, content) VALUES (?, ?, 'Title', '# Title')`,
		sourceId,
		file
	);
}

function addSnippet(
	db: DatabaseSync,
	pageId: number,
	position: number,
	titlePath: string,
	text: string,
	code = ''
) {
	const id = insert(
		db,
		`INSERT INTO snippets (page_id, position, anchor, title_path, content, tokens) VALUES (?, ?, NULL, '[]', ?, 1)`,
		pageId,
		position,
		text
	);
	insert(
		db,
		'INSERT INTO snippets_fts (rowid, title_path, text, code) VALUES (?, ?, ?, ?)',
		id,
		titlePath,
		text,
		code
	);
	return id;
}

function count(db: DatabaseSync, table: string): number {
	return (db.prepare(`SELECT count(*) AS n FROM ${table}`).get() as { n: number }).n;
}

describe('openDatabase', () => {
	it('creates directory, file and schema, and keeps the data when opened again', () => {
		const dir = mkdtempSync(join(tmpdir(), 'grimoire-db-'));
		try {
			const path = join(dir, 'data', 'grimoire.db');
			const first = openDatabase(path);
			addSource(first, 'platform-docs');
			first.close();

			const second = openDatabase(path);
			expect(count(second, 'sources')).toBe(1);
			second.close();
		} finally {
			rmSync(dir, { recursive: true });
		}
	});

	it('has the tables of the data model', () => {
		const db = openDatabase(':memory:');
		const tables = db
			.prepare(
				"SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'snippets_fts_%' ORDER BY name"
			)
			.all()
			.map((row) => row.name);
		expect(tables).toEqual([
			'api_key_sources',
			'api_keys',
			'links',
			'missed_queries',
			'pages',
			'password_resets',
			'sessions',
			'settings',
			'snippets',
			'snippets_fts',
			'sources',
			'sync_runs',
			'user_roles',
			'users'
		]);
	});

	it('ranks snippets with BM25 weighted per column', () => {
		const db = openDatabase(':memory:');
		const page = addPage(db, addSource(db, 'auth'), 'deploy.md');
		const inCode = addSnippet(db, page, 0, 'Deploy', 'Run the script.', 'make rollback');
		const inTitle = addSnippet(db, page, 1, 'Rollback', 'Go back to the last version.');

		const ranked = db
			.prepare(
				"SELECT rowid FROM snippets_fts WHERE snippets_fts MATCH 'rollback' ORDER BY bm25(snippets_fts, 10.0, 1.0, 0.2)"
			)
			.all()
			.map((row) => row.rowid);
		expect(ranked).toEqual([inTitle, inCode]);
	});

	it('rejects a second source with the same slug', () => {
		const db = openDatabase(':memory:');
		addSource(db, 'docs');

		expect(() => addSource(db, 'docs')).toThrow(/UNIQUE/);
	});

	it.each([
		['sources', 'exclusions'],
		['sources', 'warnings'],
		['pages', 'tags'],
		['snippets', 'aliases'],
		['snippets', 'title_path']
	])('refuses invalid JSON in %s.%s', (table, column) => {
		const db = openDatabase(':memory:');
		const pageId = addPage(db, addSource(db, 'docs'), 'index.md');
		addSnippet(db, pageId, 0, 'Title', 'text');

		expect(() => db.prepare(`UPDATE ${table} SET ${column} = '["unclosed'`).run()).toThrow(
			/CHECK constraint failed/
		);
		expect(() => db.prepare(`UPDATE ${table} SET ${column} = '["closed"]'`).run()).not.toThrow();
	});

	it.each([
		'auth-service',
		'a',
		'v2',
		'a'.repeat(40),
		'a'.repeat(41),
		'',
		'Auth',
		'auth_service',
		'auth service',
		'-auth',
		'auth-',
		'auth--service',
		'prüfung'
	])('accepts the slug %j exactly when isSlug does', (slug) => {
		const db = openDatabase(':memory:');
		const stored = () => addSource(db, slug);

		if (isSlug(slug)) expect(stored).not.toThrow();
		else expect(stored).toThrow(/CHECK constraint failed/);
	});

	it.each(['', '   '])('refuses the source name %j', (name) => {
		const db = openDatabase(':memory:');

		expect(() =>
			db
				.prepare(
					`INSERT INTO sources (slug, name, git_url, branch, path)
					VALUES ('docs', ?, 'https://git.example/x.git', 'main', 'docs/')`
				)
				.run(name)
		).toThrow(/CHECK constraint failed/);
	});

	it('refuses invalid JSON in missed_queries.sources and accepts NULL', () => {
		const db = openDatabase(':memory:');
		const record = db.prepare(
			"INSERT INTO missed_queries (question, sources, asked_at) VALUES ('vpn', ?, '2026-10-31T12:00:00.000Z')"
		);

		expect(() => record.run('billing-docs, platform-docs')).toThrow(/CHECK constraint failed/);
		expect(() => record.run('["billing-docs"]')).not.toThrow();
		expect(() => record.run(null)).not.toThrow();
	});

	it.each(['', '   '])('refuses the API key name %j', (name) => {
		const db = openDatabase(':memory:');

		expect(() =>
			db
				.prepare("INSERT INTO api_keys (name, key_hash, all_sources) VALUES (?, 'hash', 1)")
				.run(name)
		).toThrow(/CHECK constraint failed/);
	});

	it('refuses an email address with capital letters', () => {
		const db = openDatabase(':memory:');
		const insertUser = db.prepare("INSERT INTO users (email, password_hash) VALUES (?, 'x')");

		expect(() => insertUser.run('Admin@Example.com')).toThrow(/CHECK constraint failed/);
		expect(() => insertUser.run('admin@example.com')).not.toThrow();
	});

	it('removes the scope entries of API keys with their source', () => {
		const db = openDatabase(':memory:');
		const source = addSource(db, 'auth');
		const key = insert(
			db,
			"INSERT INTO api_keys (name, key_hash, all_sources) VALUES ('ci', 'hash', 0)"
		);
		insert(db, 'INSERT INTO api_key_sources (api_key_id, source_id) VALUES (?, ?)', key, source);

		db.prepare('DELETE FROM sources WHERE id = ?').run(source);
		expect([count(db, 'api_key_sources'), count(db, 'api_keys')]).toEqual([0, 1]);
	});

	it('removes pages, snippets, their search entries and links with their source', () => {
		const db = openDatabase(':memory:');
		const source = addSource(db, 'auth');
		const page = addPage(db, source, 'deploy.md');
		addSnippet(db, page, 0, 'Rollback', 'Go back.');
		insert(db, "INSERT INTO links (page_id, anchor, target, dead) VALUES (?, NULL, 'x', 0)", page);

		db.prepare('DELETE FROM sources WHERE id = ?').run(source);
		expect(['pages', 'snippets', 'snippets_fts', 'links'].map((table) => count(db, table))).toEqual(
			[0, 0, 0, 0]
		);
	});
});
