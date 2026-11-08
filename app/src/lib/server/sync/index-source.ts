import {
	existsSync,
	lstatSync,
	readdirSync,
	readFileSync,
	readlinkSync,
	realpathSync,
	statSync
} from 'node:fs';
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
import { SyncFailure } from './failure.ts';

export interface IndexedSource {
	/** Path of the source in the repository, e.g. `docs/`. */
	path: string;
	/** Glob patterns relative to the repository root, e.g. `docs/drafts/**`. */
	exclusions: string[];
}

// Fetched content can name further URLs, round after round; without a cap a docs branch could keep
// a sync fetching forever.
export const MAX_URL_INCLUDES = 100;

// The URL fetches of one sync share this much time, well below the indexing deadline: an origin
// that hangs costs warnings on its includes, not the whole sync.
const URL_INCLUDES_DEADLINE_MS = 2 * 60_000;

/** Checks out further directories of the repository so their files can be read. */
export type FetchDirectories = (directories: string[]) => Promise<void>;

/** Fetches a file included by URL. */
export type FetchUrl = (url: string) => Promise<UrlContent>;

/**
 * Reads every Markdown page of a source from a checkout and resolves its includes, ready for
 * `indexPages`. Include targets outside the source path are fetched with `fetchDirectories`, and
 * URL includes, when the site config allows them, with `fetchUrl`; round by round, until nothing
 * new turns up, the URLs of a round at once. At most `MAX_URL_INCLUDES` URLs are fetched, all
 * within `urlDeadlineMs`; further ones are reported as not fetched.
 */
