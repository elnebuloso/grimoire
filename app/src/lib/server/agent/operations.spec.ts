import { describe, it, expect, beforeEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../db/schema';
import { replaceSourceIndex } from '../db/sources';
import { chunkPage, estimateTokens } from '../parsing/chunk';
import { splitCode } from '../parsing/markdown';
import { preprocessPage } from '../parsing/preprocess';
import { indexPages } from '../sync/index-pages';
import { changeSourceSlug } from '../admin/sources';
import { parseGrimoireId } from '../grimoire-id';
import { listMissedQueries } from '../missed-queries';
import {
	agentInstructions,
	agentQuery,
	indexSource,
	listVisibleSources,
	llmsTxt,
	querySources,
	readById
} from './operations';

let db: DatabaseSync;

const paragraph = (words: number) => Array(words).fill('word').join(' ');

const DEPLOY = `# Deploy

How auth-service reaches production.

## Rollback

${paragraph(60)}

### Port

Small.

## Upgrade

${paragraph(60)}

### Database

${paragraph(60)}

## Large

${Array(8).fill(paragraph(120)).join('\n\n')}
`;

function addSource(
	slug: string,
	pages: Record<string, string>,
	{ description = '', nav = [] }: { description?: string; nav?: string[] } = {}
): number {
	const sourceId = Number(
		db
			.prepare(
				`INSERT INTO sources (slug, name, description, git_url, branch, path)
				VALUES (?, 'Docs', ?, 'https://git.example/x.git', 'main', 'docs/')`
			)
			.run(slug, description).lastInsertRowid
	);
	replaceSourceIndex(db, sourceId, {
		commit: 'abc',
		links: [],
		warnings: [],
		pages: Object.entries(pages).map(([file, markdown]) => {
			const metadata = preprocessPage(markdown);
			const navPosition = nav.includes(file) ? nav.indexOf(file) : undefined;
			const chunked = chunkPage(metadata, file);
			const searchTexts = chunked.snippets.map((snippet) => splitCode(snippet.content));
			return { file, navPosition, metadata, chunked, searchTexts };
		})
	});
	return sourceId;
}

function sourceIds(markdown: string): string[] {
	return [...markdown.matchAll(/^Source: (.+)$/gm)].map((match) => match[1]);
}

beforeEach(() => {
	db = openDatabase(':memory:');
	addSource(
		'platform-docs',
		{ 'deploy.md': DEPLOY, 'guide/start.md': '# Start\n\nFirst steps.' },
		{ description: 'Login and gateway' }
	);
	addSource('billing-docs', { 'index.md': '# Invoices\n\nRollback.' });
});

describe('listVisibleSources', () => {
	it('lists the sources with their description', () => {
		expect(listVisibleSources(db, 'all')).toEqual({
			found: true,
			markdown: '- billing-docs\n- platform-docs: Login and gateway'
		});
	});

	it('lists only the sources in scope', () => {
		expect(listVisibleSources(db, ['billing-docs']).markdown).toBe('- billing-docs');
		expect(listVisibleSources(db, []).markdown).toBe('No sources.');
	});
});

describe('indexSource', () => {
	it('lists pages and their sections with IDs, split sections once, nested by depth', () => {
		expect(indexSource(db, 'platform-docs', 'all')).toEqual({
			found: true,
			markdown: [
				'# platform-docs',
				'',
				'Login and gateway',
				'',
				'- platform-docs/deploy: Deploy',
				'  - platform-docs/deploy#rollback: Rollback',
				'  - platform-docs/deploy#upgrade: Upgrade',
				'    - platform-docs/deploy#database: Database',
				'  - platform-docs/deploy#large: Large',
				'- platform-docs/guide/start: Start'
			].join('\n')
		});
	});

	it('keeps a heading that ends like a part label', () => {
		addSource('support-docs', {
			'index.md': `# Support\n\n## Hotline (24/7)\n\n${paragraph(60)}\n`
		});

		expect(indexSource(db, 'support-docs', 'all').markdown).toContain(
			'support-docs/index#hotline-247: Hotline (24/7)'
		);
	});

	it('lists pages in nav order first, the others after them by file', () => {
		addSource(
			'ordered',
			{ 'a.md': '# A', 'b.md': '# B', 'c.md': '# C', 'd.md': '# D' },
			{ nav: ['c.md', 'a.md'] }
		);
		expect(indexSource(db, 'ordered', 'all').markdown).toBe(
			[
				'# ordered',
				'',
				'- ordered/c: C',
				'- ordered/a: A',
				'- ordered/b: B',
				'- ordered/d: D'
			].join('\n')
		);
	});

	it('treats an unknown source and one out of scope alike', () => {
		const unknown = indexSource(db, 'nope', 'all');
		const hidden = indexSource(db, 'platform-docs', ['billing-docs']);

		expect(unknown.found).toBe(false);
		expect(hidden).toEqual({
			found: false,
			markdown: unknown.markdown.replace('nope', 'platform-docs')
		});
	});
});

describe('querySources', () => {
	it('returns the hits in the snippet format', () => {
		const result = querySources(db, { query: 'rollback', sources: ['billing-docs'] }, 'all');

		expect(result).toEqual({
			found: true,
			missed: false,
			markdown: [
				'### billing-docs › Invoices › Overview',
				'Source: billing-docs/index',
				'Edit: https://git.example/x.git (main) docs/index.md',
				'',
				'Rollback.'
			].join('\n')
		});
	});

	it('searches several given sources and leaves the others out', () => {
		addSource('billing-archive', { 'index.md': '# Old invoices\n\nRollback in 2019.' });

		const result = querySources(
			db,
			{ query: 'rollback', sources: ['billing-docs', 'billing-archive'] },
			'all'
		);

		expect(sourceIds(result.markdown).sort()).toEqual([
			'billing-archive/index',
			'billing-docs/index'
		]);
	});

	it('says so when nothing matches', () => {
		const result = querySources(db, { query: 'kubernetes' }, 'all');

		expect(result.found).toBe(true);
		expect(result.missed).toBe(true);
		expect(result.markdown).toContain('No results for "kubernetes"');
	});

	it('searches only the sources in scope', () => {
		expect(sourceIds(querySources(db, { query: 'rollback' }, ['billing-docs']).markdown)).toEqual([
			'billing-docs/index'
		]);
		expect(
			querySources(db, { query: 'rollback', sources: ['platform-docs'] }, ['billing-docs']).found
		).toBe(false);
	});

	it('answers not found when one of the given sources is unknown or hidden', () => {
		expect(
			querySources(db, { query: 'rollback', sources: ['billing-docs', 'nope'] }, 'all')
		).toEqual({
			found: false,
			missed: false,
			markdown: 'Source "nope" not found. See `sources`.'
		});
		expect(
			querySources(db, { query: 'rollback', sources: ['billing-docs', 'platform-docs'] }, [
				'billing-docs'
			]).markdown
		).toBe('Source "platform-docs" not found. See `sources`.');
	});

	it('answers an empty source name like an unknown source', () => {
		expect(querySources(db, { query: 'rollback', sources: [''] }, 'all')).toEqual({
			found: false,
			missed: false,
			markdown: expect.stringContaining('Source "" not found')
		});
	});
});

describe('agentQuery', () => {
	it('cuts an over-long question before searching and recording it as missed', () => {
		const question = 'kubernetes '.repeat(1000);

		const result = agentQuery(db, { query: question }, 'all');

		expect(result.missed).toBe(true);
		const [missed] = listMissedQueries(db);
		expect(missed.question).toHaveLength(500);
		expect(question.startsWith(missed.question)).toBe(true);
	});

	it('records a missed question trimmed, and one of only whitespace not at all', () => {
		agentQuery(db, { query: '  release process \n' }, 'all');
		agentQuery(db, { query: ' \t ' }, 'all');

		expect(listMissedQueries(db)).toMatchObject([{ question: 'release process', count: 1 }]);
	});

	it('records the sources a missed question was asked in', () => {
		agentQuery(db, { query: 'kubernetes', sources: ['platform-docs', 'billing-docs'] }, 'all');

		expect(listMissedQueries(db)).toMatchObject([
			{ question: 'kubernetes', sources: ['billing-docs', 'platform-docs'] }
		]);
	});
});

describe('llmsTxt', () => {
	it('escapes brackets in a title, so its link stays a link', () => {
		addSource('runbooks', { 'index.md': '# The [old] way \\ back' });

		expect(llmsTxt(db, 'runbooks', 'all', 'https://grimoire.example').markdown).toContain(
			'- [The \\[old\\] way \\\\ back](https://grimoire.example/p/runbooks/index)'
		);
	});

	it('links every page of the source to its HTTP route, sections left out', () => {
		addSource('runbooks', { 'On Call/first day.md': '# First day' });

		expect(llmsTxt(db, 'platform-docs', 'all', 'https://grimoire.example')).toEqual({
			found: true,
			markdown: [
				'# platform-docs',
				'',
				'> Login and gateway',
				'',
				'- [Deploy](https://grimoire.example/p/platform-docs/deploy)',
				'- [Start](https://grimoire.example/p/platform-docs/guide/start)'
			].join('\n')
		});
		expect(llmsTxt(db, 'runbooks', 'all', 'https://grimoire.example').markdown).toContain(
			'- [First day](https://grimoire.example/p/runbooks/On%20Call/first%20day)'
		);
	});

	it('treats a source out of scope like an unknown one', () => {
		expect(llmsTxt(db, 'platform-docs', ['billing-docs'], 'https://grimoire.example')).toEqual(
			indexSource(db, 'platform-docs', ['billing-docs'])
		);
	});
});

describe('readById', () => {
	it('returns a whole page, overview first', () => {
		const result = readById(db, parseGrimoireId('platform-docs/deploy')!, 'all');

		expect(sourceIds(result.markdown)).toEqual([
			'platform-docs/deploy',
			'platform-docs/deploy#rollback',
			'platform-docs/deploy#upgrade',
			'platform-docs/deploy#database',
			'platform-docs/deploy#large',
			'platform-docs/deploy#large'
		]);
	});

	it('returns a section, all parts of a split one, and the parent of a merged subsection', () => {
		expect(
			sourceIds(readById(db, parseGrimoireId('platform-docs/deploy#upgrade')!, 'all').markdown)
		).toEqual(['platform-docs/deploy#upgrade']);
		expect(readById(db, parseGrimoireId('platform-docs/deploy#large')!, 'all').markdown).toMatch(
			/Large \(1\/2\)[\s\S]*Large \(2\/2\)/
		);
		const merged = readById(db, parseGrimoireId('platform-docs/deploy#port')!, 'all').markdown;
		expect(sourceIds(merged)).toEqual(['platform-docs/deploy#rollback']);
		expect(merged).toContain('Small.');
	});

	it('returns the first subsection for a heading with only subheadings below it', () => {
		addSource('setup-docs', {
			'setup.md': `# Setup\n\n## Install\n\n### Linux\n\n${paragraph(60)}\n\n### macOS\n\n${paragraph(60)}\n`
		});

		const result = readById(db, parseGrimoireId('setup-docs/setup#install')!, 'all');

		expect(result.found).toBe(true);
		expect(sourceIds(result.markdown)).toEqual(['setup-docs/setup#linux']);
	});

	it('reads pages in subdirectories', () => {
		expect(
			sourceIds(readById(db, parseGrimoireId('platform-docs/guide/start')!, 'all').markdown)
		).toEqual(['platform-docs/guide/start']);
	});

	it('reports unknown and out-of-scope IDs as not found', () => {
		for (const [id, scope] of [
			['platform-docs/missing', 'all'],
			['platform-docs/deploy#missing', 'all'],
			['platform-docs/deploy', ['billing-docs']]
		] as const) {
			const result = readById(db, parseGrimoireId(id)!, scope === 'all' ? scope : [...scope]);
			expect(result).toEqual({ found: false, markdown: expect.stringContaining(id) });
		}
	});
});

describe('after a slug change', () => {
	it('reads, searches, lists and links under the new slug at once, without a sync', () => {
		const sourceId = Number(
			db
				.prepare(
					`INSERT INTO sources (slug, name, git_url, branch, path)
					VALUES ('wiki', 'Wiki', 'https://git.example/x.git', 'main', 'docs/')`
				)
				.run().lastInsertRowid
		);
		const pages = [
			{ file: 'index.md', markdown: '# Start\n\nSee [rollback](deploy.md#rollback).\n' },
			{ file: 'deploy.md', markdown: DEPLOY }
		].map((page) => ({ ...page, navPosition: undefined, includeWarnings: [] }));
		replaceSourceIndex(db, sourceId, {
			commit: 'abc',
			...indexPages({ pages, warnings: [], sourcePath: 'docs' })
		});

		changeSourceSlug(db, sourceId, { slug: 'login', confirmation: 'wiki' });

		const start = readById(db, parseGrimoireId('login/index')!, 'all');
		expect(start.markdown).toContain('### login › Start');
		expect(start.markdown).toContain('[rollback](login/deploy#rollback)');
		expect(querySources(db, { query: 'rollback', sources: ['login'] }, 'all').markdown).toContain(
			'Source: login/deploy#rollback'
		);
		expect(indexSource(db, 'login', 'all').markdown).toContain('- login/deploy#rollback: Rollback');
		expect(readById(db, parseGrimoireId('wiki/index')!, 'all').found).toBe(false);
	});
});

describe('agentInstructions', () => {
	it('stays under 250 tokens, since it sits in agent context permanently', () => {
		expect(agentInstructions('grimoire')).toContain('grimoire');
		expect(estimateTokens(agentInstructions('grimoire'))).toBeLessThan(250);
	});

	it('names the instance by its own name', () => {
		const text = agentInstructions('Acme Docs');
		expect(text).toContain('Acme Docs is the organization');
		expect(text).not.toContain('grimoire');
	});
});
