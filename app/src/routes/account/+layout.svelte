<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// Matched by route, not by href: on the server `resolve` gives relative hrefs, which never equal
	// the pathname, so the current tab would only be marked once the page hydrates.
	const tabs = $derived([
		{ route: '/account/api-keys', href: resolve('/account/api-keys'), label: m.account_tab_keys() },
		{ route: '/account', href: resolve('/account'), label: m.user_menu_account() }
	]);
</script>

<nav aria-label={m.account_nav()}>
	{#each tabs as tab (tab.route)}
		<a href={tab.href} aria-current={page.route.id === tab.route ? 'page' : undefined}
			>{tab.label}</a
		>
	{/each}
</nav>

{@render children()}

<style>
	nav {
		display: flex;
		justify-self: start;
		gap: 2px;
		padding: var(--s1);
		background: var(--well);
		border-radius: var(--r-sheet);
		box-shadow: var(--sink);
	}
	a {
		display: flex;
		align-items: center;
		min-height: 38px;
		padding: 0 var(--s4);
		color: var(--ink-2);
		font-size: 14px;
		text-decoration: none;
		border-radius: 9px;
		transition:
			color var(--t),
			background-color var(--t),
			box-shadow var(--t);
	}
	a:hover {
		color: var(--ink);
	}
	a[aria-current] {
		color: var(--ink);
		background: var(--raised);
		box-shadow: var(--lift-raised);
		font-weight: 500;
	}
</style>
