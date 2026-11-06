<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import type { Area } from '#lib/areas.js';

	/** The areas a logged-in user may enter, the current one marked. */
	let { current, mayManage }: { current: Area; mayManage: boolean } = $props();

	const areas = $derived([
		{ area: 'start', href: resolve('/'), label: m.area_start() },
		{ area: 'account', href: resolve('/account/api-keys'), label: m.area_account() },
		...(mayManage ? [{ area: 'manage', href: resolve('/manage'), label: m.area_manage() }] : [])
	]);
</script>

<nav aria-label={m.area_nav()}>
	{#each areas as { area, href, label } (area)}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved above -->
		<a {href} aria-current={area === current ? 'true' : undefined}>{label}</a>
	{/each}
</nav>

<style>
	nav {
		display: flex;
		gap: 2px;
		padding: 3px;
		background: var(--well);
		border-radius: var(--r-control);
		box-shadow: var(--sink);
	}
	a {
		display: inline-flex;
		align-items: center;
		min-height: 32px;
		padding: 0 var(--s3);
		color: var(--ink-2);
		border-radius: var(--r-small);
		font-size: var(--fs-5);
		text-decoration: none;
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
