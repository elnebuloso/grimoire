import type { Definition, Heading, Root, RootContent } from 'mdast';
import { toString } from 'mdast-util-to-string';
import { visit, SKIP } from 'unist-util-visit';
import { parseMarkdown, stringifyMarkdown } from './markdown.ts';
import type { PreprocessedPage } from './preprocess';
import { pythonMarkdownSlugify, type Slugify } from './slugs.ts';

export interface Snippet {
	/** Undefined for the overview snippet, which has no heading of its own. */
	anchor?: string;
	/** Anchors of small subsections merged into this snippet. */
	aliases: string[];
	titlePath: string[];
	/** Which part of its section this is, counted from 1, when the section was split. */
	part: number;
	parts: number;
	file: string;
	/** Markdown of the section without its own heading line. */
	content: string;
	tokens: number;
}

export interface ChunkedPage {
	title: string;
	/** Anchor of the `#` heading that became the title; MkDocs renders it, but it is no snippet. */
	titleAnchor?: string;
	description?: string;
	snippets: Snippet[];
}

interface Section {
	heading?: Heading;
	title: string;
	anchor?: string;
	aliases: string[];
	nodes: RootContent[];
	children: Section[];
}

const MIN_TOKENS = 50;
const MAX_TOKENS = 800;

export function estimateTokens(text: string): number {
	return Math.ceil(text.length / 4);
}

/**
 * Splits a preprocessed page into snippets: one per heading, small sections merged into their
 * parent, large ones split at block boundaries. Anchors match the page MkDocs renders with the
 * given slug function.
 */
export function chunkPage(
	page: PreprocessedPage,
	/** Path relative to the source path, e.g. `deploy.md`. */
	file: string,
	slugify: Slugify = pythonMarkdownSlugify
): ChunkedPage {
	const tree = parseMarkdown(page.markdown);
	const definitions = takeDefinitions(tree);
	const nodes = tree.children;
	const anchors = assignAnchors(
		nodes.filter((node) => node.type === 'heading'),
		slugify
	);

	const root: Section = { title: 'Overview', aliases: [], nodes: [], children: [] };
	const stack: { depth: number; section: Section }[] = [{ depth: 0, section: root }];
	let firstH1: string | undefined;
	let titleAnchor: string | undefined;

	for (const node of nodes) {
		if (node.type !== 'heading') {
			stack[stack.length - 1].section.nodes.push(node);
			continue;
		}
		if (node.depth === 1 && firstH1 === undefined && stack.length === 1) {
			firstH1 = toString(node, { includeHtml: false });
			titleAnchor = anchors.get(node);
			continue;
		}
		while (stack[stack.length - 1].depth >= node.depth) stack.pop();
		const section: Section = {
			heading: node,
			title: toString(node, { includeHtml: false }),
			anchor: anchors.get(node),
			aliases: [],
			nodes: [],
			children: []
		};
		stack[stack.length - 1].section.children.push(section);
		stack.push({ depth: node.depth, section });
	}

	const firstParagraph = root.nodes.find((node) => node.type === 'paragraph');
	const description =
		page.description ?? (firstParagraph && toString(firstParagraph, { includeHtml: false }));
	const title = page.title ?? firstH1 ?? file.replace(/\.md$/, '');

	mergeSmallSections(root);
	const snippets: Snippet[] = [];
	collectSnippets(root, [title], file, definitions, snippets);
	return { title, titleAnchor, description: description || undefined, snippets };
}

// Mirrors Python-Markdown: ids from attribute lists (`{#id}`) are reserved first, then every
// heading in document order gets its slug, made unique with `_1`, `_2`.
function assignAnchors(headings: Heading[], slugify: Slugify): Map<Heading, string> {
	const customIds = new Map(headings.map((heading) => [heading, takeAttributeListId(heading)]));
	const used = new Set([...customIds.values()].filter((id) => id !== undefined));
	const anchors = new Map<Heading, string>();

	for (const heading of headings) {
		const customId = customIds.get(heading);
		if (customId) {
			anchors.set(heading, customId);
			continue;
		}
		let anchor = slugify(toString(heading, { includeHtml: false }));
		while (!anchor || used.has(anchor)) {
			const numbered = /^(.*)_(\d+)$/.exec(anchor);
			anchor = numbered ? `${numbered[1]}_${Number(numbered[2]) + 1}` : `${anchor}_1`;
		}
		used.add(anchor);
		anchors.set(heading, anchor);
	}
	return anchors;
}

