import { readdirSync, readFileSync } from 'node:fs';
import { join, matchesGlob, posix } from 'node:path';
import { resolveIncludes, type IncludeResult, type UrlContent } from '../parsing/include';
import {
	extensionSettings,
	findSiteConfig,
	navOrder,
	type SiteConfig
} from '../parsing/site-config';
import type { PreparedSource } from './index-pages';

export interface IndexedSource {
	project: string;
	slug: string;
	/** Path of the source in the repository, e.g. `docs/`. */
	path: string;
	/** Glob patterns relative to the repository root, e.g. `docs/drafts/**`. */
	exclusions: string[];
}

/** Checks out further directories of the repository so their files can be read. */
export type FetchDirectories = (directories: string[]) => Promise<void>;

/** Fetches a file included by URL. */
export type FetchUrl = (url: string) => Promise<UrlContent>;

/**
 * Reads every Markdown page of a source from a checkout and resolves its includes, ready for
 * `indexPages`. Include targets outside the source path are fetched with `fetchDirectories`, and
 * URL includes, when the site config allows them, with `fetchUrl`; round by round, until nothing
 * new turns up.
 */
export async function prepareCheckout(
	checkout: string,
	source: IndexedSource,
	fetchDirectories: FetchDirectories,
	fetchUrl: FetchUrl
): Promise<PreparedSource & { sourcePath: string }> {
	const sourcePath = posix.normalize(source.path || '.').replace(/\/$/, '');
	const files = listPages(checkout, sourcePath, source.exclusions);
	const read = (path: string) => readFile(join(checkout, path));
	const raw = new Map(files.map((file) => [file, read(posix.join(sourcePath, file)) ?? '']));

	const warnings: string[] = [];
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
		for (const url of pendingUrls) urls.set(url, await fetchUrl(url));
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

function readFile(path: string): string | undefined {
	try {
		return readFileSync(path, 'utf8');
	} catch {
		return undefined;
	}
}
