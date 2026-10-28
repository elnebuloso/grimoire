import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from './schema';
import { findBacklinks } from './links';

function insert(db: DatabaseSync, sql: string, ...values: (string | number | null)[]): number {
	return Number(db.prepare(sql).run(...values).lastInsertRowid);
}

function addSource(db: DatabaseSync, projectId: number, slug: string): number {
	return insert(
		db,
		`INSERT INTO sources (project_id, slug, git_url, branch, path) VALUES (?, ?, 'https://git.example/x.git', 'main', 'docs/')`,
		projectId,
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
			insert(first, "INSERT INTO projects (slug) VALUES ('platform')");
			first.close();

			const second = openDatabase(path);
			expect(count(second, 'projects')).toBe(1);
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
			'admin',
			'admin_sessions',
			'api_key_projects',
			'api_keys',
			'links',
			'pages',
			'projects',
			'snippets',
			'snippets_fts',
			'sources'
		]);
	});

	it('ranks snippets with BM25 weighted per column', () => {
		const db = openDatabase(':memory:');
		const project = insert(db, "INSERT INTO projects (slug) VALUES ('platform')");
		const page = addPage(db, addSource(db, project, 'auth'), 'deploy.md');
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

	it('rejects a second source with the same slug in a project, allows it in another', () => {
		const db = openDatabase(':memory:');
		const platform = insert(db, "INSERT INTO projects (slug) VALUES ('platform')");
		const billing = insert(db, "INSERT INTO projects (slug) VALUES ('billing')");
		addSource(db, platform, 'docs');

		expect(() => addSource(db, platform, 'docs')).toThrow(/UNIQUE/);
		expect(addSource(db, billing, 'docs')).toBeGreaterThan(0);
	});

	it('removes pages, snippets, their search entries and links with their source', () => {
		const db = openDatabase(':memory:');
		const project = insert(db, "INSERT INTO projects (slug) VALUES ('platform')");
		const source = addSource(db, project, 'auth');
		const page = addPage(db, source, 'deploy.md');
		addSnippet(db, page, 0, 'Rollback', 'Go back.');
		insert(db, "INSERT INTO links (page_id, anchor, target, dead) VALUES (?, NULL, 'x', 0)", page);

		db.prepare('DELETE FROM sources WHERE id = ?').run(source);
		expect(['pages', 'snippets', 'snippets_fts', 'links'].map((table) => count(db, table))).toEqual(
			[0, 0, 0, 0]
		);
	});
});

describe('findBacklinks', () => {
	it('returns links to the page and its anchors, not to pages sharing the prefix', () => {
		const db = openDatabase(':memory:');
		const project = insert(db, "INSERT INTO projects (slug) VALUES ('platform')");
		const source = addSource(db, project, 'auth');
		const index = addPage(db, source, 'index.md');
		const guide = addPage(db, source, 'guide/setup.md');
		const link = 'INSERT INTO links (page_id, anchor, target, dead) VALUES (?, ?, ?, ?)';
		insert(db, link, index, null, 'platform/auth/deploy', 0);
		insert(db, link, guide, 'steps', 'platform/auth/deploy#nope', 1);
		insert(db, link, index, null, 'platform/auth/deploy-old', 0);

		expect(findBacklinks(db, 'platform/auth/deploy')).toEqual([
			{ from: 'platform/auth/guide/setup#steps', target: 'platform/auth/deploy#nope', dead: true },
			{ from: 'platform/auth/index', target: 'platform/auth/deploy', dead: false }
		]);
	});
});
