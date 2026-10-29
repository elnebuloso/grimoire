<script lang="ts">
	import type { Snippet } from 'svelte';

	let { items }: { items: [term: string, description: string | number | Snippet][] } = $props();
</script>

<dl>
	{#each items as [term, description] (term)}
		<dt>{term}</dt>
		<dd>
			{#if typeof description === 'function'}{@render description()}{:else}{description}{/if}
		</dd>
	{/each}
</dl>
