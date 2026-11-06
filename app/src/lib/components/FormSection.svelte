<script lang="ts">
	import type { Snippet } from 'svelte';

	/** One part of a long form: a sheet with a heading, a sentence on what it is for, the fields. */
	let { title, lead, children }: { title: string; lead?: string; children: Snippet } = $props();

	const headingId = $props.id();
</script>

<section class="sheet" aria-labelledby={headingId}>
	<div class="head">
		<h2 id={headingId}>{title}</h2>
		{#if lead}<p class="muted">{lead}</p>{/if}
	</div>
	{@render children()}
</section>

<style>
	section {
		display: grid;
		gap: var(--s4);
	}
	.head {
		display: grid;
		gap: var(--s1);
	}
	p {
		max-width: 60ch;
	}
</style>
