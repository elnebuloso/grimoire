import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { indexCheckout } from './index-source';

const URL = 'https://docs.example.com/shared/note.md';
const source = { project: 'platform', slug: 'docs', path: 'docs/', exclusions: [] };
let checkout: string;

function write(files: Record<string, string>) {
	for (const [path, content] of Object.entries(files)) {
		mkdirSync(dirname(join(checkout, path)), { recursive: true });
		writeFileSync(join(checkout, path), content);
	}
}

function pageText(index: Awaited<ReturnType<typeof indexCheckout>>) {
	return index.pages[0].chunked.snippets.map((snippet) => snippet.content).join('\n');
}

beforeEach(() => {
	checkout = mkdtempSync(join(tmpdir(), 'grimoire-index-'));
});

afterEach(() => rmSync(checkout, { recursive: true, force: true }));

describe('indexCheckout with URL includes', () => {
	it('fetches URL includes when the site config allows them, nested ones in a further round', async () => {
		const nested = 'https://docs.example.com/shared/nested.md';
		write({
			'mkdocs.yml': 'markdown_extensions:\n  - pymdownx.snippets:\n      url_download: true\n',
			'docs/index.md': `# Start\n\n--8<-- "${URL}"\n`
		});
		const fetchUrl = vi.fn(async (url: string) =>
			url === URL ? { content: `Shared note.\n\n--8<-- "${nested}"\n` } : { content: 'Nested.\n' }
		);

		const index = await indexCheckout(checkout, source, async () => {}, fetchUrl);

		expect(fetchUrl.mock.calls.map(([url]) => url)).toEqual([URL, nested]);
		expect(pageText(index)).toContain('Shared note.');
		expect(pageText(index)).toContain('Nested.');
		expect(index.warnings).toEqual([]);
	});

	it('fetches nothing without url_download and warns that URL includes are disabled', async () => {
		write({ 'mkdocs.yml': 'site_name: Docs\n', 'docs/index.md': `# Start\n\n--8<-- "${URL}"\n` });
		const fetchUrl = vi.fn();

		const index = await indexCheckout(checkout, source, async () => {}, fetchUrl);

		expect(fetchUrl).not.toHaveBeenCalled();
		expect(index.warnings).toEqual([
			`docs/index.md: include "${URL}" not inserted, URL includes are disabled (url_download in the site config)`
		]);
	});

	it('keeps the sync going when a fetch fails', async () => {
		write({
			'zensical.toml': '[project.markdown_extensions.pymdownx.snippets]\nurl_download = true\n',
			'docs/index.md': `# Start\n\nText.\n\n--8<-- "${URL}"\n`
		});

		const index = await indexCheckout(
			checkout,
			source,
			async () => {},
			async () => ({
				problem: `https://docs.example.com is not listed in INCLUDE_URL_ALLOW`
			})
		);

		expect(pageText(index)).toContain('Text.');
		expect(index.warnings).toEqual([
			`docs/index.md: include "${URL}" not fetched, https://docs.example.com is not listed in INCLUDE_URL_ALLOW`
		]);
	});
});
