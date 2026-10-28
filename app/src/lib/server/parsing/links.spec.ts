import { describe, it, expect } from 'vitest';
import { chunkPage } from './chunk';
import { resolveLinks } from './links';

const location = { project: 'platform', source: 'auth-service' };

/** A paragraph of roughly the given number of tokens, so sections are not merged. */
function text(tokens: number): string {
	return 'word '.repeat(Math.ceil((tokens * 4) / 5)).trim();
}

function resolve(files: Record<string, string>) {
	const pages = new Map(
		Object.entries(files).map(([file, markdown]) => [
			file,
			chunkPage({ tags: [], markdown }, { ...location, file })
		])
	);
	return resolveLinks(pages, location);
}

function contentOf(result: ReturnType<typeof resolve>, file: string, anchor?: string): string {
	return result.pages.get(file)!.snippets.find((s) => s.anchor === anchor)!.content;
}

const deployPage = `# Deploy\n\n## Rollback\n\n${text(100)}\n\n## Config\n\n${text(100)}\n\n### Port\n\nSmall.\n`;

describe('resolveLinks', () => {
	it('rewrites a relative link to the grimoire ID and records it', () => {
		const result = resolve({
			'deploy.md': deployPage,
			'index.md': `# Home\n\nSee [rollback](deploy.md#rollback).\n`
		});
		expect(contentOf(result, 'index.md')).toBe(
			'See [rollback](platform/auth-service/deploy#rollback).\n'
		);
		expect(result.links).toEqual([
			{
				file: 'index.md',
				anchor: undefined,
				target: 'platform/auth-service/deploy#rollback',
				dead: false
			}
		]);
	});

	it('rewrites a same-page anchor to the full ID', () => {
		const result = resolve({
			'deploy.md': `${deployPage}\n## Notes\n\n[back](#rollback) ${text(60)}\n`
		});
		expect(contentOf(result, 'deploy.md', 'notes')).toContain(
			'[back](platform/auth-service/deploy#rollback)'
		);
	});

	it('resolves paths relative to the linking page and percent-encoded names', () => {
		const result = resolve({
			'deploy.md': deployPage,
			'guide/first steps.md': '# First steps\n',
			'guide/setup.md': '# Setup\n\n[deploy](../deploy.md) and [steps](first%20steps.md)\n'
		});
		expect(contentOf(result, 'guide/setup.md')).toBe(
			'[deploy](platform/auth-service/deploy) and [steps](<platform/auth-service/guide/first steps>)\n'
		);
		expect(result.links.every((link) => !link.dead)).toBe(true);
	});

	it('accepts anchors of merged subsections and of the title', () => {
		const result = resolve({
			'deploy.md': deployPage,
			'index.md': '# Home\n\n[port](deploy.md#port) [top](deploy.md#deploy)\n'
		});
		expect(contentOf(result, 'index.md')).toBe(
			'[port](platform/auth-service/deploy#port) [top](platform/auth-service/deploy)\n'
		);
		expect(result.links.map((link) => link.dead)).toEqual([false, false]);
	});

	it('records missing files, missing anchors and paths leaving the source as dead, text unchanged', () => {
		const source = '# Home\n\n[a](missing.md#x) [b](deploy.md#nope) [c](../other/page.md)\n';
		const result = resolve({ 'deploy.md': deployPage, 'index.md': source });
		expect(contentOf(result, 'index.md')).toBe(
			'[a](missing.md#x) [b](deploy.md#nope) [c](../other/page.md)\n'
		);
		expect(result.links.map(({ target, dead }) => [target, dead])).toEqual([
			['platform/auth-service/missing#x', true],
			['platform/auth-service/deploy#nope', true],
			['../other/page.md', true]
		]);
	});

	it('leaves external links, absolute paths and non-Markdown files alone', () => {
		const source =
			'# Home\n\n[a](https://example.com/x.md) [b](mailto:ops@example.com) [c](/deploy.md) [d](files/runbook.pdf)\n';
		const result = resolve({ 'deploy.md': deployPage, 'index.md': source });
		expect(contentOf(result, 'index.md')).toBe(source.replace('# Home\n\n', ''));
		expect(result.links).toEqual([]);
	});

	it('rewrites reference-style definitions', () => {
		const result = resolve({
			'deploy.md': deployPage,
			'index.md': '# Home\n\nSee [rollback][rb].\n\n[rb]: deploy.md#rollback\n'
		});
		expect(contentOf(result, 'index.md')).toContain('[rb]: platform/auth-service/deploy#rollback');
	});

	it('records the anchor of the snippet holding the link once per target', () => {
		const result = resolve({
			'deploy.md': `${deployPage}\n## Notes\n\n[a](#rollback) [b](#rollback) ${text(60)}\n`
		});
		expect(result.links).toEqual([
			{
				file: 'deploy.md',
				anchor: 'notes',
				target: 'platform/auth-service/deploy#rollback',
				dead: false
			}
		]);
	});

	it('recounts tokens of a rewritten snippet', () => {
		const result = resolve({ 'deploy.md': deployPage, 'index.md': '# Home\n\n[x](deploy.md)\n' });
		const snippet = result.pages.get('index.md')!.snippets[0];
		expect(snippet.tokens).toBe(Math.ceil(snippet.content.length / 4));
	});

	it('records a reference-style link under the snippet using it, not where it is defined', () => {
		const result = resolve({
			'deploy.md': `${deployPage}\n## Notes\n\nSee [rollback][rb]. ${text(60)}\n\n## Other\n\n${text(60)}\n\n[rb]: #rollback\n`
		});
		expect(result.links.map((link) => link.anchor)).toEqual(['notes']);
	});
});
