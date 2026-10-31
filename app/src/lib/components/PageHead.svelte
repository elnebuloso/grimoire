<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';

	/**
	 * The head of a page on the canvas: its title, a way back above it and a lead below. Every page
	 * renders one, so it also gives the browser tab its title.
	 */
	let {
		title,
		documentTitle = title,
		namesInstance = false,
		back,
		children
	}: {
		title: string;
		/** What the browser tab names, where it differs from the heading. */
		documentTitle?: string;
		/** The title names the instance already, such as "Log in to grimoire": the tab shows it as is. */
		namesInstance?: boolean;
		/** A link back to where the page belongs, e.g. the list it is part of. */
		back?: { href: string; label: string };
		/** The lead: what the page is for, or links that belong to its subject. */
		children?: Snippet;
	} = $props();
</script>

<svelte:head>
	<title
		>{namesInstance
			? documentTitle
			: m.document_title({ page: documentTitle, name: page.data.instanceName })}</title
	>
</svelte:head>

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
	/* A reading measure, not a layout width: 60ch of this face is about 78 characters, a line
	longer is hard to follow back to the next one. */
	.lead {
		max-width: 60ch;
		text-wrap: pretty;
		padding: 0;
		color: var(--ink-2);
	}
</style>
