import { describe, it, expect, beforeEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../db/schema';
import { parseTokenBudget, searchSnippets } from './query';

let db: DatabaseSync;

function insert(sql: string, ...values: (string | number | null)[]): number {
	return Number(db.prepare(sql).run(...values).lastInsertRowid);
}

function addSource(project: string, slug: string, gitUrl = 'https://git.example/x.git'): number {
	const projectId =
		(
			db.prepare('SELECT id FROM projects WHERE slug = ?').get(project) as
				{ id: number } | undefined
		)?.id ?? insert('INSERT INTO projects (slug) VALUES (?)', project);
	return insert(
		`INSERT INTO sources (project_id, slug, git_url, branch, path) VALUES (?, ?, ?, 'main', 'docs/')`,
		projectId,
		slug,
		gitUrl
	);
}

interface SnippetFields {
	anchor?: string;
	title: string;
	text?: string;
	code?: string;
}

function addPage(sourceId: number, file: string, ...snippets: SnippetFields[]) {
	const pageId = insert(
		`INSERT INTO pages (source_id, file, title, content) VALUES (?, ?, 'Title', '')`,
		sourceId,
		file
	);
	snippets.forEach(({ anchor, title, text = '', code = '' }, position) => {
		const content = code ? `${text}\n\n\`\`\`\n${code}\n\`\`\`` : text;
		const id = insert(
			`INSERT INTO snippets (page_id, position, anchor, title_path, content, tokens)
			VALUES (?, ?, ?, ?, ?, 0)`,
			pageId,
			position,
			anchor ?? null,
			JSON.stringify([title]),
			content
		);
		insert(
			'INSERT INTO snippets_fts (rowid, title_path, text, code) VALUES (?, ?, ?, ?)',
			id,
			title,
			text,
			code
		);
	});
}

function sourceIds(result: string): string[] {
	return [...result.matchAll(/^Source: (.+)$/gm)].map((match) => match[1]);
}

beforeEach(() => {
	db = openDatabase(':memory:');
});

describe('parseTokenBudget', () => {
	it('accepts a positive whole number only', () => {
		expect(parseTokenBudget('1500')).toBe(1500);
		for (const value of ['0', '-5', '1.5', '1e3', ' 12', 'many', '']) {
			expect(parseTokenBudget(value)).toBeUndefined();
		}
	});
});

describe('searchSnippets', () => {
	it('ranks a match in the title path above one in the text, and that above one in code', () => {
		const source = addSource('platform', 'auth');
		addPage(
			source,
			'deploy.md',
			{ anchor: 'in-code', title: 'Tools', text: 'Some helpers.', code: 'make rollback' },
			{ anchor: 'in-text', title: 'Steps', text: 'Run the rollback.' },
			{ anchor: 'in-title', title: 'Rollback', text: 'Run the script.' }
		);

		expect(sourceIds(searchSnippets(db, { query: 'rollback', allowedProjects: 'all' }))).toEqual([
			'platform/auth/deploy#in-title',
			'platform/auth/deploy#in-text',
			'platform/auth/deploy#in-code'
		]);
	});

	it('renders the title path, the ID and where to edit, without credentials', () => {
		const source = addSource('platform', 'auth', 'https://bot:secret@git.example/auth.git');
		addPage(source, 'guide/deploy.md', {
			anchor: 'rollback',
			title: 'Rollback',
			text: 'Run it.\n'
		});
		addPage(source, 'index.md', { title: 'Overview', text: 'Rollback basics.' });

		expect(searchSnippets(db, { query: 'rollback', allowedProjects: 'all' })).toBe(
			[
				'### platform › auth › Rollback',
				'Source: platform/auth/guide/deploy#rollback',
				'Edit: https://git.example/auth.git (main) docs/guide/deploy.md',
				'',
				'Run it.',
				'',
				'### platform › auth › Overview',
				'Source: platform/auth/index',
				'Edit: https://git.example/auth.git (main) docs/index.md',
				'',
				'Rollback basics.'
			].join('\n')
		);
	});

	it('searches all projects, or only the given one', () => {
		addPage(addSource('platform', 'auth'), 'a.md', { title: 'Rollback' });
		addPage(addSource('billing', 'invoices'), 'b.md', { title: 'Rollback' });

		expect(
			sourceIds(searchSnippets(db, { query: 'rollback', allowedProjects: 'all' })).sort()
		).toEqual(['billing/invoices/b', 'platform/auth/a']);
		expect(
			sourceIds(
				searchSnippets(db, { query: 'rollback', project: 'billing', allowedProjects: 'all' })
			)
		).toEqual(['billing/invoices/b']);
	});

	it('leaves out projects the caller may not see', () => {
		addPage(addSource('platform', 'auth'), 'a.md', { title: 'Rollback' });
		addPage(addSource('billing', 'invoices'), 'b.md', { title: 'Rollback' });

		expect(
			sourceIds(searchSnippets(db, { query: 'rollback', allowedProjects: ['platform'] }))
		).toEqual(['platform/auth/a']);
		expect(
			searchSnippets(db, { query: 'rollback', project: 'billing', allowedProjects: ['platform'] })
		).toBe('');
		expect(searchSnippets(db, { query: 'rollback', allowedProjects: [] })).toBe('');
	});

	it('skips a hit that does not fit, takes a later one that does, and lists the skipped IDs', () => {
		const source = addSource('platform', 'auth');
		addPage(
			source,
			'deploy.md',
			{ anchor: 'first', title: 'Rollback', text: 'Short.' },
			{ anchor: 'large', title: 'Rollback', text: `Rollback ${'x'.repeat(2000)}` },
			{ anchor: 'last', title: 'Steps', text: 'Rollback later.' }
		);

		const result = searchSnippets(db, { query: 'rollback', tokens: 200, allowedProjects: 'all' });

		expect(sourceIds(result)).toEqual(['platform/auth/deploy#first', 'platform/auth/deploy#last']);
		expect(result.endsWith('\n\nDid not fit: platform/auth/deploy#large')).toBe(true);
	});

	it('has no line about skipped hits when everything fits', () => {
		addPage(addSource('platform', 'auth'), 'a.md', { title: 'Rollback' });

		expect(searchSnippets(db, { query: 'rollback', allowedProjects: 'all' })).not.toContain(
			'Did not fit'
		);
	});

	it('accepts questions with characters that are FTS5 syntax', () => {
		addPage(addSource('platform', 'auth-service'), 'a.md', {
			title: 'Deploy',
			text: 'auth-service uses ENV=prod'
		});

		expect(
			sourceIds(searchSnippets(db, { query: 'auth-service?', allowedProjects: 'all' }))
		).toEqual(['platform/auth-service/a']);
		expect(
			sourceIds(
				searchSnippets(db, { query: 'how to set ENV=prod "quoted"', allowedProjects: 'all' })
			)
		).toEqual(['platform/auth-service/a']);
		expect(searchSnippets(db, { query: '?!', allowedProjects: 'all' })).toBe('');
	});
});
