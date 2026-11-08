import { describe, it, expect, beforeEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../db/schema';
import { parseTokenBudget, searchHits, type SearchOptions } from './query';

const searchSnippets = (db: DatabaseSync, options: SearchOptions) =>
	searchHits(db, options).markdown;

let db: DatabaseSync;

function insert(sql: string, ...values: (string | number | null)[]): number {
	return Number(db.prepare(sql).run(...values).lastInsertRowid);
}

function addSource(slug: string, gitUrl = 'https://git.example/x.git'): number {
	return insert(
		`INSERT INTO sources (slug, name, git_url, branch, path) VALUES (?, 'Docs', ?, 'main', 'docs/')`,
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
		const source = addSource('auth');
		addPage(
			source,
			'deploy.md',
			{ anchor: 'in-code', title: 'Tools', text: 'Some helpers.', code: 'make rollback' },
			{ anchor: 'in-text', title: 'Steps', text: 'Run the rollback.' },
			{ anchor: 'in-title', title: 'Rollback', text: 'Run the script.' }
		);

		expect(sourceIds(searchSnippets(db, { query: 'rollback', allowedSources: 'all' }))).toEqual([
			'auth/deploy#in-title',
			'auth/deploy#in-text',
			'auth/deploy#in-code'
		]);
	});

	it('renders the title path, the ID and where to edit, without credentials', () => {
		const source = addSource('auth', 'https://bot:secret@git.example/auth.git');
		addPage(source, 'guide/deploy.md', {
			anchor: 'rollback',
			title: 'Rollback',
			text: 'Run it.\n'
		});
		addPage(source, 'index.md', { title: 'Overview', text: 'Rollback basics.' });

		expect(searchSnippets(db, { query: 'rollback', allowedSources: 'all' })).toBe(
			[
				'### auth › Rollback',
				'Source: auth/guide/deploy#rollback',
				'Edit: https://git.example/auth.git (main) docs/guide/deploy.md',
				'',
				'Run it.',
				'',
				'### auth › Overview',
				'Source: auth/index',
				'Edit: https://git.example/auth.git (main) docs/index.md',
				'',
				'Rollback basics.'
			].join('\n')
		);
	});

	it('searches all sources, or only the given ones', () => {
		addPage(addSource('platform-docs'), 'a.md', { title: 'Rollback' });
		addPage(addSource('billing-docs'), 'b.md', { title: 'Rollback' });
		addPage(addSource('billing-archive'), 'c.md', { title: 'Rollback' });

		expect(
			sourceIds(searchSnippets(db, { query: 'rollback', allowedSources: 'all' })).sort()
		).toEqual(['billing-archive/c', 'billing-docs/b', 'platform-docs/a']);
		expect(
			sourceIds(
				searchSnippets(db, { query: 'rollback', sources: ['billing-docs'], allowedSources: 'all' })
			)
		).toEqual(['billing-docs/b']);
		expect(
			sourceIds(
				searchSnippets(db, {
					query: 'rollback',
					sources: ['billing-docs', 'platform-docs'],
					allowedSources: 'all'
				})
			).sort()
		).toEqual(['billing-docs/b', 'platform-docs/a']);
	});

	it('leaves out sources the caller may not see', () => {
		addPage(addSource('platform-docs'), 'a.md', { title: 'Rollback' });
		addPage(addSource('billing-docs'), 'b.md', { title: 'Rollback' });

		expect(
			sourceIds(searchSnippets(db, { query: 'rollback', allowedSources: ['platform-docs'] }))
		).toEqual(['platform-docs/a']);
		expect(
			searchSnippets(db, {
				query: 'rollback',
				sources: ['billing-docs'],
				allowedSources: ['platform-docs']
			})
		).toBe('');
		expect(searchSnippets(db, { query: 'rollback', allowedSources: [] })).toBe('');
	});

	it('skips a hit that does not fit, takes a later one that does, and lists the skipped IDs', () => {
		const source = addSource('auth');
		addPage(
			source,
			'deploy.md',
			{ anchor: 'first', title: 'Rollback', text: 'Short.' },
			{ anchor: 'large', title: 'Rollback', text: `Rollback ${'x'.repeat(2000)}` },
			{ anchor: 'last', title: 'Steps', text: 'Rollback later.' }
		);

		const result = searchSnippets(db, { query: 'rollback', tokens: 200, allowedSources: 'all' });

		expect(sourceIds(result)).toEqual(['auth/deploy#first', 'auth/deploy#last']);
		expect(result.endsWith('\n\nDid not fit: auth/deploy#large')).toBe(true);

		// The same search with its hits, for the start page: the agent's answer stays as it is.
		const found = searchHits(db, { query: 'rollback', tokens: 200, allowedSources: 'all' });
		expect(found.markdown).toBe(result);
		expect(found.hits.map((hit) => hit.anchor)).toEqual(['first', 'last']);
		expect(found.skipped).toEqual(['auth/deploy#large']);
	});

	it('names a section once when several of its parts do not fit', () => {
		addPage(
			addSource('auth'),
			'deploy.md',
			{ anchor: 'large', title: 'Rollback', text: `Rollback ${'x'.repeat(2000)}` },
			{ anchor: 'large', title: 'Rollback', text: `Rollback ${'y'.repeat(2000)}` },
			{ anchor: 'other', title: 'Rollback', text: `Rollback ${'z'.repeat(2000)}` }
		);

		const result = searchSnippets(db, { query: 'rollback', tokens: 200, allowedSources: 'all' });

		expect(result).toBe('Did not fit: auth/deploy#large, auth/deploy#other');
	});

	it('has no line about skipped hits when everything fits', () => {
		addPage(addSource('auth'), 'a.md', { title: 'Rollback' });

		expect(searchSnippets(db, { query: 'rollback', allowedSources: 'all' })).not.toContain(
			'Did not fit'
		);
	});

	it('names the searched words that no searched source contains, after the hits', () => {
		addPage(addSource('platform-docs'), 'a.md', { title: 'Rollback', text: 'Deploy steps' });

		const found = searchHits(db, {
			query: 'Wie mache ich einen Rollback mit Terraform?',
			allowedSources: 'all'
		});

		expect(found.unknown).toEqual(['terraform', 'mache']);
		expect(found.markdown.endsWith('\n\nNot in any searched source: terraform, mache')).toBe(true);
		expect(searchHits(db, { query: 'rollback deploy', allowedSources: 'all' })).toMatchObject({
			unknown: []
		});
		expect(searchHits(db, { query: 'terraform', allowedSources: 'all' })).toMatchObject({
			unknown: [],
			markdown: ''
		});
	});

	it('counts a word as not found when only a source outside the search contains it', () => {
		addPage(addSource('platform-docs'), 'a.md', { title: 'Rollback' });
		addPage(addSource('billing-docs'), 'b.md', { title: 'Terraform' });

		expect(
			searchHits(db, { query: 'rollback terraform', allowedSources: ['platform-docs'] }).unknown
		).toEqual(['terraform']);
		expect(
			searchHits(db, {
				query: 'rollback terraform',
				sources: ['platform-docs'],
				allowedSources: 'all'
			}).unknown
		).toEqual(['terraform']);
		expect(searchHits(db, { query: 'rollback terraform', allowedSources: 'all' }).unknown).toEqual(
			[]
		);
	});

	it('keeps the words of a source apart from another one whose snippets lie between its own', () => {
		const platform = addSource('platform-docs');
		addPage(platform, 'a.md', { title: 'Rollback' });
		addPage(addSource('billing-docs'), 'b.md', { title: 'Terraform' });
		addPage(platform, 'c.md', { title: 'Deploy' });

		const restricted = searchHits(db, {
			query: 'deploy terraform',
			sources: ['platform-docs'],
			allowedSources: 'all'
		});

		expect(restricted.unknown).toEqual(['terraform']);
		expect(restricted.elsewhere).toEqual(['billing-docs']);
		expect(
			searchHits(db, { query: 'deploy terraform', allowedSources: ['platform-docs'] }).unknown
		).toEqual(['terraform']);
	});

	describe('other sources holding the words a restricted search missed', () => {
		beforeEach(() => {
			addPage(addSource('platform-docs'), 'a.md', { title: 'Rollback' });
			addPage(addSource('billing-docs'), 'b.md', { title: 'Terraform' });
			addPage(
				addSource('infra-docs'),
				'c.md',
				{ anchor: 'plan', title: 'Terraform plan' },
				{ anchor: 'apply', title: 'Terraform apply' }
			);
		});

		it('names them after the unknown words, most matches first', () => {
			const found = searchHits(db, {
				query: 'rollback terraform',
				sources: ['platform-docs'],
				allowedSources: 'all'
			});

			expect(found.elsewhere).toEqual(['infra-docs', 'billing-docs']);
			expect(found.markdown).toMatch(
				/\n\nNot in any searched source: terraform\nFound in other sources: infra-docs, billing-docs$/
			);
		});

		it('names them also when nothing was found', () => {
			expect(
				searchHits(db, { query: 'terraform', sources: ['platform-docs'], allowedSources: 'all' })
			).toMatchObject({ markdown: '', elsewhere: ['infra-docs', 'billing-docs'] });
		});

		it('names only sources the reader may see', () => {
			expect(
				searchHits(db, {
					query: 'rollback terraform',
					sources: ['platform-docs'],
					allowedSources: ['platform-docs', 'billing-docs']
				}).elsewhere
			).toEqual(['billing-docs']);
		});

		it('looks for none when the search is not restricted or no word is missing', () => {
			expect(
				searchHits(db, { query: 'rollback kubernetes', allowedSources: 'all' }).elsewhere
			).toEqual([]);
			const complete = searchHits(db, {
				query: 'rollback',
				sources: ['platform-docs'],
				allowedSources: 'all'
			});
			expect(complete.elsewhere).toEqual([]);
			expect(complete.markdown).not.toContain('Found in other sources');
		});
	});

	it('searches the most common index term one edit away for a word no source contains', () => {
		addPage(addSource('platform-docs'), 'a.md', { title: 'Install', text: 'install the agent' });
		addPage(addSource('billing-docs'), 'b.md', { title: 'Installieren', text: 'installieren' });

		const found = searchHits(db, { query: 'instal agent', allowedSources: 'all' });

		expect(sourceIds(found.markdown)).toEqual(['platform-docs/a']);
		expect(found.unknown).toEqual(['instal']);
		expect(found.markdown).toMatch(
			/\n\nNot in any searched source: instal \(searched as install\)$/
		);
	});

	it('finds the term one edit away for a word typed with umlauts', () => {
		addPage(addSource('billing-docs'), 'a.md', {
			title: 'Änderungen',
			text: 'Jede Konfigurationsänderung wird protokolliert.'
		});

		for (const [typed, term] of [
			['Änderugnen', 'anderungen'],
			['Konfigurationsänderugn', 'konfigurationsanderung']
		]) {
			const found = searchHits(db, { query: typed, allowedSources: 'all' });

			expect(sourceIds(found.markdown)).toEqual(['billing-docs/a']);
			expect(found.markdown).toMatch(
				new RegExp(`Not in any searched source: ${typed.toLowerCase()} \\(searched as ${term}\\)$`)
			);
		}
	});

	it('searches a longer form by prefix when no term is one edit away', () => {
		addPage(addSource('billing-docs'), 'a.md', { title: 'Monatlicher Abrechnungslauf' });

		const found = searchHits(db, { query: 'monatlich', allowedSources: 'all' });

		expect(sourceIds(found.markdown)).toEqual(['billing-docs/a']);
		expect(found.markdown).toMatch(
			/Not in any searched source: monatlich \(searched as monatlich\*\)$/
		);
	});

	it('leaves short words and words without a near term as they are', () => {
		addPage(addSource('platform-docs'), 'a.md', { title: 'Rollback', text: 'sso' });

		expect(searchHits(db, { query: 'rollback ssx', allowedSources: 'all' }).markdown).toMatch(
			/Not in any searched source: ssx$/
		);
		expect(searchHits(db, { query: 'terraform', allowedSources: 'all' }).markdown).toBe('');
	});

	it('never searches instead with a term only a source outside the search contains', () => {
		addPage(addSource('platform-docs'), 'a.md', { title: 'Rollback' });
		addPage(addSource('billing-docs'), 'b.md', { title: 'Invoices', text: 'invoices' });

		for (const found of [
			searchHits(db, { query: 'rollback invoicez', allowedSources: ['platform-docs'] }),
			searchHits(db, {
				query: 'rollback invoicez',
				sources: ['platform-docs'],
				allowedSources: 'all'
			})
		]) {
			expect(sourceIds(found.markdown)).toEqual(['platform-docs/a']);
			expect(found.markdown).toMatch(/Not in any searched source: invoicez$/);
		}
		expect(
			searchHits(db, { query: 'rollback invoicez', allowedSources: 'all' }).markdown
		).toContain('invoicez (searched as invoices)');
	});

	it('accepts questions with characters that are FTS5 syntax', () => {
		addPage(addSource('auth-service'), 'a.md', {
			title: 'Deploy',
			text: 'auth-service uses ENV=prod'
		});

		expect(
			sourceIds(searchSnippets(db, { query: 'auth-service?', allowedSources: 'all' }))
		).toEqual(['auth-service/a']);
		expect(
			sourceIds(
				searchSnippets(db, { query: 'how to set ENV=prod "quoted"', allowedSources: 'all' })
			)
		).toEqual(['auth-service/a']);
		expect(searchSnippets(db, { query: '?!', allowedSources: 'all' })).toBe('');
	});

	it('searches a repeated word once, so the words after it still count', () => {
		addPage(addSource('platform'), 'deploy.md', { title: 'Deploy', text: 'rollback steps' });

		const question = `${'the '.repeat(100)}rollback`;
		expect(sourceIds(searchSnippets(db, { query: question, allowedSources: 'all' }))).toEqual([
			'platform/deploy'
		]);
	});

	it('leaves out filler words, so short technical terms of a long question are searched', () => {
		addPage(addSource('platform'), 'sso.md', { title: 'SSO', text: 'jwt rotation' });
		const question =
			'How do I rotate the signing key for SSO tokens when the identity provider of the billing service changes its certificate and the old JWT must keep working?';

		expect(sourceIds(searchSnippets(db, { query: question, allowedSources: 'all' }))).toEqual([
			'platform/sso'
		]);
		addPage(addSource('words'), 'how.md', { title: 'How to', text: 'what is this' });
		expect(sourceIds(searchSnippets(db, { query: 'how to', allowedSources: 'all' }))).toEqual([
			'words/how'
		]);
	});

	it('searches the 16 longest different words of a long question', () => {
		addPage(addSource('platform'), 'deploy.md', { title: 'Deploy', text: 'rollback steps' });
		const short = Array.from({ length: 16 }, (_, index) => `w${index}`).join(' ');
		const long = Array.from({ length: 16 }, (_, index) => `configuration${index}`).join(' ');

		expect(
			sourceIds(searchSnippets(db, { query: `${short} rollback`, allowedSources: 'all' }))
		).toEqual(['platform/deploy']);
		expect(searchSnippets(db, { query: `${long} rollback`, allowedSources: 'all' })).toBe('');
		expect(
			sourceIds(
				searchSnippets(db, {
					query:
						'How do I configure the retry policy and the timeout for outgoing HTTP requests in the payment gateway rollback?',
					allowedSources: 'all'
				})
			)
		).toEqual(['platform/deploy']);
	});
});
