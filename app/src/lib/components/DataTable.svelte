<script lang="ts" generics="Row">
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import TableScroll from './TableScroll.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { PAGE_SIZE, type ListPage } from '#lib/list.js';

	/**
	 * A list as a table, its search, filters, sort and page held in the URL: the server applies
	 * them, so a filtered view can be linked. Changes replace the history entry and keep focus.
	 */
	let {
		label,
		list,
		columns,
		key,
		row,
		search,
		filters = [],
		empty
	}: {
		/** Names the table and its scroll region. */
		label: string;
		list: ListPage<Row>;
		/** `sort` names the sort key of a sortable column; `numeric` aligns it to the end. */
		columns: { label: string; sort?: string; numeric?: boolean }[];
		key: (row: Row) => string | number;
		/** The cells of one row. */
		row: Snippet<[Row]>;
		/** The label of the search field; no field without it. */
		search?: string;
		filters?: { name: string; label: string; options: { value: string; label: string }[] }[];
		/** Shown in place of the table when nothing is listed. */
		empty: Snippet;
	} = $props();

	const params = $derived(page.url.searchParams);
	const sortParam = $derived(params.get('sort') ?? '');
	const searchId = $props.id();

	function show(changes: Record<string, string>) {
		const url = new URL(page.url.href);
		for (const [name, value] of Object.entries(changes)) {
			if (value) url.searchParams.set(name, value);
			else url.searchParams.delete(name);
		}
		if (!('page' in changes)) url.searchParams.delete('page');
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- this page with another query
		goto(url, { replace: true, reset: false });
	}

	// Each key typed would load the list again: only a pause of 300 ms does.
	let timer: ReturnType<typeof setTimeout> | undefined;
	function searchFor(value: string) {
		clearTimeout(timer);
		timer = setTimeout(() => show({ search: value }), 300);
	}

	// No `sort` in the URL: the first sortable column, as the server's first sort.
	const activeSort = $derived(
		sortParam.replace(/^-/, '') || columns.find((column) => column.sort)?.sort
	);
	function sortState(column: { sort?: string }): 'ascending' | 'descending' | 'none' {
		if (!column.sort || column.sort !== activeSort) return 'none';
		return sortParam.startsWith('-') ? 'descending' : 'ascending';
	}

	function sortBy(column: { sort?: string }) {
		const ascending = sortState(column) !== 'ascending';
		show({ sort: `${ascending ? '' : '-'}${column.sort}` });
	}

	const ARROWS = { ascending: '↑', descending: '↓', none: '' };

	const from = $derived((list.page - 1) * PAGE_SIZE + 1);
	const to = $derived(from + list.rows.length - 1);
	const count = (value: number) => value.toLocaleString(getLocale());
</script>

{#if search || filters.length > 0}
	<form class="tools" role="search" onsubmit={(event) => event.preventDefault()}>
		{#if search}
			<div class="field">
				<label for={searchId}>{search}</label>
				<input
					id={searchId}
					type="search"
					value={params.get('search') ?? ''}
					oninput={(event) => searchFor(event.currentTarget.value)}
				/>
			</div>
		{/if}
		{#each filters as filter (filter.name)}
			<div class="field">
				<label for="{searchId}-{filter.name}">{filter.label}</label>
				<select
					id="{searchId}-{filter.name}"
					value={params.get(filter.name) ?? ''}
					onchange={(event) => show({ [filter.name]: event.currentTarget.value })}
				>
					<option value="">{m.list_filter_all()}</option>
					{#each filter.options as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>
		{/each}
	</form>
{/if}

{#if list.total === 0}
	{@render empty()}
{:else}
	<TableScroll {label}>
		<table>
			<thead>
				<tr>
					{#each columns as column (column.label)}
						<th
							scope="col"
							class:num={column.numeric}
							aria-sort={column.sort ? sortState(column) : undefined}
						>
							{#if column.sort}
								<button class="sort" onclick={() => sortBy(column)}
									>{column.label}<span class="arrow" aria-hidden="true"
										>{ARROWS[sortState(column)]}</span
									></button
								>
							{:else}{column.label}{/if}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each list.rows as item (key(item))}
					<tr>{@render row(item)}</tr>
				{/each}
			</tbody>
		</table>
	</TableScroll>
	{#if list.pageCount > 1}
		<nav class="pages" aria-label={m.list_pages({ label })}>
			<button disabled={list.page === 1} onclick={() => show({ page: String(list.page - 1) })}
				>{m.list_previous()}</button
			>
			<span>{m.list_range({ from: count(from), to: count(to), total: count(list.total) })}</span>
			<button
				disabled={list.page === list.pageCount}
				onclick={() => show({ page: String(list.page + 1) })}>{m.list_next()}</button
			>
		</nav>
	{/if}
{/if}

<style>
	.tools {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		gap: var(--s4);
	}
	.field {
		display: grid;
		gap: var(--s1);
	}
	.field label {
		font-size: 13px;
		font-weight: 600;
	}
	input[type='search'] {
		width: 20rem;
	}
	.sort {
		display: inline-flex;
		gap: var(--s1);
		padding: 0;
		color: inherit;
		background: none;
		border: 0;
		box-shadow: none;
		font: inherit;
		min-height: 0;
	}
	.arrow {
		min-width: 1ch;
	}
	.pages {
		display: flex;
		align-items: center;
		gap: var(--s4);
		color: var(--ink-2);
		font-size: 14px;
	}
</style>
