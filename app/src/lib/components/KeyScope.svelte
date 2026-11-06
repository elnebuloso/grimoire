<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';

	/** The sources a key reads: all of them, or the first few by slug and the rest on request. */
	let { sources }: { sources: 'all' | string[] } = $props();

	const SHOWN = 3;
	const slugs = $derived(sources === 'all' ? [] : sources);
	const rest = $derived(slugs.length - SHOWN);
</script>

{#if sources === 'all'}
	<span>{m.apikeys_all_sources()}</span>
{:else if slugs.length === 0}
	<span>{m.apikeys_no_sources()}</span>
{:else if rest <= 0}
	<!-- Spaces as expressions here and below: Svelte trims whitespace at the edges of a block. -->
	<span
		>{#each slugs as slug, index (slug)}{index > 0 ? ', ' : ''}<code>{slug}</code>{/each}</span
	>
{:else}
	<details>
		<summary
			>{#each slugs.slice(0, SHOWN) as slug, index (slug)}{index > 0 ? ', ' : ''}<code>{slug}</code
				>{/each}{`, ${m.key_scope_more({ count: rest })}`}</summary
		>
		<ul>
			{#each slugs as slug (slug)}<li><code>{slug}</code></li>{/each}
		</ul>
	</details>
{/if}

<style>
	code {
		font-size: var(--fs-2);
	}
	ul {
		display: grid;
		gap: 2px;
		margin-top: var(--s2);
		list-style: none;
	}
</style>
