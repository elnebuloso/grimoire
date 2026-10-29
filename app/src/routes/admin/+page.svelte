<script lang="ts">
	import { resolve } from '$app/paths';
	import DescriptionList from '#lib/components/DescriptionList.svelte';
	import ProjectStatsTable from '#lib/components/ProjectStatsTable.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>{m.admin_title()}</h1>

<p>
	<a href={resolve('/admin/api-keys')}>{m.api_keys()}</a>
	<a href={resolve('/admin/password')}>{m.password_title()}</a>
</p>

<h2>{m.admin_overview()}</h2>
<DescriptionList
	items={[
		[m.projects(), data.totals.projects],
		[m.sources(), data.totals.sources],
		[m.pages(), data.totals.pages],
		[m.snippets(), data.totals.snippets],
		[m.tokens(), data.totals.tokens],
		[m.dead_links(), data.totals.deadLinks],
		[m.api_keys(), data.totals.apiKeys]
	]}
/>

<h2>{m.admin_attention()}</h2>
{#if data.attention.length === 0}
	<p>{m.admin_all_fine()}</p>
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
				{#if item.neverSynced}– {m.admin_never_synced()}{/if}
				{#if item.error}– {m.admin_sync_error({ error: item.error })}{/if}
				{#if item.warnings.length > 0}
					– {item.warnings.length === 1
						? m.admin_sync_warning()
						: m.admin_sync_warnings({ count: item.warnings.length })}
					<ul>
						{#each item.warnings as warning, index (index)}<li>{warning}</li>{/each}
					</ul>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<h2>{m.projects()}</h2>
{#if data.projects.length === 0}
	<p>{m.start_no_projects()}</p>
{:else}
	<ProjectStatsTable projects={data.projects}>
		{#snippet name(project)}
			<a href={resolve('/admin/projects/[id]', { id: String(project.id) })}>{project.name}</a>
		{/snippet}
	</ProjectStatsTable>
{/if}
<p><a href={resolve('/admin/projects/[id]', { id: 'new' })}>{m.admin_new_project()}</a></p>
