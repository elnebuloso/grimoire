<script module lang="ts">
	import type { Visibility } from '#lib/source-fields.js';

	/** What the table shows of a source. */
	export interface SourceRow {
		id: number;
		visibility: Visibility;
		pages: number;
		snippets: number;
		tokens: number;
		lastSync: string | null;
		lastCheck: string | null;
		error: boolean;
		paused: boolean;
		deadLinks: number;
	}
</script>

<script lang="ts" generics="Row extends SourceRow">
	import type { Snippet } from 'svelte';
	import DataTable from './DataTable.svelte';
	import DateTime from './DateTime.svelte';
	import StatusBadge, { WORDS } from './StatusBadge.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type { ListPage } from '#lib/list.js';
	import { VISIBILITIES } from '#lib/source-fields.js';
	import { SOURCE_FILTERS, sourceState } from '#lib/source-state.js';
	import { VISIBILITY_LABEL } from '#lib/visibility-label.js';

	/** The sources as a table with their state, searched, filtered and sorted by the server. */
	let {
		list,
		timeZone,
		name,
		deadLinksHref,
		empty
	}: {
		list: ListPage<Row>;
		timeZone: string;
		/** The first cell of a row: the source's name. */
		name: Snippet<[Row]>;
		/** Where the count of dead links leads; a plain count without it. */
		deadLinksHref?: (source: Row) => string;
		/** Shown in place of the table when nothing is listed. */
		empty: Snippet;
	} = $props();

	const count = (value: number) => value.toLocaleString(getLocale());

	const WARNING_LABELS: Record<(typeof SOURCE_FILTERS.warnings)[number], () => string> = {
		yes: m.source_filter_warnings_yes,
		no: m.source_filter_warnings_no
	};
</script>

<DataTable
	label={m.sources_table()}
	{list}
	key={(source) => source.id}
	search={m.list_search_sources()}
	filters={[
		{
			name: 'status',
			label: m.source_status(),
			options: SOURCE_FILTERS.status.map((value) => ({ value, label: WORDS[value]() }))
		},
		{
			name: 'visibility',
			label: m.visibility(),
			options: VISIBILITIES.map((value) => ({ value, label: VISIBILITY_LABEL[value]() }))
		},
		{
			name: 'warnings',
			label: m.source_warnings(),
			options: SOURCE_FILTERS.warnings.map((value) => ({
				value,
				label: WARNING_LABELS[value]()
			}))
		}
	]}
	columns={[
		{ label: m.source(), sort: 'name' },
		{ label: m.visibility() },
		{ label: m.pages(), numeric: true },
		{ label: m.snippets(), numeric: true },
		{ label: m.tokens(), numeric: true },
		{ label: m.source_status(), sort: 'status' },
		{ label: m.last_check_in_zone({ zone: timeZone }), sort: 'checked' },
		{ label: m.dead_links(), numeric: true }
	]}
	{empty}
>
	{#snippet row(source)}
		<th scope="row">{@render name(source)}</th>
		<td>{VISIBILITY_LABEL[source.visibility]()}</td>
		<td class="num">{count(source.pages)}</td>
		<td class="num">{count(source.snippets)}</td>
		<td class="num">{count(source.tokens)}</td>
		<td><StatusBadge state={sourceState(source)} /></td>
		<td class="when">
			{#if source.lastCheck}
				<DateTime value={source.lastCheck} {timeZone} short />
			{:else}
				{m.never()}
			{/if}
		</td>
		<td class="num">
			{#if deadLinksHref && source.deadLinks > 0}
				{@const label =
					source.deadLinks === 1
						? m.admin_dead_link()
						: m.admin_dead_links({ count: source.deadLinks })}
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the caller resolves it -->
				<a href={deadLinksHref(source)} aria-label={label}>{count(source.deadLinks)}</a>
			{:else}{count(source.deadLinks)}{/if}
		</td>
	{/snippet}
</DataTable>

<style>
	.when {
		color: var(--ink-2);
		white-space: nowrap;
	}
</style>
