<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import TabNav from '#lib/components/TabNav.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// Matched by route, not by href: on the server `resolve` gives relative hrefs, which never equal
	// the pathname, so the current tab would only be marked once the page hydrates.
	const tabs = $derived([
		{
			href: resolve('/account/api-keys'),
			label: m.account_tab_keys(),
			current: page.route.id === '/account/api-keys'
		},
		{
			href: resolve('/account'),
			label: m.user_menu_account(),
			current: page.route.id === '/account'
		}
	]);
</script>

<TabNav label={m.account_nav()} {tabs} />

{@render children()}
