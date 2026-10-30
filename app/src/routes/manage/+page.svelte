<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHead from '#lib/components/PageHead.svelte';
	import DescriptionList from '#lib/components/DescriptionList.svelte';
	import SourceStatsTable from '#lib/components/SourceStatsTable.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PageHead title={m.admin_title({ name: data.instanceName })} namesInstance />

{#if data.syncsPaused}
	<p class="notice warn" role="status">
		{m.syncs_paused_notice()} <a href={resolve('/manage/settings')}>{m.settings_title()}</a>
	</p>
{/if}

{#snippet deadLinks()}
	<a href={resolve('/manage/dead-links')}>{data.totals.deadLinks}</a>
{/snippet}

<div class="split">
	<section class="sheet" aria-labelledby="overview">
		<h2 id="overview">{m.admin_overview()}</h2>
		<DescriptionList
			numbers
			items={[
				[m.sources(), data.totals.sources],
				[m.pages(), data.totals.pages],
				[m.snippets(), data.totals.snippets],
				[m.tokens(), data.totals.tokens],
				[m.dead_links(), deadLinks],
				[m.api_keys(), data.totals.apiKeys]
			]}
		/>
	</section>

	<section class="sheet" aria-labelledby="attention">
		<h2 id="attention">{m.admin_attention()}</h2>
		{#if data.attention.length === 0}
			<p class="muted">{m.admin_all_fine()}</p>
		{:else}
			<ul class="attention">
				{#each data.attention as item (item.sourceId)}
					<li class:error={item.error}>
						<a href={resolve('/manage/sources/[id]', { id: String(item.sourceId) })}
							>{item.source}</a
						>
						{#if item.neverSynced}– {m.admin_never_synced()}{/if}
						{#if item.error}– {m.admin_sync_error({ error: item.error })}{/if}
						{#if item.warnings.length > 0}
							– {item.warnings.length === 1
								? m.admin_sync_warning()
								: m.admin_sync_warnings({ count: item.warnings.length })}
							<ul>
								{#each item.warnings as warning, index (index)}<li>
										<code>{warning}</code>
									</li>{/each}
							</ul>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

<section class="sheet flush" aria-labelledby="sources">
	<div class="sheet-head">
		<h2 id="sources">{m.sources()}</h2>
		<a href={resolve('/manage/sources/[id]', { id: 'new' })}>{m.source_new()}</a>
	</div>
	{#if data.sources.length === 0}
		<p class="muted">{m.no_sources_yet()}</p>
	{:else}
		<SourceStatsTable sources={data.sources} timeZone={data.timeZone}>
			{#snippet name(source)}
				<a href={resolve('/manage/sources/[id]', { id: String(source.id) })}>{source.name}</a>
			{/snippet}
		</SourceStatsTable>
	{/if}
</section>

<style>
	.split {
		display: grid;
		gap: var(--s5);
		align-items: start;
	}
	@media (min-width: 64rem) {
		.split {
			grid-template-columns: 19rem minmax(0, 1fr);
		}
	}
	.attention {
		display: grid;
		gap: var(--s2);
		list-style: none;
	}
	.attention > li {
		padding: var(--s2) 0 var(--s2) var(--s4);
		border-inline-start: 3px solid var(--warn);
		overflow-wrap: anywhere;
	}
	.attention > li.error {
		border-color: var(--err);
	}
	.attention > li > a {
		font-family: var(--mono);
		font-size: 14px;
		font-weight: 500;
	}
	/* Warnings of a source: one step quieter than the source they belong to. */
	.attention ul {
		display: grid;
		gap: var(--s1);
		margin-top: var(--s2);
		list-style: none;
	}
	.attention ul li {
		padding-inline-start: var(--s3);
		border-inline-start: 1px solid var(--line);
		color: var(--ink-2);
	}
	.attention code {
		font-size: 13px;
	}
</style>
