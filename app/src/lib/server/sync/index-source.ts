import { readdirSync, readFileSync } from 'node:fs';
import { join, matchesGlob, posix } from 'node:path';
import type { IndexedPage, SourceIndex } from '../db/sources';
import { chunkPage } from '../parsing/chunk';
import { resolveIncludes, type IncludeResult, type UrlContent } from '../parsing/include';
import { resolveLinks } from '../parsing/links';
import { preprocessPage } from '../parsing/preprocess';
import {
	extensionSettings,
	findSiteConfig,
	navOrder,
	type SiteConfig
} from '../parsing/site-config';
import { configuredSlugify, pythonMarkdownSlugify, type Slugify } from '../parsing/slugs';

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
 * Reads every Markdown page of a source from a checkout and turns it into snippets and links.
 * Include targets outside the source path are fetched with `fetchDirectories`, and URL includes,
 * when the site config allows them, with `fetchUrl`; round by round, until nothing new turns up.
 * A page that cannot be processed is skipped with a warning.
 */
export async function indexCheckout(
	checkout: string,
	source: IndexedSource,
	fetchDirectories: FetchDirectories,
	fetchUrl: FetchUrl
): Promise<Omit<SourceIndex, 'commit'>> {
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
	let slugify: Slugify = pythonMarkdownSlugify;
	if (config) {
		const configured = configuredSlugify(config.settings);
		slugify = configured.slugify;
		if (configured.warning) warnings.push(`${config.file}: ${configured.warning}`);
	}

	const indexed: IndexedPage[] = [];
	for (const file of files) {
		const { markdown, warnings: includeWarnings } = included.get(file)!;
		warnings.push(...includeWarnings);
		try {
			const metadata = preprocessPage(markdown);
			const location = { project: source.project, source: source.slug, file };
			const chunked = chunkPage(metadata, location, slugify);
			indexed.push({ file, navPosition: navPositions.get(file), metadata, chunked });
		} catch (error) {
			warnings.push(`${posix.join(sourcePath, file)}: skipped, ${(error as Error).message}`);
		}
	}

	const linked = resolveLinks(new Map(indexed.map((page) => [page.file, page.chunked])), {
		project: source.project,
		source: source.slug
	});
	const pages = indexed.map((page) => ({ ...page, chunked: linked.pages.get(page.file)! }));
	return { pages, links: linked.links, warnings };
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
