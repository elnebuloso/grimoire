import { describe, it, expect, beforeEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../db/schema';
import { replaceSourceIndex } from '../db/sources';
import { chunkPage, estimateTokens } from '../parsing/chunk';
import { preprocessPage } from '../parsing/preprocess';
import {
	agentInstructions,
	indexProject,
	listProjects,
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
	pages: Record<string, string>
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
			return { file, metadata, chunked: chunkPage(metadata, { project, source: slug, file }) };
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

describe('listProjects', () => {
	it('lists the projects with their description', () => {
		expect(listProjects(db, undefined)).toEqual({
			found: true,
			markdown: '- billing\n- platform: Login and gateway'
		});
	});

	it('lists only the projects in scope', () => {
		expect(listProjects(db, ['billing']).markdown).toBe('- billing');
		expect(listProjects(db, []).markdown).toBe('No projects.');
	});
});

describe('indexProject', () => {
	it('lists pages and their sections with IDs, split sections once, nested by depth', () => {
		expect(indexProject(db, 'platform', undefined)).toEqual({
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

	it('treats an unknown project and one out of scope alike', () => {
		const unknown = indexProject(db, 'nope', undefined);
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
		const result = queryProjects(db, { query: 'rollback', project: 'billing' }, undefined);

		expect(result).toEqual({
			found: true,
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
		const result = queryProjects(db, { query: 'kubernetes' }, undefined);

		expect(result.found).toBe(true);
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
});

describe('readById', () => {
	it('returns a whole page, overview first', () => {
		const result = readById(db, 'platform/auth/deploy', undefined);

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
		expect(sourceIds(readById(db, 'platform/auth/deploy#upgrade', undefined).markdown)).toEqual([
			'platform/auth/deploy#upgrade'
		]);
		expect(readById(db, 'platform/auth/deploy#large', undefined).markdown).toMatch(
			/Large \(1\/2\)[\s\S]*Large \(2\/2\)/
		);
		const merged = readById(db, 'platform/auth/deploy#port', undefined).markdown;
		expect(sourceIds(merged)).toEqual(['platform/auth/deploy#rollback']);
		expect(merged).toContain('Small.');
	});

	it('reads pages in subdirectories', () => {
		expect(sourceIds(readById(db, 'platform/auth/guide/start', undefined).markdown)).toEqual([
			'platform/auth/guide/start'
		]);
	});

	it('reports unknown and out-of-scope IDs as not found', () => {
		for (const [id, scope] of [
			['platform/auth/missing', undefined],
			['platform/auth/deploy#missing', undefined],
			['platform/auth', undefined],
			['platform/auth/deploy', ['billing']]
		] as const) {
			const result = readById(db, id, scope ? [...scope] : undefined);
			expect(result).toEqual({ found: false, markdown: expect.stringContaining(id) });
		}
	});
});

describe('agentInstructions', () => {
	it('stays under 250 tokens, since it sits in agent context permanently', () => {
		expect(agentInstructions).toContain('grimoire');
		expect(estimateTokens(agentInstructions)).toBeLessThan(250);
	});
});
