import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import type { Root } from 'mdast';

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkStringify, { bullet: '-' });

export function parseMarkdown(markdown: string): Root {
	return processor.parse(markdown);
}

export function stringifyMarkdown(tree: Root): string {
	return processor.stringify(tree);
}
