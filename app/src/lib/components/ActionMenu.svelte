<script lang="ts">
	import type { Snippet } from 'svelte';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import { placeBelow } from '#lib/popover.js';

	/**
	 * The rare and destructive actions of one row, behind a button. A native popover: Escape and a
	 * click beside it close it and focus returns to the button. `children` are the actions, such as
	 * `ConfirmAction`s, one below the other.
	 */
	let { label, children }: { label: string; children: Snippet } = $props();

	const menuId = $props.id();
	let button = $state<HTMLButtonElement>();
	let menu = $state<HTMLElement>();
</script>

<button bind:this={button} class="trigger" popovertarget={menuId} aria-label={label}>
	<Ellipsis size={18} aria-hidden="true" />
</button>

<!-- The confirmation an action opens lives inside the menu, which hides it once closed: the menu
stays open behind it and closes with it. `close` does not bubble, hence the capture. -->
<div
	bind:this={menu}
	id={menuId}
	class="menu"
	popover="auto"
	onbeforetoggle={(event) => placeBelow(event, button, menu, 4)}
	onclosecapture={() => menu?.hidePopover()}
>
	{@render children()}
</div>

<style>
	.trigger {
		display: inline-flex;
		align-items: center;
		min-height: 34px;
		padding-inline: var(--s2);
	}
	.menu {
		position: absolute;
		text-align: start;
		inset: auto;
		margin: 0;
		display: none;
		gap: var(--s2);
		width: max-content;
		padding: var(--s3);
		color: var(--ink);
		background: var(--sheet);
		border: 1px solid var(--line);
		border-radius: var(--r-sheet);
		box-shadow: var(--lift-sheet);
	}
	.menu:popover-open {
		display: grid;
	}
	/* Every action as wide as the menu, so they read as one list; not the buttons of its dialogs. */
	.menu > :global(form) > :global(button) {
		width: 100%;
		text-align: start;
	}
</style>
