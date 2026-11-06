<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	interface Entry {
		/** The route that marks the entry; every route below it marks it too, unless `exact`. */
		route: string;
		exact?: boolean;
		href: string;
		label: string;
		/** What needs action, shown above zero; `describe` says what the number counts. */
		count?: number;
		describe?: (count: number) => string;
	}

	// Matched by route, not by href: on the server `resolve` gives relative hrefs, which never equal
	// the pathname, so the current item would only be marked once the page hydrates.
	const groups: { label?: string; entries: Entry[] }[] = $derived([
		{
			entries: [
				{ route: '/manage', exact: true, href: resolve('/manage'), label: m.admin_overview() }
			]
		},
		{
			label: m.manage_group_content(),
			entries: [
				{
					route: '/manage/sources',
					href: resolve('/manage/sources'),
					label: m.sources(),
					count: data.counts.failedSources,
					describe: (count) => m.manage_count_failed({ count })
				}
			]
		},
		{
			label: m.manage_group_quality(),
			entries: [
				{
					route: '/manage/dead-links',
					href: resolve('/manage/dead-links'),
					label: m.dead_links(),
					count: data.counts.deadLinks,
					describe: (count) => m.manage_count_dead_links({ count })
				},
				{
					route: '/manage/duplicates',
					href: resolve('/manage/duplicates'),
					label: m.duplicates_title(),
					count: data.counts.duplicates,
					describe: (count) => m.manage_count_pairs({ count })
				},
				{
					route: '/manage/missed-queries',
					href: resolve('/manage/missed-queries'),
					label: m.missed_title()
				}
			]
		},
		{
			label: m.manage_group_access(),
			entries: [
				{
					route: '/manage/users',
					href: resolve('/manage/users'),
					label: m.users_title(),
					count: data.counts.invitations,
					describe: (count) => m.manage_count_invitations({ count })
				},
				{ route: '/manage/api-keys', href: resolve('/manage/api-keys'), label: m.api_keys_all() }
			]
		},
		{
			label: m.manage_group_system(),
			entries: [
				{ route: '/manage/settings', href: resolve('/manage/settings'), label: m.settings_title() }
			]
		}
	]);

	function current(entry: Entry): 'page' | 'true' | undefined {
		const route = page.route.id ?? '';
		if (route === entry.route) return 'page';
		if (!entry.exact && route.startsWith(`${entry.route}/`)) return 'true';
		return undefined;
	}
</script>

<div class="area">
	<nav aria-label={m.manage_nav()}>
		{#each groups as group, index (index)}
			{#if group.label}<h2>{group.label}</h2>{/if}
			<ul>
				{#each group.entries as entry (entry.route)}
					<li>
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved in `groups` -->
						<a href={entry.href} aria-current={current(entry)}>
							{entry.label}
							{#if entry.count && entry.describe}
								<span class="count" aria-hidden="true">{entry.count}</span>
								<span class="hidden">{entry.describe(entry.count)}</span>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		{/each}
	</nav>

	<div class="content">
		{@render children()}
	</div>
</div>

<style>
	.area {
		display: grid;
		grid-template-columns: 13rem minmax(0, 1fr);
		align-items: start;
		gap: var(--s6);
	}
	nav {
		position: sticky;
		top: var(--s4);
		display: grid;
		gap: var(--s1);
	}
	h2 {
		margin: var(--s4) 0 0;
		padding-inline: var(--s3);
		color: var(--ink-2);
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	ul {
		display: grid;
		gap: 2px;
		list-style: none;
	}
	a {
		display: flex;
		align-items: center;
		gap: var(--s2);
		min-height: 34px;
		padding: 0 var(--s3);
		color: var(--ink-2);
		font-size: 14px;
		text-decoration: none;
		border-radius: var(--r-control);
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
	.count {
		margin-inline-start: auto;
		padding: 0 var(--s2);
		color: var(--ink);
		background: var(--well);
		border-radius: 999px;
		font-size: 12px;
		font-weight: 600;
	}
	/* Read by screen readers in place of the number, which alone would not say what it counts. */
	.hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	.content {
		display: grid;
		gap: var(--s5);
		min-width: 0;
	}
	.content > :global(*) {
		min-width: 0;
	}
</style>
