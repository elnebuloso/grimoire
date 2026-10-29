<script lang="ts">
	import { resolve } from '$app/paths';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header>
	{#if data.admin}
		<p>Logged in as <a href={resolve('/admin')}>{data.admin}</a></p>
		<form method="post" action="/admin/logout">
			<button>Log out</button>
		</form>
	{:else}
		<!-- A full request: the login page loads no data, so a client-side navigation would never
		reach the server hook that sends a first visit on to the setup. -->
		<p><a href={resolve('/admin/login')} data-sveltekit-reload>Log in</a></p>
	{/if}
</header>

{@render children()}
