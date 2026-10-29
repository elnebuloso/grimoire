<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { Snippet } from 'svelte';
	import type { ProjectStats } from '#lib/server/stats.js';

	let { projects, name }: { projects: ProjectStats[]; name?: Snippet<[ProjectStats]> } = $props();
</script>

<table>
	<thead>
		<tr>
			<th scope="col">{m.project()}</th>
			<th scope="col">{m.sources()}</th>
			<th scope="col">{m.pages()}</th>
			<th scope="col">{m.snippets()}</th>
			<th scope="col">{m.tokens()}</th>
			<th scope="col">{m.oldest_sync()}</th>
			<th scope="col">{m.sync_errors()}</th>
			<th scope="col">{m.dead_links()}</th>
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
						{m.no_sources()}
					{:else}
						{m.not_synced()}
					{/if}
				</td>
				<td>{project.sourcesWithError}</td>
				<td>{project.deadLinks}</td>
			</tr>
		{/each}
	</tbody>
</table>
