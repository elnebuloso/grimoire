import { describe, it, expect } from 'vitest';
import { chunkPage, estimateTokens } from './chunk';
import type { PreprocessedPage } from './preprocess';

/** A paragraph of roughly the given number of tokens. */
function text(tokens: number): string {
	return 'word '.repeat(Math.ceil((tokens * 4) / 5)).trim();
}

function chunk(markdown: string, metadata: Partial<PreprocessedPage> = {}) {
	return chunkPage({ tags: [], markdown, ...metadata }, 'deploy.md');
}

describe('chunkPage', () => {
	it('turns every heading into a snippet with title path, file and anchor', () => {
		const page = chunk(
			`# Auth-Service\n\n## Deployment\n\n${text(100)}\n\n## Rollback\n\n${text(100)}\n\n## Bekannte Probleme\n\n${text(100)}\n`
		);
		expect(page.title).toBe('Auth-Service');
		expect(page.snippets.map((s) => [s.anchor, s.titlePath.join(' › '), s.file])).toEqual([
			['deployment', 'Auth-Service › Deployment', 'deploy.md'],
			['rollback', 'Auth-Service › Rollback', 'deploy.md'],
			['bekannte-probleme', 'Auth-Service › Bekannte Probleme', 'deploy.md']
		]);
	});

	it('keeps ancestor headings in the title path and leaves the heading out of the content', () => {
		const page = chunk(`# Guide\n\n## Deployment\n\n### Rollback\n\n${text(100)}\n`);
		expect(page.snippets).toHaveLength(1);
		expect(page.snippets[0].titlePath).toEqual(['Guide', 'Deployment', 'Rollback']);
		expect(page.snippets[0].content).toBe(`${text(100)}\n`);
	});

	describe('overview', () => {
		it('makes text before the first ## the overview snippet and the description', () => {
			const page = chunk(`# Guide\n\n${text(60)}\n\n## Next\n\n${text(60)}\n`);
			expect(page.snippets[0]).toMatchObject({
				anchor: undefined,
				titlePath: ['Guide', 'Overview']
			});
			expect(page.description).toBe(text(60));
		});

		it('prefers the frontmatter title and description', () => {
			const page = chunk(`# Heading\n\n${text(60)}\n`, {
				title: 'Front',
				description: 'From frontmatter'
			});
			expect(page.title).toBe('Front');
			expect(page.description).toBe('From frontmatter');
		});

		it('falls back to the file name without a title or H1', () => {
			const page = chunk(`${text(60)}\n`);
			expect(page.title).toBe('deploy');
		});
	});

	describe('small sections', () => {
		it('merges small subsections into their parent and keeps their anchors as aliases', () => {
			const page = chunk(
				`# Service\n\n## Konfiguration\n\n${text(40)}\n\n### Port\n\nDefault 8080.\n\n### Timeout\n\nDefault 30s.\n`
			);
			expect(page.snippets).toHaveLength(1);
			expect(page.snippets[0]).toMatchObject({
				anchor: 'konfiguration',
				aliases: ['port', 'timeout'],
				content: `${text(40)}\n\n### Port\n\nDefault 8080.\n\n### Timeout\n\nDefault 30s.\n`
			});
		});

		it('keeps a subsection of 50 tokens or more on its own', () => {
			const page = chunk(`# Service\n\n## Parent\n\n${text(60)}\n\n### Child\n\n${text(60)}\n`);
			expect(page.snippets.map((s) => s.anchor)).toEqual(['parent', 'child']);
		});
	});

	describe('large sections', () => {
		it('splits at paragraph boundaries and numbers the parts', () => {
			const page = chunk(`# Guide\n\n## Long\n\n${text(500)}\n\n${text(500)}\n`);
			expect(page.snippets.map((s) => [s.titlePath.at(-1), s.part, s.parts])).toEqual([
				['Long', 1, 2],
				['Long', 2, 2]
			]);
			expect(page.snippets.every((s) => s.anchor === 'long')).toBe(true);
			expect(page.snippets.every((s) => s.tokens <= 800)).toBe(true);
		});

		it('keeps an oversized code block whole', () => {
			const code = '```sh\n' + 'echo line\n'.repeat(400) + '```';
			const page = chunk(`# Guide\n\n## Script\n\n${text(100)}\n\n${code}\n`);
			expect(page.snippets).toHaveLength(2);
			expect(page.snippets[1].content).toBe(`${code}\n`);
		});

		it('never cuts a list', () => {
			const list = Array.from({ length: 300 }, (_, i) => `- item ${i} ${text(3)}`).join('\n');
			const page = chunk(`# Guide\n\n## Items\n\n${list}\n`);
			expect(page.snippets).toHaveLength(1);
			expect(page.snippets[0].content).toBe(`${list}\n`);
		});
	});

	it('estimates tokens as characters / 4', () => {
		expect(estimateTokens('12345678')).toBe(2);
		expect(estimateTokens('123456789')).toBe(3);
	});

	it('generates the anchors MkDocs generates', () => {
		const headings = [
			'# Auth-Service',
			'## Deployment',
			'## Rollback',
			'## Bekannte Probleme',
			'## Überblick & Ärger',
			'## The `make rollback` command',
			'## Rollback',
			'## Rollback',
			"## What's new? (v2.0)",
			'## 🚀 Release',
			'## 🚀',
			'## 🚀',
			'## Custom title {#custom-id}',
			'## Snake_case and--dashes',
			'## Straße über Café',
			'## [Linked](other.md) *heading*',
			'## Rollback_1'
		];
		const page = chunk(headings.map((heading) => `${heading}\n\n${text(60)}`).join('\n\n'));

		// Produced by Python-Markdown 3.11 with the `toc` and `attr_list` extensions for the
		// same headings; the H1 id `auth-service` is not a snippet anchor.
		expect(page.snippets.map((s) => s.anchor)).toEqual([
			undefined,
			'deployment',
			'rollback',
			'bekannte-probleme',
			'uberblick-arger',
			'the-make-rollback-command',
			'rollback_1',
			'rollback_2',
			'whats-new-v20',
			'release',
			'_1',
			'_2',
			'custom-id',
			'snake_case-and-dashes',
			'strae-uber-cafe',
			'linked-heading',
			'rollback_3'
		]);
		expect(page.snippets[12].titlePath.at(-1)).toBe('Custom title');
	});

	it('moves link definitions into every snippet that references them', () => {
		const page = chunk(
			`# Page\n\n## A\n\nSee [docs][rb] and [again][RB]. ${text(80)}\n\n## B\n\n${text(80)}\n\n## C\n\n[docs][rb] ${text(80)}\n\n[rb]: https://example.com/docs\n[unused]: https://example.com/unused\n`
		);
		const definitionsOf = (anchor: string) =>
			page.snippets
				.find((s) => s.anchor === anchor)!
				.content.split('\n')
				.filter((line) => /^\[[^\]]+\]: /.test(line));
		expect(definitionsOf('a')).toEqual(['[rb]: https://example.com/docs']);
		expect(definitionsOf('b')).toEqual([]);
		expect(definitionsOf('c')).toEqual(['[rb]: https://example.com/docs']);
	});
});
