import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { indexPages } from './index-pages';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { MAX_URL_INCLUDES, prepareCheckout, type FetchUrl } from './index-source';
import { fetchInclude } from './url-include';

const URL = 'https://docs.example.com/shared/note.md';
const source = { path: 'docs/', exclusions: [] };
let checkout: string;

function write(files: Record<string, string>) {
	for (const [path, content] of Object.entries(files)) {
		mkdirSync(dirname(join(checkout, path)), { recursive: true });
		writeFileSync(join(checkout, path), content);
	}
}

async function indexCheckout(fetchUrl: FetchUrl, urlDeadlineMs?: number) {
	const prepared = await prepareCheckout(checkout, source, async () => {}, fetchUrl, {
		urlDeadlineMs
	});
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

	it('stops fetching after the cap when fetched content keeps naming new URLs', async () => {
		write({
			'mkdocs.yml': 'markdown_extensions:\n  - pymdownx.snippets:\n      url_download: true\n',
			'docs/index.md': `# Start\n\n--8<-- "${URL}?0"\n`
		});
		const fetchUrl = vi.fn(async (url: string) => {
			const next = Number(url.split('?')[1]) + 1;
			return { content: `Part ${next}.\n\n--8<-- "${URL}?${next}"\n` };
		});

		const index = await indexCheckout(fetchUrl);

		expect(fetchUrl).toHaveBeenCalledTimes(MAX_URL_INCLUDES);
		expect(index.warnings).toEqual([
			`docs/index.md: include "${URL}?${MAX_URL_INCLUDES}" not fetched, more than ${MAX_URL_INCLUDES} URL includes in one sync`
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

describe('indexCheckout with an origin that does not answer', () => {
	let server: Server;
	let origin: string;

	beforeEach(async () => {
		// Takes every request and never answers it.
		server = createServer(() => {});
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
		origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
	});

	afterEach(() => {
		server.closeAllConnections();
		server.close();
	});

	it('waits for its includes once, not once per include, and warns on each', async () => {
		const includes = Array.from(
			{ length: 10 },
			(_, index) => `--8<-- "${origin}/part-${index}.md"`
		);
		write({
			'mkdocs.yml': 'markdown_extensions:\n  - pymdownx.snippets:\n      url_download: true\n',
			'docs/index.md': `# Start\n\nText.\n\n${includes.join('\n\n')}\n`
		});
		const timeoutMs = 300;
		const started = performance.now();

		const index = await indexCheckout((url) =>
			fetchInclude(url, [origin], { timeoutMs, maxBytes: 1024 })
		);

		// One after the other they would take ten times as long.
		expect(performance.now() - started).toBeLessThan(5 * timeoutMs);
		expect(pageText(index)).toContain('Text.');
		expect(index.warnings).toHaveLength(10);
		expect(index.warnings[0]).toContain('no answer within 0.3 seconds');
	});

	it('gives the includes of all rounds one deadline, then warns instead of fetching', async () => {
		write({
			'mkdocs.yml': 'markdown_extensions:\n  - pymdownx.snippets:\n      url_download: true\n',
			'docs/index.md': `# Start\n\n--8<-- "${URL}?0"\n`
		});
		// Each answer names the next URL, a little later each time.
		const fetchUrl = vi.fn(async (url: string) => {
			await new Promise((resolve) => setTimeout(resolve, 100));
			const next = Number(url.split('?')[1]) + 1;
			return { content: `Part ${next}.\n\n--8<-- "${URL}?${next}"\n` };
		});

		const index = await indexCheckout(fetchUrl, 350);

		expect(fetchUrl.mock.calls.length).toBeLessThan(6);
		expect(index.warnings).toEqual([
			expect.stringContaining('not fetched, URL includes took longer than 0.35 seconds in one sync')
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

	// An empty index would replace the working one.
	it('throws when every page found is skipped, naming the last reason', async () => {
		write({ 'docs/faq#2.md': '# FAQ 2\n' });

		await expect(indexCheckout(async () => ({ content: '' }))).rejects.toThrow(
			'no page could be indexed, docs/faq#2.md: "#" in the file name, skipped'
		);
	});
});

describe('indexCheckout with symlinks', () => {
	let outside: string;

	beforeEach(() => {
		outside = mkdtempSync(join(tmpdir(), 'grimoire-outside-'));
		writeFileSync(join(outside, 'secret.md'), 'ENCRYPTION_KEY=secret\n');
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
		expect(pageText(index)).not.toContain('ENCRYPTION_KEY');
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

describe('indexCheckout with a site config at the repository root', () => {
	it('gives each page its position in the nav', async () => {
		write({
			'mkdocs.yml': 'docs_dir: docs\nnav:\n  - Deploy: deploy.md\n  - Home: index.md\n',
			'docs/index.md': '# Home\n',
			'docs/deploy.md': '# Deploy\n'
		});

		const index = await indexCheckout(vi.fn());

		expect(index.pages.map((page) => [page.file, page.navPosition]).sort()).toEqual([
			['deploy.md', 0],
			['index.md', 1]
		]);
	});

	it('builds heading IDs with the slug function of the site config', async () => {
		write({
			'mkdocs.yml':
				'markdown_extensions:\n  - toc:\n      slugify: !!python/object/apply:pymdownx.slugs.slugify\n        kwds:\n          case: lower\n',
			'docs/index.md': '# Home\n\n## Größe & Gewicht\n\nText.\n'
		});

		const index = await indexCheckout(vi.fn());

		// The short section is merged into the overview, which keeps its ID as an alias.
		expect(index.pages[0].chunked.snippets.map((snippet) => snippet.aliases)).toEqual([
			['größe--gewicht']
		]);
	});
});
