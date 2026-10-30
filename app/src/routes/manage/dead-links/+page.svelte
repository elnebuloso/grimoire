<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>{m.dead_links()}</h1>

{#if data.groups.length === 0}
	<p>{m.dead_links_none()}</p>
{:else}
	{#each data.groups as group (group.sourceId)}
		<h2>
			<a
				href={resolve('/manage/projects/[id]/sources/[sourceId]', {
					id: String(group.projectId),
					sourceId: String(group.sourceId)
				})}>{group.project}/{group.source}</a
			>
		</h2>
		<ul>
			{#each group.links as link, index (index)}
				<li>{link.file}{link.anchor ? `#${link.anchor}` : ''} → {link.target}</li>
			{/each}
		</ul>
	{/each}
{/if}
