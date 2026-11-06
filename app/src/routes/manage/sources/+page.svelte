<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHead from '#lib/components/PageHead.svelte';
	import SourceStatsTable from '#lib/components/SourceStatsTable.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PageHead title={m.sources()} />

<section class="sheet flush" aria-labelledby="sources">
	<div class="sheet-head">
		<h2 id="sources">{m.all_sources_link()}</h2>
		<a class="button primary" href={resolve('/manage/sources/[id]', { id: 'new' })}
			>{m.source_new()}</a
		>
	</div>
	{#if data.sources.length === 0}
		<p class="muted">{m.no_sources_yet()}</p>
	{:else}
		<SourceStatsTable sources={data.sources} timeZone={data.timeZone}>
			{#snippet name(source)}
				<a href={resolve('/manage/sources/[id]', { id: String(source.id) })}>{source.name}</a>
			{/snippet}
			{#snippet deadLinks(source)}
				{#if source.deadLinks > 0}
					<a
						href="{resolve('/manage/dead-links')}#source-{source.id}"
						aria-label={source.deadLinks === 1
							? m.admin_dead_link()
							: m.admin_dead_links({ count: source.deadLinks })}
						>{source.deadLinks.toLocaleString(getLocale())}</a
					>
				{:else}{source.deadLinks.toLocaleString(getLocale())}{/if}
			{/snippet}
		</SourceStatsTable>
	{/if}
</section>
