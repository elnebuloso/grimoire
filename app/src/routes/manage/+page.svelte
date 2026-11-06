<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHead from '#lib/components/PageHead.svelte';
	import DescriptionList from '#lib/components/DescriptionList.svelte';
	import AttentionList from '#lib/components/AttentionList.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PageHead title={m.admin_title({ name: data.instanceTitle })} namesInstance />

{#if data.syncsPaused}
	<p class="notice warn" role="status">
		{m.syncs_paused_notice()}
		<a href={resolve('/manage/settings')}>{m.settings_title()}</a>
	</p>
{/if}

{#snippet deadLinks()}
	<a
		href={resolve('/manage/dead-links')}
		aria-label={data.totals.deadLinks === 1
			? m.admin_dead_link()
			: m.admin_dead_links({ count: data.totals.deadLinks })}
		>{data.totals.deadLinks.toLocaleString(getLocale())}</a
	>
{/snippet}

<div class="split">
	<section class="sheet" aria-labelledby="attention">
		<h2 id="attention">{m.admin_attention()}</h2>
		{#if data.attention.length === 0}
			<p class="muted">{m.admin_all_fine()}</p>
		{:else}
			<AttentionList groups={data.attention} />
		{/if}
	</section>
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
</div>

<style>
	/* The problems lead; the totals sit beside them, and both sheets end on one line. */
	.split {
		display: grid;
		gap: var(--s5);
		align-items: start;
	}
	@media (min-width: 64rem) {
		.split {
			grid-template-columns: minmax(0, 1fr) 19rem;
			align-items: stretch;
		}
	}
</style>
