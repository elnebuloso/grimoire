/** Where a page lies: its project, its source and its file relative to the source path. */
export interface PageLocation {
	project: string;
	source: string;
	/** Markdown file relative to the source path, e.g. `guides/setup.md`. */
	file: string;
}

/** The part of an ID within its source: the file without `.md`, and `#anchor` for a section. */
export function pageId(file: string, anchor?: string | null): string {
	const page = file.replace(/\.md$/, '');
	return anchor ? `${page}#${anchor}` : page;
}

/**
 * The grimoire ID agents `read`: `project/source/page`, the page being the file without `.md`,
 * followed by `#anchor` for a section.
 */
export function grimoireId(page: PageLocation, anchor?: string | null): string {
	return `${page.project}/${page.source}/${pageId(page.file, anchor)}`;
}

/** The page and anchor an ID names; undefined when it names no page. */
export function parseGrimoireId(
	id: string
): (PageLocation & { anchor: string | undefined }) | undefined {
	const hash = id.indexOf('#');
	const pagePart = hash === -1 ? id : id.slice(0, hash);
	const [project, source, ...page] = pagePart.split('/');
	if (page.length === 0) return undefined;
	return {
		project,
		source,
		file: `${page.join('/')}.md`,
		anchor: hash === -1 ? undefined : id.slice(hash + 1)
	};
}

// The index stores links between pages without project and source slugs, so a changed slug takes
// effect at once instead of after the next sync. The scheme marks them in the stored Markdown.
const STORED_LINK = 'grimoire:';

/** The URL a link to `pageId` is stored with in a snippet. */
export function storedLink(id: string): string {
	return `${STORED_LINK}${id}`;
}

/** Stored snippet Markdown with its links to other pages turned into full grimoire IDs. */
export function withSlugs(content: string, project: string, source: string): string {
	// Where remark writes a link destination: `](url`, `](<url`, `]: url`, `]: <url`, `<url>`.
	return content.replace(/(\]\(<?|\]:[ \t]+<?|<)grimoire:/g, `$1${project}/${source}/`);
}
