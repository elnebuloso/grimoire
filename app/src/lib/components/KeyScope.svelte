<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';

	/** The sources a key reads: all of them, or the first few by slug and the rest on request. */
	let { allSources, slugs }: { allSources: boolean; slugs: string[] } = $props();

	const SHOWN = 3;
	const rest = $derived(slugs.length - SHOWN);
</script>

{#if allSources}
	<span>{m.apikeys_all_sources()}</span>
{:else if rest <= 0}
	<span
		>{#each slugs as slug, index (slug)}{#if index > 0},
			{/if}<code>{slug}</code>{/each}</span
	>
{:else}
	<details>
		<summary
			>{#each slugs.slice(0, SHOWN) as slug (slug)}<code>{slug}</code>,
			{/each}{m.key_scope_more({ count: rest })}</summary
		>
		<ul>
			{#each slugs as slug (slug)}<li><code>{slug}</code></li>{/each}
		</ul>
	</details>
{/if}

<style>
	code {
		font-size: 12.5px;
	}
	ul {
		display: grid;
		gap: 2px;
		margin-top: var(--s2);
		list-style: none;
	}
</style>
