import { parse as parseYaml } from 'yaml';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { visit, SKIP } from 'unist-util-visit';
import type { Root, RootContent } from 'mdast';

export interface PreprocessedPage {
	title?: string;
	description?: string;
	tags: string[];
	markdown: string;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)^---[ \t]*(?:\r?\n|$)/m;
const ADMONITION = /^(?:!!!|\?\?\?\+?)\s+([\w-]+)(?:\s+[\w-]+)*?(?:\s+"(.*)")?\s*$/;
const CONTENT_TAB = /^===[+!]?\s+"(.*)"\s*$/;
const FENCE = /^(`{3,}|~{3,})/;
const INDENT = /^( {4}|\t)/;
const NOT_A_PARAGRAPH = /^(\s|`{3}|~{3}|[-*+]\s|\d+[.)]\s|\||#|>)/;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const HTML_IMAGE = /<img\b[^>]*>/gi;
const HTML_ALT = /\balt\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;
const HTML_PICTURE_SOURCE = /<source\b[^>]*>/gi;

/**
 * Turns a Markdown page into plain Markdown for agents: frontmatter becomes metadata, MkDocs/Zensical
 * admonitions and content tabs become blockquotes and labelled paragraphs, image URLs and HTML
 * comments are dropped. Plain Markdown passes through with its content unchanged.
 * Throws when the frontmatter is not valid YAML.
 */
export function preprocessPage(source: string): PreprocessedPage {
	const { metadata, body } = splitFrontmatter(source);
	const markdown = String(
		unified()
			.use(remarkParse)
			.use(remarkGfm)
			.use(dropImageUrlsAndComments)
			.use(remarkStringify, { bullet: '-' })
			.processSync(convertBlocks(body))
	);
	return { ...metadata, markdown };
}

function splitFrontmatter(source: string) {
	const match = FRONTMATTER.exec(source);
	if (!match || match.index !== 0) return { metadata: { tags: [] }, body: source };

	const data: unknown = parseYaml(match[1]) ?? {};
	const fields = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};
	return {
		metadata: {
			title: typeof fields.title === 'string' ? fields.title : undefined,
			description: typeof fields.description === 'string' ? fields.description : undefined,
			tags: Array.isArray(fields.tags) ? fields.tags.map(String) : []
		},
		body: source.slice(match[0].length)
	};
}

// Runs on text, not on the syntax tree: the 4-space indented body of an admonition or tab
// would otherwise be parsed as an indented code block.
function convertBlocks(markdown: string): string {
	const lines = markdown.split('\n');
	const output: string[] = [];
	let openFence: string | undefined;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const fence = FENCE.exec(line)?.[1];

		if (openFence) {
			output.push(line);
			if (
				fence &&
				fence[0] === openFence[0] &&
				fence.length >= openFence.length &&
				line.trim() === fence
			) {
				openFence = undefined;
			}
			continue;
		}
		if (fence) {
			openFence = fence;
			output.push(line);
			continue;
		}

		const admonition = ADMONITION.exec(line);
		const tab = CONTENT_TAB.exec(line);
		if (!admonition && !tab) {
			output.push(line);
			continue;
		}

		const { body, nextIndex } = readIndentedBody(lines, i + 1);
		i = nextIndex - 1;
		const content = convertBlocks(body);

		if (admonition) {
			output.push('', ...quote(admonitionLabel(admonition[1], admonition[2]), content), '');
		} else {
			output.push('', `**${tab![1]}:**`, '', content, '');
		}
	}
	return output.join('\n');
}

function readIndentedBody(lines: string[], start: number) {
	let end = start;
	while (end < lines.length && (lines[end].trim() === '' || INDENT.test(lines[end]))) end++;
	while (end > start && lines[end - 1].trim() === '') end--;
	const body = lines.slice(start, end).map((line) => line.replace(INDENT, ''));
	return { body: body.join('\n'), nextIndex: end };
}

// Like MkDocs: no title shows the capitalized type, an empty title "" shows none.
function admonitionLabel(type: string, title: string | undefined): string | undefined {
	if (title === undefined) return type.charAt(0).toUpperCase() + type.slice(1);
	return title || undefined;
}

function quote(label: string | undefined, content: string): string[] {
	const lines = content === '' ? [] : content.split('\n');
	if (label) {
		const tag = `**${label}:**`;
		if (lines.length > 0 && !NOT_A_PARAGRAPH.test(lines[0])) lines[0] = `${tag} ${lines[0]}`;
		else lines.unshift(tag, '');
	}
	return lines.map((line) => (line === '' ? '>' : `> ${line}`));
}

function dropImageUrlsAndComments() {
	return (tree: Root) => {
		visit(tree, (node, index, parent) => {
			if (!parent || index === undefined) return;
			const siblings = parent.children as RootContent[];

			if (node.type === 'image' || node.type === 'imageReference') {
				if (!node.alt) {
					siblings.splice(index, 1);
					return [SKIP, index];
				}
				siblings[index] = { type: 'text', value: node.alt };
				return;
			}

			if (node.type === 'html') {
				const value = node.value
					.replace(HTML_COMMENT, '')
					.replace(HTML_IMAGE, (tag) => HTML_ALT.exec(tag)?.slice(1).find(Boolean) ?? '')
					.replace(HTML_PICTURE_SOURCE, '');
				if (value.trim() === '') {
					siblings.splice(index, 1);
					return [SKIP, index];
				}
				node.value = value;
			}
		});
	};
}
