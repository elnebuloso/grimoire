import { readdirSync, readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, join, matchesGlob, posix, relative } from 'node:path';
import { resolveIncludes, type IncludeResult, type UrlContent } from '../parsing/include.ts';
import { hasGrimoireId } from '../grimoire-id.ts';
import {
	extensionSettings,
	findSiteConfig,
	navOrder,
	type SiteConfig
} from '../parsing/site-config.ts';
import type { PreparedSource } from './index-pages.ts';

export interface IndexedSource {
	/** Path of the source in the repository, e.g. `docs/`. */
	path: string;
	/** Glob patterns relative to the repository root, e.g. `docs/drafts/**`. */
	exclusions: string[];
}

// Fetched content can name further URLs, round after round; without a cap a docs branch could keep
// a sync fetching forever.
export const MAX_URL_INCLUDES = 100;

/** Checks out further directories of the repository so their files can be read. */
export type FetchDirectories = (directories: string[]) => Promise<void>;

/** Fetches a file included by URL. */
export type FetchUrl = (url: string) => Promise<UrlContent>;

/**
 * Reads every Markdown page of a source from a checkout and resolves its includes, ready for
 * `indexPages`. Include targets outside the source path are fetched with `fetchDirectories`, and
 * URL includes, when the site config allows them, with `fetchUrl`; round by round, until nothing
 * new turns up. At most `MAX_URL_INCLUDES` URLs are fetched; further ones are reported as not
 * fetched.
 */
export async function prepareCheckout(
	checkout: string,
	source: IndexedSource,
	fetchDirectories: FetchDirectories,
	fetchUrl: FetchUrl
): Promise<PreparedSource & { sourcePath: string }> {
	const sourcePath = posix.normalize(source.path || '.').replace(/\/$/, '');
	const root = realpathSync(checkout);
	const read = (path: string) => readInside(root, path);
	const warnings: string[] = [];
	const raw = new Map<string, string>();
	for (const file of listPages(checkout, sourcePath, source.exclusions)) {
		if (!hasGrimoireId(file)) {
			warnings.push(`${posix.join(sourcePath, file)}: "#" in the file name, skipped`);
			continue;
		}
		const content = read(posix.join(sourcePath, file));
		if (content === undefined)
			warnings.push(`${posix.join(sourcePath, file)}: not readable inside the repository, skipped`);
		else raw.set(file, content);
	}
	const files = [...raw.keys()];

	let config: SiteConfig | undefined;
	try {
		config = findSiteConfig(sourcePath, read);
	} catch (error) {
		warnings.push(`site config ignored, ${(error as Error).message}`);
	}
	const urls = new Map<string, UrlContent>();
	const readUrl =
		config && extensionSettings(config.settings, 'pymdownx.snippets').url_download === true
			? (url: string) => urls.get(url)
			: undefined;

	const fetched = new Set<string>();
	let included: Map<string, IncludeResult>;
	for (;;) {
		included = new Map(
			files.map((file) => [
				file,
				resolveIncludes(
					raw.get(file)!,
					{ path: posix.join(sourcePath, file), sourcePath },
					read,
					readUrl
				)
			])
		);
		const results = [...included.values()];
		const missing = new Set(
			results
				.flatMap((result) => result.outsideSourcePath)
				.map((target) => posix.dirname(target))
				.filter((directory) => directory !== '.' && !fetched.has(directory))
		);
		const pendingUrls = new Set(results.flatMap((result) => result.pendingUrls));
		if (missing.size === 0 && pendingUrls.size === 0) break;
		if (missing.size > 0) await fetchDirectories([...missing]);
		missing.forEach((directory) => fetched.add(directory));
		for (const url of pendingUrls) {
			urls.set(
				url,
				urls.size < MAX_URL_INCLUDES
					? await fetchUrl(url)
					: { problem: `more than ${MAX_URL_INCLUDES} URL includes in one sync` }
			);
		}
	}

	const navPositions = new Map<string, number>();
	if (config) navOrder(config, sourcePath)?.forEach((file, index) => navPositions.set(file, index));
	const pages = files.map((file) => ({
		file,
		markdown: included.get(file)!.markdown,
		navPosition: navPositions.get(file),
		includeWarnings: included.get(file)!.warnings
	}));
	return { pages, siteConfig: config, warnings, sourcePath };
}

/** Markdown files below the source path, relative to it, without excluded ones. */
function listPages(checkout: string, sourcePath: string, exclusions: string[]): string[] {
	let entries: string[];
	try {
		entries = readdirSync(join(checkout, sourcePath), { recursive: true }) as string[];
	} catch {
		throw new Error(`source path "${sourcePath}" does not exist in the repository`);
	}
	return entries
		.filter((file) => file.endsWith('.md') && !file.split('/').includes('.git'))
		.filter((file) => {
			const repoPath = posix.join(sourcePath, file);
			return !exclusions.some((pattern) => matchesGlob(repoPath, pattern));
		})
		.sort();
}

// Anyone who can push to a docs branch could commit a symlink to `/proc/self/environ` or the
// database; its content would become a snippet every API key holder can read. So a file counts
// only where it really lies inside the checkout, symlinks within the repository included.
function readInside(root: string, path: string): string | undefined {
	try {
		const real = realpathSync(join(root, path));
		const inside = relative(root, real);
		if (inside.startsWith('..') || isAbsolute(inside)) return undefined;
		return readFileSync(real, 'utf8');
	} catch {
		return undefined;
	}
}
