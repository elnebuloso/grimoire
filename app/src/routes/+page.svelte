<script lang="ts">
	import ProjectStatsTable from '#lib/components/ProjectStatsTable.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>grimoire</h1>

<p><a href="https://github.com/elnebuloso/grimoire">{m.start_github_link()}</a></p>

<h2>{m.projects()}</h2>
{#if data.projects.length === 0}
	<p>{m.start_no_projects()}</p>
{:else}
	<ProjectStatsTable projects={data.projects} />
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
