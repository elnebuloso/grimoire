<script lang="ts">
	import { onDestroy } from 'svelte';
	import X from '@lucide/svelte/icons/x';
	import { m } from '#lib/paraglide/messages.js';
	import type { ToastItem } from '#lib/toasts.svelte.js';

	/**
	 * The stack of success messages, fixed in a corner, the newest on top. Each one goes away after
	 * `duration` milliseconds unless the pointer rests on it, or at once with its close button.
	 */
	let {
		items,
		ondismiss,
		duration = 5000
	}: {
		items: ToastItem[];
		ondismiss: (id: number) => void;
		duration?: number;
	} = $props();

	// Not state: nothing on screen depends on the timers.
	const timers: Record<number, ReturnType<typeof setTimeout>> = {};

	function start(id: number) {
		stop(id);
		timers[id] = setTimeout(() => ondismiss(id), duration);
	}

	function stop(id: number) {
		clearTimeout(timers[id]);
		delete timers[id];
	}

	$effect(() => {
		for (const item of items) if (!(item.id in timers)) start(item.id);
	});

	onDestroy(() => {
		for (const timer of Object.values(timers)) clearTimeout(timer);
	});
</script>

<!-- Present while empty: a live region announces only what is added to one already in the page. -->
<div role="status" aria-label={m.toast_region()}>
	<ol>
		{#each items as item (item.id)}
			<li onpointerenter={() => stop(item.id)} onpointerleave={() => start(item.id)}>
				<span>{item.message}</span>
				<button
					class="close"
					aria-label={m.toast_close()}
					onclick={() => {
						stop(item.id);
						ondismiss(item.id);
					}}><X size={16} aria-hidden="true" /></button
				>
			</li>
		{/each}
	</ol>
</div>

<style>
	ol {
		position: fixed;
		inset-block-end: var(--s5);
		inset-inline-end: var(--s5);
		z-index: 10;
		display: grid;
		gap: var(--s2);
		width: min(24rem, calc(100vw - 2 * var(--s4)));
		list-style: none;
		pointer-events: none;
	}
	li {
		display: flex;
		align-items: center;
		gap: var(--s3);
		padding: var(--s3) var(--s3) var(--s3) var(--s4);
		color: var(--ink);
		background: var(--raised);
		border: 1px solid var(--line);
		border-inline-start: 4px solid var(--ok);
		border-radius: var(--r-control);
		box-shadow: var(--lift-sheet);
		pointer-events: auto;
	}
	span {
		flex: 1;
	}
	.close {
		display: grid;
		place-items: center;
		min-height: 32px;
		margin: 0;
		padding: 0 var(--s2);
		color: var(--ink-2);
		background: transparent;
		border: 0;
		box-shadow: none;
	}
	.close:hover {
		color: var(--ink);
	}
</style>
