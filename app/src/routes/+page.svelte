<script lang="ts">
	import ProjectStatsTable from '#lib/components/ProjectStatsTable.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>grimoire</h1>

<p><a href="https://github.com/elnebuloso/grimoire">grimoire on GitHub</a></p>

<h2>Projects</h2>
{#if data.projects.length === 0}
	<p>No projects yet.</p>
{:else}
	<ProjectStatsTable projects={data.projects} />
{/if}

<h2>Connect an agent</h2>
<p>With Claude Code, using an API key from the admin area:</p>
<pre><code
		>claude mcp add --transport http grimoire {data.origin}/mcp \
  --header "Authorization: Bearer &lt;key&gt;"</code
	></pre>
<p>
	Other clients and the HTTP routes:
	<a href="https://elnebuloso.github.io/grimoire/agents/">Connecting agents</a> in the handbook.
</p>
