import { describe, expect, it } from 'vitest';
import { listPage, readListParams, type ListSpec } from './list.js';

interface Source {
	name: string;
	state: string;
	checked: string | null;
}

const SPEC: ListSpec<Source> = {
	search: (source) => source.name,
	filters: { status: (source) => source.state },
	sorts: { name: (source) => source.name, checked: (source) => source.checked }
};

const params = (query: string) =>
	readListParams(new URL(`https://grimoire.example/x?${query}`), SPEC);

// 500 sources, as an instance with hundreds of them has: every tenth failing, never checked.
const SOURCES: Source[] = Array.from({ length: 500 }, (_, index) => ({
	name: `Source ${index + 1}`,
	state: index % 10 === 0 ? 'error' : 'synced',
	checked: index % 10 === 0 ? null : `2026-11-01T00:${String(index % 60).padStart(2, '0')}:00Z`
}));

describe('readListParams', () => {
	it('defaults to the first sort, ascending, on the first page, without search or filters', () => {
		expect(params('')).toEqual({
			search: '',
			filters: {},
			sort: 'name',
			descending: false,
			page: 1
		});
	});

	it('reads search, known filters, a descending sort and the page', () => {
		expect(params('search=+auth+&status=error&other=x&sort=-checked&page=3')).toEqual({
			search: 'auth',
			filters: { status: 'error' },
			sort: 'checked',
			descending: true,
			page: 3
		});
	});

	it('falls back on an unknown sort and a page that is not one', () => {
		expect(params('sort=-secret&page=abc')).toMatchObject({
			sort: 'name',
			descending: false,
			page: 1
		});
		expect(params('page=0').page).toBe(1);
	});

	it('falls back on a sort that names what every object inherits', () => {
		for (const sort of ['__proto__', 'valueOf', '-constructor', 'hasOwnProperty']) {
			expect(params(`sort=${sort}`)).toMatchObject({ sort: 'name', descending: false });
		}
	});

	it('takes the default sort of the list, descending where it says so', () => {
		const spec = { ...SPEC, defaultSort: '-checked' };
		const url = (query: string) => new URL(`https://grimoire.example/x?${query}`);
		expect(readListParams(url(''), spec)).toMatchObject({ sort: 'checked', descending: true });
		expect(readListParams(url('sort=name'), spec)).toMatchObject({
			sort: 'name',
			descending: false
		});
	});
});

describe('listPage', () => {
	it('cuts 500 rows into pages of 100, in natural name order', () => {
		const first = listPage(SOURCES, params(''), SPEC);
		expect(first).toMatchObject({ total: 500, page: 1, pageCount: 5 });
		expect(first.rows).toHaveLength(100);
		expect(first.rows.slice(0, 3).map((row) => row.name)).toEqual([
			'Source 1',
			'Source 2',
			'Source 3'
		]);
		expect(listPage(SOURCES, params('page=5'), SPEC).rows.at(-1)?.name).toBe('Source 500');
	});

	it('searches without regard to case and filters by the exact value', () => {
		const found = listPage(SOURCES, params('search=SOURCE 12&status=synced'), SPEC);
		// "Source 121" is index 120, failing; "Source 112" does not hold the text.
		expect(found.rows.map((row) => row.name)).toEqual([
			'Source 12',
			'Source 120',
			'Source 122',
			'Source 123',
			'Source 124',
			'Source 125',
			'Source 126',
			'Source 127',
			'Source 128',
			'Source 129'
		]);
	});

	it('keeps rows without a value last, in either direction', () => {
		for (const sort of ['checked', '-checked']) {
			const rows = listPage(SOURCES, params(`sort=${sort}&page=5`), SPEC).rows;
			expect(rows.at(-1)?.checked).toBeNull();
		}
		const descending = listPage(SOURCES, params('sort=-checked'), SPEC).rows;
		expect(descending[0].checked).toBe('2026-11-01T00:59:00Z');
	});

	it('shows the last page for a page past the end, and one empty page for no match', () => {
		expect(listPage(SOURCES, params('page=9'), SPEC).page).toBe(5);
		expect(listPage(SOURCES, params('search=nothing'), SPEC)).toEqual({
			rows: [],
			total: 0,
			page: 1,
			pageCount: 1,
			sort: { key: 'name', descending: false }
		});
	});

	it('reports the sort it applied, also for an unknown one in the URL', () => {
		expect(listPage(SOURCES, params('sort=-checked'), SPEC).sort).toEqual({
			key: 'checked',
			descending: true
		});
		expect(listPage(SOURCES, params('sort=-size'), SPEC).sort).toEqual({
			key: 'name',
			descending: false
		});
	});
});
