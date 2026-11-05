import { matchesGlob } from 'node:path';

/** What decides whether two sources hold the same documentation; the branch does not. */
export interface SourceLocation {
	gitUrl: string;
	path: string;
	exclusions: string[];
}

/** `duplicate`: the same repository and path. `overlap`: one path lies inside the other. */
export type Overlap = 'duplicate' | 'overlap';

/**
 * The repository a Git URL names, written one way: host and path in lower case, without the
 * default port, a trailing `.git` or trailing slashes. Git hosts treat the path without case.
 */
export function repositoryKey(gitUrl: string): string {
	let url: URL;
	try {
		url = new URL(gitUrl.trim());
	} catch {
		return gitUrl.trim().toLowerCase();
	}
	// `URL` lowers the host and drops the default port of the protocol itself.
	const path = url.pathname
		.toLowerCase()
		.replace(/\/+$/, '')
		.replace(/\.git$/, '')
		.replace(/\/+$/, '');
	return `${url.host}${path}`;
}

/** A directory of the repository written one way; the empty string is the whole repository. */
export function directoryKey(path: string): string {
	return path
		.trim()
		.split('/')
		.filter((part) => part !== '' && part !== '.')
		.join('/');
}

/** Whether `a` and `b` index the same pages, or some of them; undefined when they do not. */
export function compareSources(a: SourceLocation, b: SourceLocation): Overlap | undefined {
	if (repositoryKey(a.gitUrl) !== repositoryKey(b.gitUrl)) return undefined;
	const pathA = directoryKey(a.path);
	const pathB = directoryKey(b.path);
	if (pathA === pathB) return 'duplicate';
	if (contains(pathA, pathB)) return excludes(a.exclusions, pathB) ? undefined : 'overlap';
	if (contains(pathB, pathA)) return excludes(b.exclusions, pathA) ? undefined : 'overlap';
	return undefined;
}

/** Every pair of `sources` that are duplicates or overlap, in the order of the list. */
export function findOverlaps<Source extends SourceLocation>(
	sources: Source[]
): { kind: Overlap; first: Source; second: Source }[] {
	return sources.flatMap((first, index) =>
		sources.slice(index + 1).flatMap((second) => {
			const kind = compareSources(first, second);
			return kind ? [{ kind, first, second }] : [];
		})
	);
}

function contains(outer: string, inner: string): boolean {
	return outer === '' || inner.startsWith(`${outer}/`);
}

// An exclusion is a glob over the repository path of each file, not a directory. It covers the
// directory when it matches a page right inside it and one nested deeper, as `docs/api/**` does
// and `docs/api/*.md` does not.
function excludes(exclusions: string[], directory: string): boolean {
	const pages = [`${directory}/page.md`, `${directory}/section/page.md`];
	return exclusions.some((pattern) => pages.every((page) => matchesGlob(page, pattern)));
}
