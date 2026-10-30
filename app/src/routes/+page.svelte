<script lang="ts">
	import QueryForm from '#lib/components/QueryForm.svelte';
	import SourceStatsTable from '#lib/components/SourceStatsTable.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>grimoire</h1>

<p><a href="https://github.com/elnebuloso/grimoire">{m.start_github_link()}</a></p>

<h2>{m.sources()}</h2>
{#if data.sources.length === 0}
	<p>{m.no_sources_yet()}</p>
{:else}
	<SourceStatsTable sources={data.sources} timeZone={data.timeZone} />
{/if}

{#if data.query}
	<h2>{m.query_title()}</h2>
	<p>{m.start_query_intro()}</p>
	<QueryForm {...data.query} />
{/if}

<h2>{m.start_connect_heading()}</h2>
<p>{m.start_connect_intro()}</p>
<pre><code
		>claude mcp add --transport http grimoire {data.origin}/mcp \
  --header "Authorization: Bearer &lt;key&gt;"</code
	></pre>
<p>
	{m.start_connect_other()}
	<a href="https://elnebuloso.github.io/grimoire/agents/">{m.start_connect_handbook_link()}</a>
	{m.start_connect_handbook_suffix()}
</p>
