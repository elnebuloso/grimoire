import { posix } from 'node:path';
import type { IndexedPage, SourceIndex } from '../db/sources.ts';
import { chunkPage } from '../parsing/chunk.ts';
import { resolveLinks } from '../parsing/links.ts';
import { splitCode } from '../parsing/markdown.ts';
import { preprocessPage } from '../parsing/preprocess.ts';
import type { SiteConfig } from '../parsing/site-config.ts';
import { configuredSlugify, pythonMarkdownSlugify, type Slugify } from '../parsing/slugs.ts';

/** A page with its includes resolved, ready to be turned into snippets. */
export interface PreparedPage {
	/** Path relative to the source path, e.g. `deploy.md`. */
	file: string;
	markdown: string;
	/** Index of the page in the site's `nav`; undefined when it is not listed there. */
	navPosition?: number;
	includeWarnings: string[];
}

/** What a checkout yields before the expensive part: the pages and the site config. */
export interface PreparedSource {
	pages: PreparedPage[];
	siteConfig?: SiteConfig;
	warnings: string[];
}

export interface PagesToIndex extends PreparedSource {
	/** Path of the source in the repository, normalised, e.g. `docs` or `.`. */
	sourcePath: string;
}

/**
 * Turns prepared pages into snippets and links. The Markdown processing that takes most of a
 * sync; it runs in the indexing child process, which plain Node starts, so it imports only what
 * plain Node can load.
 * A page that cannot be processed is skipped with a warning.
 */
export function indexPages(job: PagesToIndex): Omit<SourceIndex, 'commit'> {
	const warnings = [...job.warnings];
	let slugify: Slugify = pythonMarkdownSlugify;
	if (job.siteConfig) {
		const configured = configuredSlugify(job.siteConfig.settings);
		slugify = configured.slugify;
		if (configured.warning) warnings.push(`${job.siteConfig.file}: ${configured.warning}`);
	}

	const indexed: Omit<IndexedPage, 'searchTexts'>[] = [];
	for (const { file, markdown, navPosition, includeWarnings } of job.pages) {
		warnings.push(...includeWarnings);
		try {
			const metadata = preprocessPage(markdown);
			const chunked = chunkPage(metadata, file, slugify);
			indexed.push({ file, navPosition, metadata, chunked });
		} catch (error) {
			warnings.push(`${posix.join(job.sourcePath, file)}: skipped, ${(error as Error).message}`);
		}
	}

	const linked = resolveLinks(new Map(indexed.map((page) => [page.file, page.chunked])));
	const pages = indexed.map((page) => {
		const chunked = linked.pages.get(page.file)!;
		const searchTexts = chunked.snippets.map((snippet) => splitCode(snippet.content));
		return { ...page, chunked, searchTexts };
	});
	return { pages, links: linked.links, warnings };
}
