import { posix } from 'node:path';

export interface IncludePage {
	/** Path of the page relative to the repository root, e.g. `docs/deploy.md`. */
	path: string;
	/** Path of the source relative to the repository root, e.g. `docs/`. */
	sourcePath: string;
}

export interface IncludeResult {
	markdown: string;
	warnings: string[];
	/** Include targets outside the source path, found or not, relative to the repository root. */
	outsideSourcePath: string[];
	/** URL includes `readUrl` had nothing for yet; fetch them and resolve again. */
	pendingUrls: string[];
}

/** Returns the content of a file relative to the repository root, or undefined if it does not exist. */
export type ReadFile = (path: string) => string | undefined;

/** A fetched URL include: its content, or why there is none. */
export type UrlContent = { content: string } | { problem: string };

/** Returns what was fetched for a URL include; undefined while it has not been fetched yet. */
export type ReadUrl = (url: string) => UrlContent | undefined;

const URL_TARGET = /^https?:\/\//i;

// Same notation as pymdownx.snippets: dashes of any length, nothing after the marker.
const SINGLE_LINE = /^([ \t]*)(;*)-+8<-+[ \t]+("(?:\\"|[^"\r\n])+?"|'(?:\\'|[^'\r\n])+?')\r?$/;
const BLOCK_MARKER = /^([ \t]*)(;*)-+8<-+\r?$/;
// After the file name: line ranges such as `:4:6,-2:`, or `:name` for a section.
const SELECTION =
	/^(.*?)(?:((?::-?[0-9]*){1,2}(?:(?:,(?=[-0-9:])-?[0-9]*)(?::-?[0-9]*)?)*)|:([a-z][-_0-9a-z]*))?$/i;
// `--8<-- [start:name]` anywhere on a line, so it may sit inside a code comment.
const SECTION_MARKER =
	/^(.*?)(;*)(-+8<-+[ \t]+)(\[[ \t]*(start|end)[ \t]*:[ \t]*([a-z][-_0-9a-z]*)[ \t]*\])(.*)$/i;

/**
 * Replaces pymdownx.snippets includes (`--8<-- "file.md"` and the block format) with the content
 * of the included files, resolved from the repository root like MkDocs with the default
 * `base_path`. Line ranges (`file.md:4:6`) and named sections (`file.md:name`) select part of a
 * file; section markers are removed everywhere else. Runs on raw text, so it also resolves inside
 * code fences, as MkDocs does. Missing targets, missing sections and include cycles are reported
 * as warnings and left out.
 *
 * URL includes come from `readUrl`, which is passed only when the site allows them
 * (`url_download`); a file included by URL may include further URLs only, as in pymdownx.
 */
export function resolveIncludes(
	source: string,
	page: IncludePage,
	read: ReadFile,
	readUrl?: ReadUrl
): IncludeResult {
	const warnings: string[] = [];
	const outside = new Set<string>();
	const pending = new Set<string>();
	const sourcePath = posix.normalize(page.sourcePath).replace(/\/$/, '');

	function expand(text: string, chain: string[], isSection = false): string[] {
		const lines = text.split('\n');
		const output: string[] = [];

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const single = SINGLE_LINE.exec(line);
			const block = single ? undefined : BLOCK_MARKER.exec(line);
			const escape = single?.[2] || block?.[2];

			if (escape) {
				output.push(line.replace(';', ''));
				continue;
			}
			if (single) {
				const name = single[3].slice(1, -1).replace(/\\(["'])/g, '$1');
				if (!name.startsWith(';')) output.push(...include(name, single[1], chain));
				continue;
			}
			const end = block ? findBlockEnd(lines, i + 1) : -1;
			if (!block || end === -1) {
				const marker = isSection ? null : SECTION_MARKER.exec(line);
				if (!marker) output.push(line);
				else if (marker[2]) output.push(unescapeMarker(marker));
				continue;
			}
			for (const entry of lines.slice(i + 1, end)) {
				const name = entry.trim();
				if (name === '') output.push('');
				else if (!name.startsWith(';')) output.push(...include(name, block[1], chain));
			}
			i = end;
		}
		return output;
	}

	function include(name: string, indent: string, chain: string[]): string[] {
		const [, file, ranges, section] = SELECTION.exec(name)!;
		const isUrl = URL_TARGET.test(file.trim());
		const parent = chain.at(-1)!;
		if (!isUrl && URL_TARGET.test(parent)) {
			warnings.push(
				`${page.path}: include "${name}" in the URL include "${parent}" is not a URL, not inserted`
			);
			return [];
		}
		const target = isUrl ? file.trim() : posix.normalize(file.trim());
		if (!isUrl && (posix.isAbsolute(target) || target === '..' || target.startsWith('../'))) {
			warnings.push(`${page.path}: include "${name}" points outside the repository`);
			return [];
		}
		if (chain.includes(target)) {
			warnings.push(
				`${page.path}: include cycle ${[...chain, target].join(' → ')}, "${target}" not inserted again`
			);
			return [];
		}

		const content = isUrl ? fetched(target) : readLocal(target);
		if (content === undefined) return [];
		let lines = content.replace(/\r?\n$/, '').split('\n');
		// Counted like pymdownx.snippets, where a final newline makes a last, empty line.
		if (ranges) lines = selectLines(content.split('\n'), ranges);
		if (section) {
			const selected = extractSection(content.split('\n'), section);
			if (!selected) {
				warnings.push(`${page.path}: include "${target}" has no section "${section}"`);
				return [];
			}
			lines = selected;
		}
		return expand(lines.join('\n'), [...chain, target], section !== undefined).map((line) =>
			line === '' ? line : indent + line
		);
	}

	function readLocal(target: string): string | undefined {
		if (sourcePath !== '.' && !target.startsWith(`${sourcePath}/`)) outside.add(target);
		const content = read(target);
		if (content === undefined) warnings.push(`${page.path}: include "${target}" not found`);
		return content;
	}

	function fetched(url: string): string | undefined {
		if (!readUrl) {
			warnings.push(
				`${page.path}: include "${url}" not inserted, URL includes are disabled (url_download in the site config)`
			);
			return undefined;
		}
		const result = readUrl(url);
		if (!result) {
			pending.add(url);
			return undefined;
		}
		if ('problem' in result) {
			warnings.push(`${page.path}: include "${url}" not fetched, ${result.problem}`);
			return undefined;
		}
		return result.content;
	}

	const markdown = expand(source, [posix.normalize(page.path)]).join('\n');
	return { markdown, warnings, outsideSourcePath: [...outside], pendingUrls: [...pending] };
}

function findBlockEnd(lines: string[], start: number): number {
	for (let i = start; i < lines.length; i++) {
		const marker = BLOCK_MARKER.exec(lines[i]);
		if (marker && !marker[2]) return i;
	}
	return -1;
}

/** Ranges like `:4:6,-2:` – 1-based and inclusive, negative counts from the end, `0` means 1. */
function selectLines(lines: string[], ranges: string): string[] {
	const total = lines.length;
	return ranges
		.slice(1)
		.split(',')
		.flatMap((range) => {
			const [first, last] = range.split(':').map((n) => (n ? Number(n) : undefined));
			const start =
				first === undefined ? 0 : first < 0 ? clamp(total + first, total) : Math.max(0, first - 1);
			const end = last === undefined ? total : last < 0 ? clamp(total + 1 + last, total) : last;
			return lines.slice(start, end);
		});
}

function clamp(value: number, max: number): number {
	return Math.min(Math.max(value, 0), max);
}

/** The lines between `[start:name]` and `[end:name]`, or undefined if there is no such start. */
function extractSection(lines: string[], name: string): string[] | undefined {
	const result: string[] = [];
	let inside = false;
	let found = false;
	for (const line of lines) {
		const marker = SECTION_MARKER.exec(line);
		if (marker && inside && marker[2]) {
			result.push(unescapeMarker(marker));
			continue;
		}
		if (marker && marker[6] === name) {
			if (marker[5] === 'start' && !inside) {
				inside = found = true;
				continue;
			}
			if (marker[5] === 'start') continue;
			break;
		}
		if (marker) continue;
		if (inside) result.push(line);
	}
	return found ? result : undefined;
}

function unescapeMarker(marker: RegExpExecArray): string {
	const [, before, escape, dashes, section, , , after] = marker;
	return before + escape.replace(';', '') + dashes + section + after;
}
