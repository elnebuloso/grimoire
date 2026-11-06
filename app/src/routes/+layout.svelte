<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import AppShell from '#lib/components/AppShell.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { dismissToast, toasts } from '#lib/toasts.svelte.js';
	import favicon from '#lib/assets/favicon.svg';
	import { areaOf } from '#lib/areas.js';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	// The pages of getting in: one task each, before anyone is logged in. The setup offers two ways.
	const AUTH_ROUTES = [
		'/login',
		'/login/forgot',
		'/login/reset/[token]',
		'/invite/[token]',
		'/auth/oidc/[key]/callback'
	];
	function authKind(route: string | null) {
		if (route === '/setup') return 'wide';
		if (AUTH_ROUTES.includes(route ?? '')) return 'card';
		return undefined;
	}
	const auth = $derived(authKind(page.route.id));
	// The error page sits in a narrow column.
	const narrow = $derived(page.error !== null);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<AppShell
	user={data.user ?? null}
	area={areaOf(page.url.pathname)}
	{auth}
	{narrow}
	theme={data.theme}
	instanceTitle={data.instanceTitle}
	version={data.version}
>
	{@render children()}
</AppShell>

<Toast items={toasts} ondismiss={dismissToast} />
