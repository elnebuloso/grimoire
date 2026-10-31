<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getLocale } from '#lib/paraglide/runtime.js';

	let {
		items,
		numbers = false
	}: {
		items: [term: string, description: string | number | Snippet][];
		/** Right-aligns the values as figures, for a ledger of counts. */
		numbers?: boolean;
	} = $props();
</script>

<dl class:numbers>
	{#each items as [term, description] (term)}
		<dt>{term}</dt>
		<dd>
			{#if typeof description === 'function'}{@render description()}{:else if typeof description === 'number'}{description.toLocaleString(
					getLocale()
				)}{:else}{description}{/if}
		</dd>
	{/each}
</dl>

<style>
	dl {
		display: grid;
		grid-template-columns: max-content minmax(0, 1fr);
	}
	dt,
	dd {
		padding: var(--s2) 0;
		border-top: 1px solid var(--line);
	}
	dt:first-of-type,
	dt:first-of-type + dd {
		border-top: 0;
	}
	dt {
		padding-inline-end: var(--s5);
		color: var(--ink-2);
		font-size: 14px;
	}
	dd {
		overflow-wrap: anywhere;
	}
	.numbers dd {
		text-align: end;
		font-variant-numeric: tabular-nums;
		font-weight: 500;
	}
</style>
