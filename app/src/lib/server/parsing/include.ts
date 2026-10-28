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
}

/** Returns the content of a file relative to the repository root, or undefined if it does not exist. */
export type ReadFile = (path: string) => string | undefined;

// Same notation as pymdownx.snippets: dashes of any length, nothing after the marker.
const SINGLE_LINE = /^([ \t]*)(;*)-+8<-+[ \t]+("(?:\\"|[^"\r\n])+?"|'(?:\\'|[^'\r\n])+?')\r?$/;
const BLOCK_MARKER = /^([ \t]*)(;*)-+8<-+\r?$/;

/**
 * Replaces pymdownx.snippets includes (`--8<-- "file.md"` and the block format) with the content
 * of the included files, resolved from the repository root like MkDocs with the default
 * `base_path`. Runs on raw text, so it also resolves inside code fences, as MkDocs does.
 * Missing targets and include cycles are reported as warnings and left out.
 */
export function resolveIncludes(source: string, page: IncludePage, read: ReadFile): IncludeResult {
	const warnings: string[] = [];
	const outside = new Set<string>();
	const sourcePath = posix.normalize(page.sourcePath).replace(/\/$/, '');

	function expand(text: string, chain: string[]): string[] {
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
				output.push(line);
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
		const target = posix.normalize(name);
		if (posix.isAbsolute(target) || target === '..' || target.startsWith('../')) {
			warnings.push(`${page.path}: include "${name}" points outside the repository`);
			return [];
		}
		if (chain.includes(target)) {
			warnings.push(
				`${page.path}: include cycle ${[...chain, target].join(' → ')}, "${target}" not inserted again`
			);
			return [];
		}
		if (sourcePath !== '.' && !target.startsWith(`${sourcePath}/`)) outside.add(target);

		const content = read(target);
		if (content === undefined) {
			warnings.push(`${page.path}: include "${target}" not found`);
			return [];
		}
		return expand(content.replace(/\r?\n$/, ''), [...chain, target]).map((line) =>
			line === '' ? line : indent + line
		);
	}

	const markdown = expand(source, [posix.normalize(page.path)]).join('\n');
	return { markdown, warnings, outsideSourcePath: [...outside] };
}

function findBlockEnd(lines: string[], start: number): number {
	for (let i = start; i < lines.length; i++) {
		const marker = BLOCK_MARKER.exec(lines[i]);
		if (marker && !marker[2]) return i;
	}
	return -1;
}
