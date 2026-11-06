/** Rows on one page of a list. */
export const PAGE_SIZE = 100;

/** What a list shows, as it stands in the URL: `search`, one parameter per filter, `sort`, `page`. */
export interface ListParams {
	search: string;
	filters: Record<string, string>;
	/** A key of the list's sorts. */
	sort: string;
	descending: boolean;
	page: number;
}

/** How a list searches, filters and sorts its rows. */
export interface ListSpec<Row> {
	/** The text the search looks in. */
	search?: (row: Row) => string;
	/** The value of each filter a row has. */
	filters?: Record<string, (row: Row) => string>;
	/** Sort keys, the first the default. A null value sorts last. */
	sorts: Record<string, (row: Row) => string | number | null>;
	/** The sort without one in the URL, `-` first for descending; else the first, ascending. */
	defaultSort?: string;
}

export interface ListPage<Row> {
	rows: Row[];
	/** Rows after search and filters, on all pages. */
	total: number;
	page: number;
	pageCount: number;
	/** The sort applied, for the table to mark its column; absent for a list that is not sorted. */
	sort?: { key: string; descending: boolean };
}

/** All of `rows` on one page, for a list that is neither searched nor paged. */
export function wholeList<Row>(rows: Row[]): ListPage<Row> {
	return { rows, total: rows.length, page: 1, pageCount: 1 };
}

/** Reads the state of a list from `url`, ignoring values the list does not know. */
export function readListParams<Row>(url: URL, spec: ListSpec<Row>): ListParams {
	const sortParam = url.searchParams.get('sort') || spec.defaultSort || '';
	const descending = sortParam.startsWith('-');
	const sortKey = descending ? sortParam.slice(1) : sortParam;
	const known = Object.hasOwn(spec.sorts, sortKey);
	const filters: Record<string, string> = {};
	for (const name of Object.keys(spec.filters ?? {})) {
		const value = url.searchParams.get(name);
		if (value) filters[name] = value;
	}
	const page = Number(url.searchParams.get('page'));
	return {
		search: url.searchParams.get('search')?.trim() ?? '',
		filters,
		sort: known ? sortKey : Object.keys(spec.sorts)[0],
		descending: known && descending,
		page: Number.isInteger(page) && page > 1 ? page : 1
	};
}

function compare(a: string | number | null, b: string | number | null): number {
	if (a === b) return 0;
	if (a === null) return 1;
	if (b === null) return -1;
	if (typeof a === 'number' && typeof b === 'number') return a - b;
	return String(a).localeCompare(String(b), undefined, { sensitivity: 'base', numeric: true });
}

/** The rows of the page `params` ask for, searched, filtered and sorted. */
export function listPage<Row>(rows: Row[], params: ListParams, spec: ListSpec<Row>): ListPage<Row> {
	const needle = params.search.toLocaleLowerCase();
	const matching = rows.filter(
		(row) =>
			(!needle || !spec.search || spec.search(row).toLocaleLowerCase().includes(needle)) &&
			Object.entries(params.filters).every(([name, value]) => spec.filters?.[name]?.(row) === value)
	);
	const key = spec.sorts[params.sort];
	// Nulls stay last whichever way the list is sorted.
	const sorted = matching.toSorted((a, b) => {
		const [x, y] = [key(a), key(b)];
		if (x === null || y === null) return compare(x, y);
		return params.descending ? compare(y, x) : compare(x, y);
	});
	const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
	const page = Math.min(params.page, pageCount);
	return {
		rows: sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
		total: sorted.length,
		page,
		pageCount,
		sort: { key: params.sort, descending: params.descending }
	};
}
