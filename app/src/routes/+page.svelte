<script lang="ts">
	import QueryForm from '#lib/components/QueryForm.svelte';
	import SourceStatsTable from '#lib/components/SourceStatsTable.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<!-- The one page without a PageHead: no title on the canvas, so the tab gets its own. -->
<svelte:head><title>grimoire</title></svelte:head>

<section class="sheet flush" aria-labelledby="sources">
	<div class="sheet-head"><h1 id="sources">{m.sources()}</h1></div>
	{#if data.sources.length === 0}
		<p class="muted">{m.no_sources_yet()}</p>
	{:else}
		<SourceStatsTable sources={data.sources} timeZone={data.timeZone} />
	{/if}
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
		<pre><code
				>claude mcp add --transport http --scope user grimoire {data.origin}/mcp \
  --header "Authorization: Bearer &lt;key&gt;"</code
			></pre>
		<p>
			{m.start_connect_other()}
			<a href="https://elnebuloso.github.io/grimoire/agents/">{m.start_connect_handbook_link()}</a>
			{m.start_connect_handbook_suffix()}
		</p>
	</section>
</div>

<style>
	h1 {
		font-size: 18px;
		letter-spacing: normal;
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
