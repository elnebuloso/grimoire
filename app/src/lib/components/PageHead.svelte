<script lang="ts">
	import type { Snippet } from 'svelte';

	/** The head of a page on the canvas: its title, a way back above it and a lead below. */
	let {
		title,
		back,
		children
	}: {
		title: string;
		/** A link back to where the page belongs, e.g. the list it is part of. */
		back?: { href: string; label: string };
		/** The lead: what the page is for, or links that belong to its subject. */
		children?: Snippet;
	} = $props();
</script>

<div>
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the caller resolves it -->
	{#if back}<a class="back" href={back.href}>{back.label}</a>{/if}
	<h1>{title}</h1>
	{#if children}<div class="lead">{@render children()}</div>{/if}
</div>

<style>
	div {
		display: grid;
		gap: var(--s2);
		padding: 0 var(--s1);
	}
	.back {
		justify-self: start;
		font-size: 14px;
	}
	.lead {
		max-width: 46rem;
		padding: 0;
		color: var(--ink-2);
	}
</style>
