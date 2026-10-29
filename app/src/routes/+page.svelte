<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>grimoire</h1>

<h2>Projects</h2>
{#if data.projects.length === 0}
	<p>No projects yet.</p>
{:else}
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
			{#each data.projects as project (project.slug)}
				<tr>
					<th scope="row">
						{project.slug}
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
{/if}