/** Removes a trailing `{#id .class}` from the heading text and returns its id. */
function takeAttributeListId(heading: Heading): string | undefined {
	const last = heading.children.at(-1);
	if (last?.type !== 'text') return undefined;
	// By hand rather than `/\s*\{([^}]*)\}\s*$/`, which retries from every position and so takes
	// time quadratic in the length of the heading.
	const text = last.value.trimEnd();
	if (!text.endsWith('}')) return undefined;
	const inner = text.slice(0, -1);
	const open = inner.indexOf('{', inner.lastIndexOf('}') + 1);
	if (open === -1) return undefined;
	const attributes = inner.slice(open + 1);
	last.value = last.value.slice(0, open).trimEnd();
	return /#([\w-]+)/.exec(attributes)?.[1];
}

function mergeSmallSections(section: Section) {
	section.children.forEach(mergeSmallSections);
	const kept: Section[] = [];
	for (const child of section.children) {
		if (child.children.length > 0 || tokensOf(child.nodes) >= MIN_TOKENS) {
			kept.push(child);
			continue;
		}
		section.nodes.push(child.heading!, ...child.nodes);
		section.aliases.push(child.anchor!, ...child.aliases);
	}
	section.children = kept;
}

// Definitions usually sit at the end of a page, far from the sections that use them, and a
// snippet is delivered alone: each one gets its own copy of the definitions it references.
function takeDefinitions(tree: Root): Map<string, Definition> {
	const definitions = new Map<string, Definition>();
	visit(tree, 'definition', (node, index, parent) => {
		if (!definitions.has(node.identifier)) definitions.set(node.identifier, node);
		parent!.children.splice(index!, 1);
		return [SKIP, index!];
	});
	return definitions;
}

function definitionsUsedBy(nodes: RootContent[], definitions: Map<string, Definition>) {
	const used = new Map<string, Definition>();
	for (const node of nodes) {
		visit(node, 'linkReference', (reference) => {
			const definition = definitions.get(reference.identifier);
			if (definition) used.set(reference.identifier, definition);
		});
	}
	return [...used.values()];
}

function collectSnippets(
	section: Section,
	titlePath: string[],
	file: string,
	definitions: Map<string, Definition>,
	out: Snippet[]
) {
	const path = [...titlePath, section.title];
	const parts = splitAtBlocks(section.nodes);

	parts.forEach((part, index) => {
		const content = stringifyMarkdown({
			type: 'root',
			children: [...part, ...definitionsUsedBy(part, definitions)]
		});
		out.push({
			anchor: section.anchor,
			aliases: section.aliases,
			titlePath: path,
			part: index + 1,
			parts: parts.length,
			file,
			content,
			tokens: estimateTokens(content)
		});
	});

	for (const child of section.children) {
		collectSnippets(child, section.heading ? path : titlePath, file, definitions, out);
	}
}

// Code blocks, tables and lists are single nodes, so cutting between nodes never splits them.
function splitAtBlocks(nodes: RootContent[]): RootContent[][] {
	const parts: RootContent[][] = [];
	let current: RootContent[] = [];
	let currentTokens = 0;

	for (const node of nodes) {
		const tokens = tokensOf([node]);
		if (current.length > 0 && currentTokens + tokens > MAX_TOKENS) {
			parts.push(current);
			current = [];
			currentTokens = 0;
		}
		current.push(node);
		currentTokens += tokens;
	}
	if (current.length > 0) parts.push(current);
	return parts;
}

function tokensOf(nodes: RootContent[]): number {
	return estimateTokens(stringifyMarkdown({ type: 'root', children: nodes }));
}
