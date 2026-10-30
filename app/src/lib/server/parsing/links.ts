import { posix } from 'node:path';
import { visit } from 'unist-util-visit';
import { estimateTokens, type ChunkedPage } from './chunk.ts';
import { parseMarkdown, stringifyMarkdown } from './markdown.ts';
import { pageId, storedLink } from '../grimoire-id.ts';

export interface Link {
	/** Page holding the link, relative to the source path. */
	file: string;
	/** Anchor of the snippet holding the link; undefined for the overview. */
	anchor?: string;
	/** ID of the target within the source, or the link as written when it leaves the source path. */
	target: string;
	dead: boolean;
}

export interface LinkedSource {
	pages: Map<string, ChunkedPage>;
	links: Link[];
}

const SCHEME_OR_ABSOLUTE = /^([a-z][a-z\d+.-]*:|\/)/i;

/**
 * Rewrites relative links to Markdown pages of the same source into stored links, which reading
 * turns into grimoire IDs agents can follow with `read`, and returns every such link with whether
 * its target exists.
 * `pages` holds all chunked pages of one source, keyed by file relative to the source path.
 * Links with a scheme, absolute paths and links to non-Markdown files stay as they are.
 */
export function resolveLinks(pages: Map<string, ChunkedPage>): LinkedSource {
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

		const target = pages.get(targetFile);
		if (!target) return { target: pageId(targetFile, anchor), dead: true };
		if (!anchor || anchor === target.titleAnchor)
			return { target: pageId(targetFile), dead: false };
		return { target: pageId(targetFile, anchor), dead: !hasAnchor(target, anchor) };
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
				node.url = storedLink(link.target);
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
