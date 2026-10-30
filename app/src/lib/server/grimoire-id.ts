/** Where a page lies: its project, its source and its file relative to the source path. */
export interface PageLocation {
	project: string;
	source: string;
	/** Markdown file relative to the source path, e.g. `guides/setup.md`. */
	file: string;
}

/**
 * The grimoire ID agents `read`: `project/source/page`, the page being the file without `.md`,
 * followed by `#anchor` for a section.
 */
export function grimoireId(page: PageLocation, anchor?: string | null): string {
	const id = `${page.project}/${page.source}/${page.file.replace(/\.md$/, '')}`;
	return anchor ? `${id}#${anchor}` : id;
}

/** The page and anchor an ID names; undefined when it names no page. */
export function parseGrimoireId(
	id: string
): (PageLocation & { anchor: string | undefined }) | undefined {
	const hash = id.indexOf('#');
	const pageId = hash === -1 ? id : id.slice(0, hash);
	const [project, source, ...page] = pageId.split('/');
	if (page.length === 0) return undefined;
	return {
		project,
		source,
		file: `${page.join('/')}.md`,
		anchor: hash === -1 ? undefined : id.slice(hash + 1)
	};
}
