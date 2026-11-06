<script lang="ts">
	import { resolve } from '$app/paths';
	import CircleUserRound from '@lucide/svelte/icons/circle-user-round';
	import Preferences from './Preferences.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { Theme } from '#lib/theme.js';

	/**
	 * The logged-in user's menu: their address, language, theme and log out. A native popover, so
	 * Escape and a click beside it close it and focus returns to the button.
	 */
	let { email, theme }: { email: string; theme: Theme | 'system' } = $props();

	const menuId = $props.id();
	let button = $state<HTMLButtonElement>();
	let menu = $state<HTMLElement>();

	// A popover sits in the top layer, away from its button: place it below the button's end edge,
	// in page coordinates so it scrolls with the page.
	function place(event: ToggleEvent) {
		if (event.newState !== 'open' || !button || !menu) return;
		const rect = button.getBoundingClientRect();
		menu.style.top = `${rect.bottom + window.scrollY + 6}px`;
		menu.style.right = `${document.documentElement.clientWidth - rect.right - window.scrollX}px`;
	}
</script>

<button bind:this={button} class="trigger" popovertarget={menuId}>
	<CircleUserRound size={18} aria-hidden="true" />
	<span class="email">{email}</span>
</button>

<div bind:this={menu} id={menuId} class="menu" popover="auto" onbeforetoggle={place}>
	<p class="muted">{m.header_logged_in_as()}</p>
	<h2>{email}</h2>
	<Preferences {theme} />
	<!-- A link inside the menu is no click beside it: close the menu for the page it opens. -->
	<a href={resolve('/account')} onclick={() => menu?.hidePopover()}>{m.user_menu_account()}</a>
	<!-- Not enhanced: logging out leads to the login page, a plain form page. -->
	<form method="post" action="/logout">
		<button>{m.header_log_out()}</button>
	</form>
</div>

<style>
	.trigger {
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		max-width: 20rem;
		min-height: 34px;
		font-size: var(--fs-5);
	}
	.email {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.menu {
		position: absolute;
		inset: auto;
		margin: 0;
		display: none;
		gap: var(--s3);
		width: max-content;
		max-width: 28rem;
		padding: var(--s4);
		color: var(--ink);
		background: var(--sheet);
		border: 1px solid var(--line);
		border-radius: var(--r-sheet);
		box-shadow: var(--lift-sheet);
	}
	.menu:popover-open {
		display: grid;
	}
	p,
	h2 {
		margin: 0;
	}
	p {
		font-size: var(--fs-1);
	}
	h2 {
		overflow-wrap: anywhere;
		font-size: var(--fs-6);
	}
	a,
	form {
		justify-self: start;
	}
	a {
		font-size: var(--fs-5);
	}
</style>
