<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHead from '#lib/components/PageHead.svelte';
	import DataTable from '#lib/components/DataTable.svelte';
	import DateTime from '#lib/components/DateTime.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// The start page searches everything the admin may read; the sources asked for narrow nothing.
	const tryQuery = (question: string) => new URLSearchParams({ q: question }).toString();
</script>

<PageHead title={m.missed_title()}><p>{m.missed_intro()}</p></PageHead>

<section class="sheet flush" aria-label={m.missed_title()}>
	<DataTable
		label={m.missed_title()}
		list={data.queries}
		key={(query) => `${query.sources}\n${query.question}`}
		search={m.missed_search()}
		columns={[
			{ label: m.query_question(), sort: 'question' },
			{ label: m.sources() },
			{ label: m.missed_unknown_words() },
			{ label: m.missed_count(), sort: 'count', numeric: true },
			{ label: m.missed_last_asked(), sort: 'asked' }
		]}
	>
		{#snippet row(query)}
			<td>
				<a href="{resolve('/')}?{tryQuery(query.question)}#query">{query.question}</a>
			</td>
			<td>
				{#if query.sources}<code>{query.sources.join(', ')}</code
					>{:else}{m.query_all_sources()}{/if}
			</td>
			<td>
				{#if query.unknownWords}<code>{query.unknownWords.join(', ')}</code>{:else}<span
						class="muted">{m.missed_nothing_found()}</span
					>{/if}
			</td>
			<td class="num">{query.count}</td>
			<td class="when"><DateTime value={query.lastAskedAt} timeZone={data.timeZone} /></td>
		{/snippet}
		{#snippet empty()}<p class="muted">
				{data.filtered ? m.list_no_match() : m.missed_none()}
			</p>{/snippet}
	</DataTable>
</section>

<style>
	.when {
		color: var(--ink-2);
		white-space: nowrap;
	}
</style>
