<script lang="ts">
	import { resolve } from '$app/paths';
	import DeadLinkList from '#lib/components/DeadLinkList.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PageHead title={m.dead_links()} />

{#if data.groups.length === 0}
	<p class="muted">{m.dead_links_none()}</p>
{:else}
	<div class="pair">
		{#each data.groups as group (group.sourceId)}
			<section class="sheet" aria-labelledby="source-{group.sourceId}">
				<h2 id="source-{group.sourceId}">
					<a href={resolve('/manage/sources/[id]', { id: String(group.sourceId) })}
						><code>{group.source}</code></a
					>
				</h2>
				<DeadLinkList links={group.links} />
			</section>
		{/each}
	</div>
{/if}

<style>
	.pair {
		display: grid;
		gap: var(--s5);
		align-items: start;
	}
	@media (min-width: 64rem) {
		.pair {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
