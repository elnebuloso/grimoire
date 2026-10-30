import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { toString } from 'mdast-util-to-string';
import type { Root, RootContent } from 'mdast';

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkStringify, { bullet: '-' });

export function parseMarkdown(markdown: string): Root {
	return processor.parse(markdown);
}

export function stringifyMarkdown(tree: Root): string {
	return processor.stringify(tree);
}

/** Separates code blocks from the prose of a snippet, so search can weigh them differently. */
export function splitCode(markdown: string): { text: string; code: string } {
	const nodes = parseMarkdown(markdown).children;
	const isCode = (node: RootContent) => node.type === 'code';
	return {
		text: nodes
			.filter((node) => !isCode(node))
			.map((node) => toString(node))
			.join('\n'),
		code: nodes
			.filter(isCode)
			.map((node) => toString(node))
			.join('\n')
	};
}
