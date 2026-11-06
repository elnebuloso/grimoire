<script lang="ts">
	import CopyButton from '#lib/components/CopyButton.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import QueryForm from '#lib/components/QueryForm.svelte';
	import DataTable from '#lib/components/DataTable.svelte';
	import DateTime from '#lib/components/DateTime.svelte';
	import SourceLabel from '#lib/components/SourceLabel.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { sourceState } from '#lib/source-state.js';
	import { connectCommand } from '#lib/connect-command.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const count = (value: number) => value.toLocaleString(getLocale());

	// A visitor has no key and reads the public sources without one.
	const command = $derived(connectCommand(data.origin, data.mcpName, data.user ? '<key>' : null));
</script>

<PageHead title={data.instanceTitle} namesInstance />

<section class="sheet flush" aria-labelledby="sources">
	<div class="sheet-head"><h2 id="sources">{m.sources()}</h2></div>
	<DataTable
		label={m.sources_table()}
		list={data.sources}
		key={(source) => source.id}
		search={data.sources.total > 0 || data.filtered ? m.list_search_sources() : undefined}
		columns={[
			{ label: m.source(), sort: 'name' },
			{ label: m.visibility() },
			{ label: m.pages(), numeric: true },
			{ label: m.snippets(), numeric: true },
			{ label: m.tokens(), numeric: true },
			{ label: m.source_status(), sort: 'status' },
			{ label: m.last_check_in_zone({ zone: data.timeZone }), sort: 'checked' },
			{ label: m.dead_links(), numeric: true }
		]}
	>
		{#snippet row(source)}
			<th scope="row">
				<div class="source">
					<SourceLabel name={source.name} slug={source.slug} />
					{#if source.description}<span class="muted">{source.description}</span>{/if}
					{#if source.docsUrl}<a href={source.docsUrl} rel="external">{m.source_docs_link()}</a
						>{/if}
				</div>
			</th>
			<td>{source.visibility === 'public' ? m.visibility_public() : m.visibility_internal()}</td>
			<td class="num">{count(source.pages)}</td>
			<td class="num">{count(source.snippets)}</td>
			<td class="num">{count(source.tokens)}</td>
			<td><StatusBadge state={sourceState(source)} /></td>
			<td class="when">
				{#if source.lastCheck}
					<DateTime value={source.lastCheck} timeZone={data.timeZone} short />
				{:else}
					{m.never()}
				{/if}
			</td>
			<td class="num">{count(source.deadLinks)}</td>
		{/snippet}
		{#snippet empty()}
			<p class="muted">{data.filtered ? m.list_no_match() : m.no_sources_yet()}</p>
		{/snippet}
	</DataTable>
</section>

<div class="pair">
	{#if data.query}
		<section class="sheet" aria-labelledby="query">
			<h2 id="query">{m.query_title()}</h2>
			<p class="muted">{m.start_query_intro()}</p>
			<QueryForm {...data.query} />
		</section>
	{/if}

	<section class="sheet" aria-labelledby="connect">
		<h2 id="connect">{m.start_connect_heading()}</h2>
		<p>{m.start_connect_intro()}</p>
		<pre><code>{command}</code></pre>
		<div><CopyButton value={command} label={m.start_connect_copy()} /></div>
		<p>
			{m.start_connect_other()}
			<a href="https://elnebuloso.github.io/grimoire/agents/">{m.start_connect_handbook_link()}</a>
			{m.start_connect_handbook_suffix()}
		</p>
	</section>
</div>

<style>
	.source {
		display: grid;
		gap: 2px;
		min-width: 12rem;
	}
	.when {
		color: var(--ink-2);
		white-space: nowrap;
	}
	.pair {
		display: grid;
		gap: var(--s5);
		align-items: start;
	}
	@media (min-width: 64rem) {
		.pair {
			grid-auto-flow: column;
			grid-auto-columns: minmax(0, 1fr);
		}
	}
</style>
