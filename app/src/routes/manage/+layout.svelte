<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// Matched by route, not by href: on the server `resolve` gives relative hrefs, which never equal
	// the pathname, so the current item would only be marked once the page hydrates.
	const links = $derived([
		{ route: '/manage', href: resolve('/manage'), label: m.admin_overview() },
		{ route: '/manage/query', href: resolve('/manage/query'), label: m.query_title() },
		{
			route: '/manage/missed-queries',
			href: resolve('/manage/missed-queries'),
			label: m.missed_title()
		},
		{ route: '/manage/dead-links', href: resolve('/manage/dead-links'), label: m.dead_links() },
		{ route: '/manage/api-keys', href: resolve('/manage/api-keys'), label: m.api_keys() },
		{ route: '/manage/settings', href: resolve('/manage/settings'), label: m.settings_title() },
		{ route: '/account', href: resolve('/account'), label: m.password_title() }
	]);

	// Pages reached from the overview rather than from the nav: a source.
	const OVERVIEW_CHILDREN = ['/manage/sources/[id]'];

	function current(route: string): 'page' | 'true' | undefined {
		if (page.route.id === route) return 'page';
		if (route === '/manage' && OVERVIEW_CHILDREN.includes(page.route.id ?? '')) return 'true';
		return undefined;
	}
</script>

<nav aria-label={m.manage_nav()}>
	<ul>
		{#each links as link (link.href)}
			<li class:apart={link.route === '/account'}>
				<a href={link.href} aria-current={current(link.route)}>{link.label}</a>
			</li>
		{/each}
	</ul>
</nav>

{@render children()}

<style>
	/* The segmented track of the header, larger: the spine of the area. */
	ul {
		display: flex;
		flex-wrap: wrap;
		gap: 2px;
		padding: var(--s1);
		list-style: none;
		background: var(--well);
		border-radius: var(--r-sheet);
		box-shadow: var(--sink);
	}
	.apart {
		margin-inline-start: auto;
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
	@media (max-width: 40rem) {
		.apart {
			margin-inline-start: 0;
		}
		a {
			padding: 0 var(--s3);
		}
	}
	@media (pointer: coarse) {
		a {
			min-height: 44px;
		}
	}
</style>
