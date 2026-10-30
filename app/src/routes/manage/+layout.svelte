<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const links = $derived([
		{ href: resolve('/manage'), label: m.admin_overview() },
		{ href: resolve('/manage/api-keys'), label: m.api_keys() },
		{ href: resolve('/manage/settings'), label: m.settings_title() },
		{ href: resolve('/account'), label: m.password_title() }
	]);
</script>

<nav aria-label={m.manage_nav()}>
	<ul>
		{#each links as link (link.href)}
			<li>
				<a href={link.href} aria-current={page.url.pathname === link.href ? 'page' : undefined}
					>{link.label}</a
				>
			</li>
		{/each}
	</ul>
</nav>

{@render children()}
