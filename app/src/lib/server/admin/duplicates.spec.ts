import { describe, it, expect } from 'vitest';
import {
	compareSources,
	directoryKey,
	findOverlaps,
	repositoryKey,
	type SourceLocation
} from './duplicates';

function source(path: string, changes: Partial<SourceLocation> = {}): SourceLocation {
	return { gitUrl: 'https://gitlab.example.com/platform/auth', path, exclusions: [], ...changes };
}

describe('repositoryKey', () => {
	it.each([
		'https://gitlab.example.com/platform/auth',
		'https://gitlab.example.com/platform/auth.git',
		'https://gitlab.example.com/platform/auth/',
		'https://gitlab.example.com/platform/auth.git/',
		'https://GitLab.Example.com/Platform/Auth.git',
		'https://gitlab.example.com:443/platform/auth',
		' https://gitlab.example.com/platform/auth '
	])('writes %s as the same repository', (gitUrl) => {
		expect(repositoryKey(gitUrl)).toBe('gitlab.example.com/platform/auth');
	});

	it('keeps a port that is not the default and a group of its own apart', () => {
		expect(repositoryKey('https://gitlab.example.com:8443/platform/auth')).toBe(
			'gitlab.example.com:8443/platform/auth'
		);
		expect(repositoryKey('https://gitlab.example.com/platform/auth-docs')).not.toBe(
			repositoryKey('https://gitlab.example.com/platform/auth')
		);
	});
});

describe('directoryKey', () => {
	it.each(['docs', 'docs/', './docs', 'docs//', ' docs '])('writes %s as docs', (path) => {
		expect(directoryKey(path)).toBe('docs');
	});

	it.each(['', '.', './', '/'])('writes %s as the whole repository', (path) => {
		expect(directoryKey(path)).toBe('');
	});
});

describe('compareSources', () => {
	it('tells the same repository and path a duplicate, whatever the spelling', () => {
		expect(
			compareSources(
				source('docs/'),
				source('./docs', { gitUrl: 'https://GitLab.example.com/platform/auth.git' })
			)
		).toBe('duplicate');
	});

	it('ignores the exclusions of a duplicate', () => {
		expect(compareSources(source('docs', { exclusions: ['docs/**'] }), source('docs'))).toBe(
			'duplicate'
		);
	});

	it('tells a path inside the other an overlap, in both directions', () => {
		expect(compareSources(source('docs'), source('docs/api'))).toBe('overlap');
		expect(compareSources(source('docs/api'), source('docs'))).toBe('overlap');
	});

	it('tells the whole repository an overlap with any of its directories', () => {
		expect(compareSources(source(''), source('docs'))).toBe('overlap');
		expect(compareSources(source('docs'), source('.'))).toBe('overlap');
	});

	it('sees no overlap where the outer source excludes every file under the inner path', () => {
		const outer = source('docs', { exclusions: ['docs/api/**'] });
		expect(compareSources(outer, source('docs/api'))).toBeUndefined();
		expect(compareSources(source('docs/api'), outer)).toBeUndefined();
	});

	it('still sees an overlap where the exclusion leaves files under the inner path', () => {
		const outer = source('docs', { exclusions: ['docs/api/*.md', 'docs/guides/**'] });
		expect(compareSources(outer, source('docs/api'))).toBe('overlap');
	});

	it('tells paths that only share the start of a name apart', () => {
		expect(compareSources(source('docs'), source('docs-old'))).toBeUndefined();
	});

	it('tells sibling directories and other repositories apart', () => {
		expect(compareSources(source('docs/api'), source('docs/guides'))).toBeUndefined();
		expect(
			compareSources(
				source('docs'),
				source('docs', { gitUrl: 'https://gitlab.example.com/platform/billing' })
			)
		).toBeUndefined();
	});
});

describe('findOverlaps', () => {
	it('lists each pair once, in the order of the sources, and leaves unrelated sources out', () => {
		const docs = source('docs');
		const copy = source('./docs/');
		const api = source('docs/api');
		const billing = source('docs', { gitUrl: 'https://gitlab.example.com/platform/billing' });
		expect(findOverlaps([docs, billing, copy, api])).toEqual([
			{ kind: 'duplicate', first: docs, second: copy },
			{ kind: 'overlap', first: docs, second: api },
			{ kind: 'overlap', first: copy, second: api }
		]);
	});

	it('finds nothing among sources of different repositories', () => {
		expect(
			findOverlaps([source('docs'), source('docs', { gitUrl: 'https://gitlab.example.com/x' })])
		).toEqual([]);
	});
});
