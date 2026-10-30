import { posix } from 'node:path';
import { visit } from 'unist-util-visit';
import { estimateTokens, type ChunkedPage } from './chunk.ts';
import { parseMarkdown, stringifyMarkdown } from './markdown.ts';
import { grimoireId } from '../grimoire-id.ts';

export interface SourceLocation {
	project: string;
	source: string;
}

export interface Link {
	/** Page holding the link, relative to the source path. */
	file: string;
	/** Anchor of the snippet holding the link; undefined for the overview. */
	anchor?: string;
	/** grimoire ID of the target, or the link as written when it leaves the source path. */
	target: string;
	dead: boolean;
}

export interface LinkedSource {
	pages: Map<string, ChunkedPage>;
	links: Link[];
}

const SCHEME_OR_ABSOLUTE = /^([a-z][a-z\d+.-]*:|\/)/i;

/**
 * Rewrites relative links to Markdown pages of the same source into grimoire IDs, so agents can
 * follow them with `read`, and returns every such link with whether its target exists.
 * `pages` holds all chunked pages of one source, keyed by file relative to the source path.
 * Links with a scheme, absolute paths and links to non-Markdown files stay as they are.
 */
export function resolveLinks(
	pages: Map<string, ChunkedPage>,
	location: SourceLocation
): LinkedSource {
	const links = new Map<string, Link>();
	const linkedPages = new Map<string, ChunkedPage>();

	function resolve(url: string, file: string): { target: string; dead: boolean } | undefined {
		if (SCHEME_OR_ABSOLUTE.test(url)) return undefined;
		const hash = url.indexOf('#');
		const path = hash === -1 ? url : url.slice(0, hash);
		const anchor = hash === -1 ? '' : url.slice(hash + 1);
		if (path !== '' && !path.endsWith('.md')) return undefined;

		const targetFile =
			path === '' ? file : posix.normalize(posix.join(posix.dirname(file), decode(path)));
		if (targetFile === '..' || targetFile.startsWith('../')) return { target: url, dead: true };

		const page = { ...location, file: targetFile };
		const target = pages.get(targetFile);
		if (!target) return { target: grimoireId(page, anchor), dead: true };
		if (!anchor || anchor === target.titleAnchor) return { target: grimoireId(page), dead: false };
		return { target: grimoireId(page, anchor), dead: !hasAnchor(target, anchor) };
	}

	for (const [file, page] of pages) {
		const snippets = page.snippets.map((snippet) => {
			const tree = parseMarkdown(snippet.content);
			let changed = false;

			visit(tree, (node) => {
				if (node.type !== 'link' && node.type !== 'definition') return;
				const link = resolve(node.url, file);
				if (!link) return;
				links.set(`${file}#${snippet.anchor ?? ''} ${link.target}`, {
					file,
					anchor: snippet.anchor,
					...link
				});
				if (link.dead) return;
				node.url = link.target;
				changed = true;
			});

			if (!changed) return snippet;
			const content = stringifyMarkdown(tree);
			return { ...snippet, content, tokens: estimateTokens(content) };
		});
		linkedPages.set(file, { ...page, snippets });
	}
	return { pages: linkedPages, links: [...links.values()] };
}

function hasAnchor(page: ChunkedPage, anchor: string): boolean {
	return page.snippets.some(
		(snippet) => snippet.anchor === anchor || snippet.aliases.includes(anchor)
	);
}

// A malformed escape such as `%E0` is kept as written instead of failing the whole page.
function decode(path: string): string {
	try {
		return decodeURIComponent(path);
	} catch {
		return path;
	}
}
