<script lang="ts">
	import { resolve } from '$app/paths';
	import DescriptionList from '#lib/components/DescriptionList.svelte';
	import ProjectStatsTable from '#lib/components/ProjectStatsTable.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>grimoire admin</h1>

<p>
	<a href={resolve('/admin/api-keys')}>API keys</a>
	<a href={resolve('/admin/password')}>Change the password</a>
</p>

<h2>Overview</h2>
<DescriptionList
	items={[
		['Projects', data.totals.projects],
		['Sources', data.totals.sources],
		['Pages', data.totals.pages],
		['Snippets', data.totals.snippets],
		['Tokens', data.totals.tokens],
		['Dead links', data.totals.deadLinks],
		['API keys', data.totals.apiKeys]
	]}
/>

<h2>Needs attention</h2>
{#if data.attention.length === 0}
	<p>Every source is synced without errors or warnings.</p>
{:else}
	<ul>
		{#each data.attention as item (item.sourceId)}
			<li>
				<a
					href={resolve('/admin/projects/[id]/sources/[sourceId]', {
						id: String(item.projectId),
						sourceId: String(item.sourceId)
					})}>{item.project}/{item.source}</a
				>
				{#if item.neverSynced}– never synced{/if}
				{#if item.error}– sync error: {item.error}{/if}
				{#if item.warnings.length > 0}
					– {item.warnings.length} sync warning{item.warnings.length === 1 ? '' : 's'}:
					<ul>
						{#each item.warnings as warning, index (index)}<li>{warning}</li>{/each}
					</ul>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<h2>Projects</h2>
{#if data.projects.length === 0}
	<p>No projects yet.</p>
{:else}
	<ProjectStatsTable projects={data.projects}>
		{#snippet name(project)}
			<a href={resolve('/admin/projects/[id]', { id: String(project.id) })}>{project.slug}</a>
		{/snippet}
	</ProjectStatsTable>
{/if}
<p><a href={resolve('/admin/projects/[id]', { id: 'new' })}>New project</a></p>