export async function prepareCheckout(
	checkout: string,
	source: IndexedSource,
	fetchDirectories: FetchDirectories,
	fetchUrl: FetchUrl,
	{ urlDeadlineMs = URL_INCLUDES_DEADLINE_MS }: { urlDeadlineMs?: number } = {}
): Promise<PreparedSource & { sourcePath: string }> {
	const sourcePath = posix.normalize(source.path || '.').replace(/\/$/, '');
	const root = realpathSync(checkout);
	const read = (path: string) => readInside(root, path);
	const warnings: string[] = [];
	const raw = new Map<string, string>();
	await fetchLinkTargets(root, sourcePath, fetchDirectories);
	const listed = listPages(checkout, sourcePath, source.exclusions);
	for (const file of listed) {
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
	// An empty index would replace the working one, also when the path holds no page at all: a
	// folder turned into a submodule or pages renamed to `.markdown` look just like that.
	if (listed.length === 0) {
		throw new SyncFailure(
			'noPage',
			`no page could be indexed, no Markdown file below the source path "${sourcePath}"`
		);
	}
	if (files.length === 0) {
		throw new SyncFailure('noPage', `no page could be indexed, ${warnings.at(-1)}`);
	}

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
	const urlDeadline = Date.now() + urlDeadlineMs;
	const lateUrl: UrlContent = {
		problem: `URL includes took longer than ${urlDeadlineMs / 1000} seconds in one sync`
	};
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
		const allowed = [...pendingUrls].slice(0, Math.max(0, MAX_URL_INCLUDES - urls.size));
		for (const url of pendingUrls) {
			if (!allowed.includes(url)) {
				urls.set(url, { problem: `more than ${MAX_URL_INCLUDES} URL includes in one sync` });
			}
		}
		const answers = await Promise.all(
			allowed.map((url) =>
				Date.now() >= urlDeadline ? lateUrl : withinDeadline(fetchUrl(url), urlDeadline, lateUrl)
			)
		);
		allowed.forEach((url, index) => urls.set(url, answers[index]));
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

/** What `fetch` answers, or `late` once `deadline` (a time in milliseconds) has passed. */
async function withinDeadline(
	fetch: Promise<UrlContent>,
	deadline: number,
	late: UrlContent
): Promise<UrlContent> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const expired = new Promise<UrlContent>((resolve) => {
		timer = setTimeout(() => resolve(late), Math.max(0, deadline - Date.now()));
	});
	try {
		return await Promise.race([fetch, expired]);
	} finally {
		clearTimeout(timer);
	}
}

/**
 * Checks out the targets of symlinks that point from the source path into the rest of the
 * repository: the sparse clone holds only the source path, so such a link points at nothing until
 * its target is there. Round by round, as a fetched directory may hold links of its own.
 */
async function fetchLinkTargets(
	root: string,
	sourcePath: string,
	fetchDirectories: FetchDirectories
) {
	if (sourcePath === '.') return;
	const fetched = new Set<string>();
	let pending = [sourcePath];
	while (pending.length > 0) {
		const missing = new Set(
			pending.flatMap((path) => missingLinkTargets(root, path)).filter((dir) => !fetched.has(dir))
		);
		if (missing.size > 0) await fetchDirectories([...missing]);
		missing.forEach((directory) => fetched.add(directory));
		pending = [...missing];
	}
}

/** The directories to check out for the links at or below `path` whose targets are not there. */
function missingLinkTargets(root: string, path: string): string[] {
	const full = join(root, path);
	let stats;
	try {
		stats = lstatSync(full);
	} catch {
		return [];
	}
	if (stats.isSymbolicLink()) {
		const target = readlinkSync(full);
		// An absolute target, or one above the root, lies outside the repository: never fetched.
		if (isAbsolute(target)) return [];
		const resolved = posix.normalize(posix.join(posix.dirname(path), target));
		if (resolved.startsWith('..') || existsSync(join(root, resolved))) return [];
		return [resolved.endsWith('.md') ? posix.dirname(resolved) : resolved];
	}
	if (!stats.isDirectory()) return [];
	return readdirSync(full)
		.filter((name) => name !== '.git')
		.flatMap((name) => missingLinkTargets(root, posix.join(path, name)));
}

/** Markdown files below the source path, relative to it, without excluded ones. */
function listPages(checkout: string, sourcePath: string, exclusions: string[]): string[] {
	const root = realpathSync(checkout);
	const start = realInside(root, join(root, sourcePath));
	if (start === undefined || !statSync(start).isDirectory()) {
		throw new SyncFailure('path', `source path "${sourcePath}" does not exist in the repository`);
	}
	// Each page with its path below the source and its real path in the repository.
	const files: { path: string; real: string }[] = [];
	// A symlinked directory is followed only inside the checkout, and every directory once: a docs
	// branch could otherwise link to `/` and list the server, or link twice to its own parent and
	// keep the walk going until the deadline. Real directories are walked first, so a directory is
	// listed under its real path however a link to it is named.
	const visited = new Set([start]);
	const linked: { real: string; path: string }[] = [];
	const walk = (directory: string, prefix: string) => {
		const entries = readdirSync(directory, { withFileTypes: true }).toSorted((a, b) =>
			a.name < b.name ? -1 : a.name > b.name ? 1 : 0
		);
		for (const entry of entries) {
			if (entry.name === '.git') continue;
			const path = prefix ? `${prefix}/${entry.name}` : entry.name;
			const full = join(directory, entry.name);
			if (entry.isDirectory()) {
				// Reached once already when a link led into the directory around it first.
				if (visited.has(full)) continue;
				visited.add(full);
				walk(full, path);
				continue;
			}
			const real = entry.isSymbolicLink() ? realInside(root, full) : full;
			if (real !== undefined && entry.isSymbolicLink() && statSync(real).isDirectory()) {
				linked.push({ real, path });
			} else if (entry.name.endsWith('.md')) {
				// A file linking outside is listed still: reading it refuses it with a warning.
				files.push({ path, real: relative(root, real ?? full) });
			}
		}
	};
	walk(start, '');
	for (const { real, path } of linked) {
		if (visited.has(real)) continue;
		visited.add(real);
		walk(real, path);
	}
	// Excluded by where it is listed or where it really lies: a link must not bring an excluded
	// directory back.
	const excluded = (file: string) => exclusions.some((pattern) => matchesGlob(file, pattern));
	return files
		.filter((file) => !excluded(posix.join(sourcePath, file.path)) && !excluded(file.real))
		.map((file) => file.path)
		.sort();
}

/** The real path of `path` when it lies inside `root`, symlinks resolved; else undefined. */
function realInside(root: string, path: string): string | undefined {
	try {
		const real = realpathSync(path);
		const inside = relative(root, real);
		return inside.startsWith('..') || isAbsolute(inside) ? undefined : real;
	} catch {
		return undefined;
	}
}

// Anyone who can push to a docs branch could commit a symlink to `/proc/self/environ` or the
// database; its content would become a snippet every API key holder can read. So a file counts
// only where it really lies inside the checkout, symlinks within the repository included.
function readInside(root: string, path: string): string | undefined {
	const real = realInside(root, join(root, path));
	if (real === undefined) return undefined;
	try {
		return readFileSync(real, 'utf8');
	} catch {
		return undefined;
	}
}
