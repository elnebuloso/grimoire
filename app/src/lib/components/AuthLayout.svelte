<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import favicon from '#lib/assets/favicon.svg';

	/**
	 * The page type of getting in: the brand above one card in a narrow column. `wide` leaves the
	 * cards to the page, in a column twice as wide, for a page that offers two ways.
	 */
	let {
		instanceTitle,
		wide = false,
		children
	}: { instanceTitle: string; wide?: boolean; children: Snippet } = $props();
</script>

<div class="auth" class:wide>
	<a class="brand" href={resolve('/')}>
		<img src={favicon} alt="" width="40" height="40" />
		<span>{instanceTitle}</span>
	</a>
	{#if wide}
		{@render children()}
	{:else}
		<div class="sheet card">{@render children()}</div>
	{/if}
</div>

<style>
	.auth {
		display: grid;
		gap: var(--s5);
		width: 100%;
		max-width: 30rem;
		margin-inline: auto;
	}
	.auth.wide {
		max-width: 62rem;
	}
	.brand {
		display: flex;
		align-items: center;
		justify-self: center;
		gap: var(--s3);
		color: var(--ink);
		font-size: var(--fs-7);
		font-weight: 600;
		letter-spacing: -0.01em;
		text-decoration: none;
	}
	.card {
		display: grid;
		gap: var(--s4);
	}
</style>
