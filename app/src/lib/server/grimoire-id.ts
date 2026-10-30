/** Where a page lies: its source and its file relative to the source path. */
export interface PageLocation {
	source: string;
	/** Markdown file relative to the source path, e.g. `guides/setup.md`. */
	file: string;
}

/** A page within a source, and the anchor of one of its sections; no anchor names the page. */
export interface SectionLocation extends PageLocation {
	anchor?: string | null;
}

/**
 * Whether a file can be named by an ID. A `#` in its name would read as the start of the anchor,
 * so such a file is left out of the index rather than listed under an ID that names another page.
 */
export function hasGrimoireId(file: string): boolean {
	return !file.includes('#');
}

/** The part of an ID within its source: the file without `.md`, and `#anchor` for a section. */
export function pageId(file: string, anchor?: string | null): string {
	const page = file.replace(/\.md$/, '');
	return anchor ? `${page}#${anchor}` : page;
}

/**
 * The grimoire ID agents `read`: `source/page`, the page being the file without `.md`, followed
 * by `#anchor` for a section.
 */
export function grimoireId(page: PageLocation, anchor?: string | null): string {
	return `${page.source}/${pageId(page.file, anchor)}`;
}

/** The page and anchor an ID names; undefined when it names no page. */
export function parseGrimoireId(id: string): SectionLocation | undefined {
	const hash = id.indexOf('#');
	const pagePart = hash === -1 ? id : id.slice(0, hash);
	const [source, ...page] = pagePart.split('/');
	if (page.length === 0) return undefined;
	return {
		source,
		file: `${page.join('/')}.md`,
		anchor: hash === -1 ? undefined : id.slice(hash + 1)
	};
}

// The index stores links between pages without the source slug, so a changed slug takes effect at
// once instead of after the next sync. The scheme marks them in the stored Markdown.
const STORED_LINK = 'grimoire:';

/** The URL a link to `pageId` is stored with in a snippet. */
export function storedLink(id: string): string {
	return `${STORED_LINK}${id}`;
}

/** Stored snippet Markdown with its links to other pages turned into full grimoire IDs. */
export function withSlug(content: string, source: string): string {
	// Where remark writes a link destination: `](url`, `](<url`, `]: url`, `]: <url`, `<url>`.
	return content.replace(/(\]\(<?|\]:[ \t]+<?|<)grimoire:/g, `$1${source}/`);
}
