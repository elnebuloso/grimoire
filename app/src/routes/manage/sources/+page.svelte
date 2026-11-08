<script lang="ts">
	import { resolve } from '$app/paths';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import SourceLabel from '#lib/components/SourceLabel.svelte';
	import SourceTable from '#lib/components/SourceTable.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

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
	<SourceTable
		list={data.sources}
		timeZone={data.timeZone}
		deadLinksHref={(source) => `${resolve('/manage/dead-links')}#source-${source.id}`}
	>
		{#snippet name(source)}
			<SourceLabel
				name={source.name}
				slug={source.slug}
				href={resolve('/manage/sources/[id]/[[tab=tab]]', { id: String(source.id) })}
			/>
		{/snippet}
		{#snippet empty()}
			{#if data.filtered}
				<p class="muted">{m.list_no_match()}</p>
			{:else}
				<EmptyState text={m.no_sources_yet()} action={{ href: newSource, label: m.source_new() }} />
			{/if}
		{/snippet}
	</SourceTable>
</section>
