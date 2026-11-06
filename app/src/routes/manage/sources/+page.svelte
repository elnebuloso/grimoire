<script lang="ts">
	import { resolve } from '$app/paths';
	import DataTable from '#lib/components/DataTable.svelte';
	import DateTime from '#lib/components/DateTime.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import SourceLabel from '#lib/components/SourceLabel.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { sourceState } from '#lib/source-state.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const count = (value: number) => value.toLocaleString(getLocale());
	const newSource = resolve('/manage/sources/[id]/[[tab=tab]]', { id: 'new' });
</script>

<PageHead title={m.sources()} />

<section class="sheet flush" aria-labelledby="sources">
	<div class="sheet-head">
		<h2 id="sources">{m.all_sources_link()}</h2>
		<!-- An empty instance offers it in the empty list instead. -->
		{#if data.sources.total > 0 || data.filtered}
			<a class="button primary" href={newSource}>{m.source_new()}</a>
		{/if}
	</div>
	<DataTable
		label={m.sources_table()}
		list={data.sources}
		key={(source) => source.id}
		search={m.list_search_sources()}
		filters={[
			{
				name: 'status',
				label: m.source_status(),
				options: [
					{ value: 'error', label: m.source_state_error() },
					{ value: 'paused', label: m.state_paused() },
					{ value: 'never', label: m.not_synced() },
					{ value: 'synced', label: m.source_history_synced() }
				]
			},
			{
				name: 'visibility',
				label: m.visibility(),
				options: [
					{ value: 'internal', label: m.visibility_internal() },
					{ value: 'public', label: m.visibility_public() }
				]
			}
		]}
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
				<SourceLabel
					name={source.name}
					slug={source.slug}
					href={resolve('/manage/sources/[id]/[[tab=tab]]', { id: String(source.id) })}
				/>
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
			<td class="num">
				{#if source.deadLinks > 0}
					<a
						href="{resolve('/manage/dead-links')}#source-{source.id}"
						aria-label={source.deadLinks === 1
							? m.admin_dead_link()
							: m.admin_dead_links({ count: source.deadLinks })}>{count(source.deadLinks)}</a
					>
				{:else}{count(source.deadLinks)}{/if}
			</td>
		{/snippet}
		{#snippet empty()}
			{#if data.filtered}
				<p class="muted">{m.list_no_match()}</p>
			{:else}
				<EmptyState text={m.no_sources_yet()} action={{ href: newSource, label: m.source_new() }} />
			{/if}
		{/snippet}
	</DataTable>
</section>

<style>
	.when {
		color: var(--ink-2);
		white-space: nowrap;
	}
</style>
