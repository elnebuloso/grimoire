<script lang="ts">
	import { resolve } from '$app/paths';
	import CopyButton from '#lib/components/CopyButton.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import QueryForm from '#lib/components/QueryForm.svelte';
	import SourceLabel from '#lib/components/SourceLabel.svelte';
	import SourceTable from '#lib/components/SourceTable.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { connectCommand } from '#lib/connect-command.js';
	import { isWebUrl } from '#lib/source-fields.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// A visitor has no key and reads the public sources without one.
	const command = $derived(connectCommand(data.origin, data.mcpName, data.user ? '<key>' : null));
</script>

<PageHead title={data.instanceTitle} namesInstance />

<section class="sheet flush" aria-labelledby="sources">
	<div class="sheet-head"><h2 id="sources">{m.sources()}</h2></div>
	<SourceTable list={data.sources} timeZone={data.timeZone}>
		{#snippet name(source)}
			<div class="source">
				<SourceLabel name={source.name} slug={source.slug} />
				{#if source.description}<span class="muted">{source.description}</span>{/if}
				{#if isWebUrl(source.docsUrl)}<a href={source.docsUrl} rel="external"
						>{m.source_docs_link()}</a
					>{/if}
			</div>
		{/snippet}
		{#snippet empty()}
			<p class="muted">{data.filtered ? m.list_no_match() : m.no_sources_yet()}</p>
		{/snippet}
	</SourceTable>
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
		{#if data.user}
			<p>
				{m.start_connect_key()}
				<a href="{resolve('/account/api-keys')}?new">{m.apikeys_welcome_action()}</a>
			</p>
		{/if}
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
