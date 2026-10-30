import { describe, it, expect, beforeEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../db/schema';
import { replaceSourceIndex } from '../db/sources';
import { chunkPage, estimateTokens } from '../parsing/chunk';
import { preprocessPage } from '../parsing/preprocess';
import { indexPages } from '../sync/index-pages';
import { changeProjectSlug, changeSourceSlug } from '../admin/projects';
import { parseGrimoireId } from '../grimoire-id';
import { listMissedQueries } from '../missed-queries';
import {
	agentInstructions,
	agentQuery,
	indexProject,
	listVisibleProjects,
	llmsTxt,
	queryProjects,
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

function addProject(slug: string, description = ''): number {
	return Number(
		db.prepare('INSERT INTO projects (slug, description) VALUES (?, ?)').run(slug, description)
			.lastInsertRowid
	);
}

function addSource(
	projectId: number,
	project: string,
	slug: string,
	pages: Record<string, string>,
	nav: string[] = []
) {
	const sourceId = Number(
		db
			.prepare(
				`INSERT INTO sources (project_id, slug, git_url, branch, path)
				VALUES (?, ?, 'https://git.example/x.git', 'main', 'docs/')`
			)
			.run(projectId, slug).lastInsertRowid
	);
	replaceSourceIndex(db, sourceId, {
		commit: 'abc',
		links: [],
		warnings: [],
		pages: Object.entries(pages).map(([file, markdown]) => {
			const metadata = preprocessPage(markdown);
			const navPosition = nav.includes(file) ? nav.indexOf(file) : undefined;
			const chunked = chunkPage(metadata, file);
			return { file, navPosition, metadata, chunked };
		})
	});
}

function sourceIds(markdown: string): string[] {
	return [...markdown.matchAll(/^Source: (.+)$/gm)].map((match) => match[1]);
}

beforeEach(() => {
	db = openDatabase(':memory:');
	addSource(addProject('platform', 'Login and gateway'), 'platform', 'auth', {
		'deploy.md': DEPLOY,
		'guide/start.md': '# Start\n\nFirst steps.'
	});
	addSource(addProject('billing'), 'billing', 'invoices', {
		'index.md': '# Invoices\n\nRollback.'
	});
});

describe('listVisibleProjects', () => {
	it('lists the projects with their description', () => {
		expect(listVisibleProjects(db, 'all')).toEqual({
			found: true,
			markdown: '- billing\n- platform: Login and gateway'
		});
	});

	it('lists only the projects in scope', () => {
		expect(listVisibleProjects(db, ['billing']).markdown).toBe('- billing');
		expect(listVisibleProjects(db, []).markdown).toBe('No projects.');
	});
});

describe('indexProject', () => {
	it('lists pages and their sections with IDs, split sections once, nested by depth', () => {
		expect(indexProject(db, 'platform', 'all')).toEqual({
			found: true,
			markdown: [
				'# platform',
				'',
				'Login and gateway',
				'',
				'## auth',
				'',
				'- platform/auth/deploy: Deploy',
				'  - platform/auth/deploy#rollback: Rollback',
				'  - platform/auth/deploy#upgrade: Upgrade',
				'    - platform/auth/deploy#database: Database',
				'  - platform/auth/deploy#large: Large',
				'- platform/auth/guide/start: Start'
			].join('\n')
		});
	});

	it('keeps a heading that ends like a part label', () => {
		addSource(addProject('support'), 'support', 'docs', {
			'index.md': `# Support\n\n## Hotline (24/7)\n\n${paragraph(60)}\n`
		});

		expect(indexProject(db, 'support', 'all').markdown).toContain(
			'support/docs/index#hotline-247: Hotline (24/7)'
		);
	});

	it('lists pages in nav order first, the others after them by file', () => {
		addSource(
			addProject('ordered'),
			'ordered',
			'docs',
			{ 'a.md': '# A', 'b.md': '# B', 'c.md': '# C', 'd.md': '# D' },
			['c.md', 'a.md']
		);
		expect(indexProject(db, 'ordered', 'all').markdown).toBe(
			[
				'# ordered',
				'',
				'## docs',
				'',
				'- ordered/docs/c: C',
				'- ordered/docs/a: A',
				'- ordered/docs/b: B',
				'- ordered/docs/d: D'
			].join('\n')
		);
	});

	it('treats an unknown project and one out of scope alike', () => {
		const unknown = indexProject(db, 'nope', 'all');
		const hidden = indexProject(db, 'platform', ['billing']);

		expect(unknown.found).toBe(false);
		expect(hidden).toEqual({
			found: false,
			markdown: unknown.markdown.replace('nope', 'platform')
		});
	});
});

describe('queryProjects', () => {
	it('returns the hits in the snippet format', () => {
		const result = queryProjects(db, { query: 'rollback', project: 'billing' }, 'all');

		expect(result).toEqual({
			found: true,
			missed: false,
			markdown: [
				'### billing › invoices › Invoices › Overview',
				'Source: billing/invoices/index',
				'Edit: https://git.example/x.git (main) docs/index.md',
				'',
				'Rollback.'
			].join('\n')
		});
	});

	it('says so when nothing matches', () => {
		const result = queryProjects(db, { query: 'kubernetes' }, 'all');

		expect(result.found).toBe(true);
		expect(result.missed).toBe(true);
		expect(result.markdown).toContain('No results for "kubernetes"');
	});

	it('searches only the projects in scope', () => {
		expect(sourceIds(queryProjects(db, { query: 'rollback' }, ['billing']).markdown)).toEqual([
			'billing/invoices/index'
		]);
		expect(queryProjects(db, { query: 'rollback', project: 'platform' }, ['billing']).found).toBe(
			false
		);
	});

	it('answers an empty project name like an unknown project', () => {
		expect(queryProjects(db, { query: 'rollback', project: '' }, 'all')).toEqual({
			found: false,
			missed: false,
			markdown: expect.stringContaining('Project "" not found')
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
});

describe('llmsTxt', () => {
	it('escapes brackets in a title, so its link stays a link', () => {
		addSource(addProject('ops'), 'ops', 'runbooks', { 'index.md': '# The [old] way \\ back' });

		expect(llmsTxt(db, 'ops', 'all', 'https://grimoire.example').markdown).toContain(
			'- [The \\[old\\] way \\\\ back](https://grimoire.example/p/ops/runbooks/index)'
		);
	});

	it('links every page of the project to its HTTP route, sections left out', () => {
		addSource(addProject('ops'), 'ops', 'runbooks', { 'On Call/first day.md': '# First day' });

		expect(llmsTxt(db, 'platform', 'all', 'https://grimoire.example')).toEqual({
			found: true,
			markdown: [
				'# platform',
				'',
				'> Login and gateway',
				'',
				'## auth',
				'',
				'- [Deploy](https://grimoire.example/p/platform/auth/deploy)',
				'- [Start](https://grimoire.example/p/platform/auth/guide/start)'
			].join('\n')
		});
		expect(llmsTxt(db, 'ops', 'all', 'https://grimoire.example').markdown).toContain(
			'- [First day](https://grimoire.example/p/ops/runbooks/On%20Call/first%20day)'
		);
	});

	it('treats a project out of scope like an unknown one', () => {
		expect(llmsTxt(db, 'platform', ['billing'], 'https://grimoire.example')).toEqual(
			indexProject(db, 'platform', ['billing'])
		);
	});
});

describe('readById', () => {
	it('returns a whole page, overview first', () => {
		const result = readById(db, parseGrimoireId('platform/auth/deploy')!, 'all');

		expect(sourceIds(result.markdown)).toEqual([
			'platform/auth/deploy',
			'platform/auth/deploy#rollback',
			'platform/auth/deploy#upgrade',
			'platform/auth/deploy#database',
			'platform/auth/deploy#large',
			'platform/auth/deploy#large'
		]);
	});

	it('returns a section, all parts of a split one, and the parent of a merged subsection', () => {
		expect(
			sourceIds(readById(db, parseGrimoireId('platform/auth/deploy#upgrade')!, 'all').markdown)
		).toEqual(['platform/auth/deploy#upgrade']);
		expect(readById(db, parseGrimoireId('platform/auth/deploy#large')!, 'all').markdown).toMatch(
			/Large \(1\/2\)[\s\S]*Large \(2\/2\)/
		);
		const merged = readById(db, parseGrimoireId('platform/auth/deploy#port')!, 'all').markdown;
		expect(sourceIds(merged)).toEqual(['platform/auth/deploy#rollback']);
		expect(merged).toContain('Small.');
	});

	it('reads pages in subdirectories', () => {
		expect(
			sourceIds(readById(db, parseGrimoireId('platform/auth/guide/start')!, 'all').markdown)
		).toEqual(['platform/auth/guide/start']);
	});

	it('reports unknown and out-of-scope IDs as not found', () => {
		for (const [id, scope] of [
			['platform/auth/missing', 'all'],
			['platform/auth/deploy#missing', 'all'],
			['platform/auth/deploy', ['billing']]
		] as const) {
			const result = readById(db, parseGrimoireId(id)!, scope === 'all' ? scope : [...scope]);
			expect(result).toEqual({ found: false, markdown: expect.stringContaining(id) });
		}
	});
});

describe('after a slug change', () => {
	it('reads, searches, lists and links under the new slugs at once, without a sync', () => {
		const projectId = addProject('legacy');
		const sourceId = Number(
			db
				.prepare(
					`INSERT INTO sources (project_id, slug, git_url, branch, path)
					VALUES (?, 'wiki', 'https://git.example/x.git', 'main', 'docs/')`
				)
				.run(projectId).lastInsertRowid
		);
		const pages = [
			{ file: 'index.md', markdown: '# Start\n\nSee [rollback](deploy.md#rollback).\n' },
			{ file: 'deploy.md', markdown: DEPLOY }
		].map((page) => ({ ...page, navPosition: undefined, includeWarnings: [] }));
		replaceSourceIndex(db, sourceId, {
			commit: 'abc',
			...indexPages({ pages, warnings: [], sourcePath: 'docs' })
		});

		changeProjectSlug(db, projectId, { slug: 'team', confirmation: 'legacy' });
		changeSourceSlug(db, projectId, sourceId, { slug: 'login', confirmation: 'wiki' });

		const start = readById(db, parseGrimoireId('team/login/index')!, 'all');
		expect(start.markdown).toContain('### team › login › Start');
		expect(start.markdown).toContain('[rollback](team/login/deploy#rollback)');
		expect(queryProjects(db, { query: 'rollback' }, 'all').markdown).toContain(
			'Source: team/login/deploy#rollback'
		);
		expect(indexProject(db, 'team', 'all').markdown).toContain(
			'- team/login/deploy#rollback: Rollback'
		);
		expect(readById(db, parseGrimoireId('legacy/wiki/index')!, 'all').found).toBe(false);
	});
});

describe('agentInstructions', () => {
	it('stays under 250 tokens, since it sits in agent context permanently', () => {
		expect(agentInstructions).toContain('grimoire');
		expect(estimateTokens(agentInstructions)).toBeLessThan(250);
	});
});
