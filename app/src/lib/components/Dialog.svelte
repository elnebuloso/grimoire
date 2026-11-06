<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * A modal dialog over the page. It closes with Escape, a click beside it, or by setting `open`
	 * to false; the page behind cannot be used meanwhile.
	 */
	let {
		open = $bindable(false),
		title,
		children,
		actions
	}: {
		open?: boolean;
		title: string;
		children?: Snippet;
		/** The buttons at the end, e.g. cancel and confirm. */
		actions?: Snippet;
	} = $props();

	let dialog = $state<HTMLDialogElement>();
	const titleId = $props.id();
	// A press in a field released over the backdrop also clicks the dialog element, the nearest
	// element both share: only a press that started on the backdrop closes it.
	let pressedOnBackdrop = false;

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});
</script>

<dialog
	bind:this={dialog}
	aria-labelledby={titleId}
	onclose={() => (open = false)}
	onpointerdown={(event) => (pressedOnBackdrop = event.target === dialog)}
	onclick={(event) => {
		// Only the backdrop is the dialog element itself; its content is inside the box.
		if (event.target === dialog && pressedOnBackdrop) open = false;
	}}
>
	<div class="box">
		<h2 id={titleId}>{title}</h2>
		{@render children?.()}
		{#if actions}<div class="actions">{@render actions()}</div>{/if}
	</div>
</dialog>

<style>
	dialog {
		width: min(32rem, calc(100vw - 2 * var(--s4)));
		max-height: calc(100dvh - 2 * var(--s4));
		padding: 0;
		color: var(--ink);
		background: var(--sheet);
		border: 1px solid var(--line);
		border-radius: var(--r-sheet);
		box-shadow: var(--lift-sheet);
	}
	dialog::backdrop {
		background: var(--shade-deep);
	}
	.box {
		display: grid;
		gap: var(--s4);
		padding: var(--s5);
	}
	h2 {
		margin: 0;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--s2);
	}
</style>
