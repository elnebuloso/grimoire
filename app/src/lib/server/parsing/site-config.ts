import { posix } from 'node:path';
import { parse as parseToml } from 'smol-toml';
import { isNode, parseDocument, visit } from 'yaml';
import type { ReadFile } from './include';

export interface SiteConfig {
	/** Path of the config file relative to the repository root, e.g. `mkdocs.yml`. */
	file: string;
	/** Settings of the site; in `zensical.toml` the ones under `[project]`. */
	settings: Record<string, unknown>;
}

// MkDocs refers to Python functions with YAML tags; they are kept in the shape `zensical.toml`
// uses, `{ object, kwds }` for a call and `{ python_name }` for the function itself.
const PYTHON_NAME = 'tag:yaml.org,2002:python/name:';
const PYTHON_APPLY = 'tag:yaml.org,2002:python/object/apply:';

// Zensical reads `mkdocs.yml` too, but prefers its own file when both exist.
const CONFIG_FILES = ['zensical.toml', 'mkdocs.yml'];

/**
 * Finds the site config that builds a source: the first `zensical.toml` or `mkdocs.yml` in the
 * source path or one of the directories above it. Throws when the file cannot be parsed.
 */
export function findSiteConfig(sourcePath: string, read: ReadFile): SiteConfig | undefined {
	for (let directory = posix.normalize(sourcePath); ; directory = posix.dirname(directory)) {
		for (const name of CONFIG_FILES) {
			const file = posix.join(directory, name);
			const content = read(file);
			if (content === undefined) continue;
			try {
				return { file, settings: parseSettings(name, content) };
			} catch (error) {
				throw new Error(`cannot parse ${file}: ${(error as Error).message}`, { cause: error });
			}
		}
		if (directory === '.' || directory === '/') return undefined;
	}
}

function parseSettings(name: string, content: string): Record<string, unknown> {
	if (name === 'zensical.toml') {
		const project = parseToml(content).project;
		return isRecord(project) ? project : {};
	}
	const document = parseDocument(content, { logLevel: 'error' });
	if (document.errors.length > 0) throw document.errors[0];
	visit(document, (_, node) => {
		const tag = isNode(node) ? node.tag : undefined;
		if (tag?.startsWith(PYTHON_NAME)) {
			return document.createNode({ python_name: tag.slice(PYTHON_NAME.length) });
		}
		if (tag?.startsWith(PYTHON_APPLY)) {
			const { kwds } = (node as { toJSON(): { kwds?: unknown } }).toJSON() ?? {};
			return document.createNode({ object: tag.slice(PYTHON_APPLY.length), kwds: kwds ?? {} });
		}
	});
	const settings = document.toJS();
	return isRecord(settings) ? settings : {};
}

/**
 * The pages listed in `nav`, in order, as paths relative to `sourcePath`. Entries outside the
 * source path, links and duplicates are left out. Undefined when the config has no `nav`.
 */
export function navOrder(config: SiteConfig, sourcePath: string): string[] | undefined {
	if (config.settings.nav === undefined) return undefined;
	const docsDir = posix.join(
		posix.dirname(config.file),
		typeof config.settings.docs_dir === 'string' ? config.settings.docs_dir : 'docs'
	);
	const source = posix.normalize(sourcePath).replace(/\/$/, '');
	const files = navEntries(config.settings.nav)
		.filter((entry) => entry.endsWith('.md') && !entry.includes('://'))
		.map((entry) => posix.join(docsDir, entry))
		.filter((path) => source === '.' || path.startsWith(`${source}/`))
		.map((path) => (source === '.' ? path : path.slice(source.length + 1)));
	return [...new Set(files)];
}

/** Every string in a nav tree: `- page.md`, `- Title: page.md`, `- Section: [...]`. */
function navEntries(nav: unknown): string[] {
	if (typeof nav === 'string') return [nav];
	if (Array.isArray(nav)) return nav.flatMap(navEntries);
	if (isRecord(nav)) return Object.values(nav).flatMap(navEntries);
	return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
