<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const links = $derived([
		{ href: resolve('/manage'), label: m.admin_overview() },
		{ href: resolve('/manage/query'), label: m.query_title() },
		{ href: resolve('/manage/missed-queries'), label: m.missed_title() },
		{ href: resolve('/manage/api-keys'), label: m.api_keys() },
		{ href: resolve('/manage/settings'), label: m.settings_title() },
		{ href: resolve('/account'), label: m.password_title() }
	]);
</script>

<nav aria-label={m.manage_nav()}>
	<ul>
		{#each links as link (link.href)}
			<li class:apart={link.href === resolve('/account')}>
				<a href={link.href} aria-current={page.url.pathname === link.href ? 'page' : undefined}
					>{link.label}</a
				>
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
	a[aria-current='page'] {
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
