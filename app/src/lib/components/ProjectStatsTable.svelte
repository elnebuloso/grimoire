<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ProjectStats } from '#lib/server/stats.js';

	let { projects, name }: { projects: ProjectStats[]; name?: Snippet<[ProjectStats]> } = $props();
</script>

<table>
	<thead>
		<tr>
			<th scope="col">Project</th>
			<th scope="col">Sources</th>
			<th scope="col">Pages</th>
			<th scope="col">Snippets</th>
			<th scope="col">Tokens</th>
			<th scope="col">Oldest sync</th>
			<th scope="col">Sync errors</th>
			<th scope="col">Dead links</th>
		</tr>
	</thead>
	<tbody>
		{#each projects as project (project.slug)}
			<tr>
				<th scope="row">
					{#if name}{@render name(project)}{:else}{project.slug}{/if}
					{#if project.description}<br />{project.description}{/if}
				</th>
				<td>{project.sources}</td>
				<td>{project.pages}</td>
				<td>{project.snippets}</td>
				<td>{project.tokens}</td>
				<td>
					{#if project.oldestSync}
						<time datetime={project.oldestSync}>{project.oldestSync}</time>
					{:else if project.sources === 0}
						no sources
					{:else}
						not synced
					{/if}
				</td>
				<td>{project.sourcesWithError}</td>
				<td>{project.deadLinks}</td>
			</tr>
		{/each}
	</tbody>
</table>
