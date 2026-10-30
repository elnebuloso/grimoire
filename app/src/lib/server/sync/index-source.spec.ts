import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { indexPages } from './index-pages';
import { prepareCheckout, type FetchUrl } from './index-source';

const URL = 'https://docs.example.com/shared/note.md';
const source = { path: 'docs/', exclusions: [] };
let checkout: string;

function write(files: Record<string, string>) {
	for (const [path, content] of Object.entries(files)) {
		mkdirSync(dirname(join(checkout, path)), { recursive: true });
		writeFileSync(join(checkout, path), content);
	}
}

async function indexCheckout(fetchUrl: FetchUrl) {
	const prepared = await prepareCheckout(checkout, source, async () => {}, fetchUrl);
	return indexPages(prepared);
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

		const index = await indexCheckout(fetchUrl);

		expect(fetchUrl.mock.calls.map(([url]) => url)).toEqual([URL, nested]);
		expect(pageText(index)).toContain('Shared note.');
		expect(pageText(index)).toContain('Nested.');
		expect(index.warnings).toEqual([]);
	});

	it('fetches nothing without url_download and warns that URL includes are disabled', async () => {
		write({ 'mkdocs.yml': 'site_name: Docs\n', 'docs/index.md': `# Start\n\n--8<-- "${URL}"\n` });
		const fetchUrl = vi.fn();

		const index = await indexCheckout(fetchUrl);

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

		const index = await indexCheckout(async () => ({
			problem: `https://docs.example.com is not listed in INCLUDE_URL_ALLOW`
		}));

		expect(pageText(index)).toContain('Text.');
		expect(index.warnings).toEqual([
			`docs/index.md: include "${URL}" not fetched, https://docs.example.com is not listed in INCLUDE_URL_ALLOW`
		]);
	});
});

describe('indexCheckout with "#" in a file name', () => {
	it('skips the page, whose ID would name another page, and says so', async () => {
		write({ 'docs/faq.md': '# FAQ\n', 'docs/faq#2.md': '# FAQ 2\n' });

		const index = await indexCheckout(async () => ({ content: '' }));

		expect(index.pages.map((page) => page.file)).toEqual(['faq.md']);
		expect(index.warnings).toEqual(['docs/faq#2.md: "#" in the file name, skipped']);
	});
});

describe('indexCheckout with symlinks', () => {
	let outside: string;

	beforeEach(() => {
		outside = mkdtempSync(join(tmpdir(), 'grimoire-outside-'));
		writeFileSync(join(outside, 'secret.md'), 'TOKEN_ENCRYPTION_KEY=secret\n');
	});

	afterEach(() => rmSync(outside, { recursive: true, force: true }));

	const noUrls: FetchUrl = async () => ({ content: '' });

	it('skips a page that links outside the checkout', async () => {
		write({ 'docs/index.md': '# Start\n' });
		symlinkSync(join(outside, 'secret.md'), join(checkout, 'docs/secrets.md'));

		const index = await indexCheckout(noUrls);

		expect(index.pages.map((page) => page.file)).toEqual(['index.md']);
		expect(index.warnings).toEqual([
			'docs/secrets.md: not readable inside the repository, skipped'
		]);
	});

	it('treats an include that links outside the checkout as missing', async () => {
		write({ 'docs/index.md': '# Start\n\n--8<-- "docs/db.md"\n' });
		symlinkSync(join(outside, 'secret.md'), join(checkout, 'docs/db.md'));

		const index = await indexCheckout(noUrls);

		expect(index.pages.map((page) => page.file)).toEqual(['index.md']);
		expect(pageText(index)).not.toContain('TOKEN_ENCRYPTION_KEY');
		expect(index.warnings).toContain('docs/index.md: include "docs/db.md" not found');
	});

	it('follows a symlink that stays inside the checkout', async () => {
		write({
			'shared/note.md': 'Shared note.\n',
			'docs/index.md': '# Start\n\n--8<-- "docs/note.md"\n'
		});
		symlinkSync(join(checkout, 'shared/note.md'), join(checkout, 'docs/note.md'));

		const index = await indexCheckout(noUrls);

		expect(pageText(index)).toContain('Shared note.');
		expect(index.warnings).toEqual([]);
	});
});
