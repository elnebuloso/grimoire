import { describe, it, expect } from 'vitest';
import { indexPages } from './index-pages';

const broken = {
	file: 'broken.md',
	markdown: '---\ntitle: [unclosed\n---\n# Broken\n',
	includeWarnings: []
};
const home = { file: 'index.md', markdown: '# Home\n\nText.\n', includeWarnings: [] };

describe('indexPages', () => {
	it('skips a page it cannot process and says so', () => {
		const index = indexPages({ pages: [broken, home], warnings: [], sourcePath: 'docs' });

		expect(index.pages.map((page) => page.file)).toEqual(['index.md']);
		expect(index.warnings).toEqual([expect.stringMatching(/^docs\/broken.md: skipped, /)]);
	});

	// An empty index would replace the working one.
	it('throws when pages were found but none could be processed, naming the last reason', () => {
		expect(() => indexPages({ pages: [broken], warnings: [], sourcePath: 'docs' })).toThrow(
			/^no page could be indexed, docs\/broken.md: skipped, /
		);
	});
});
