<script lang="ts">
	import '../app.css';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale, locales } from '#lib/paraglide/runtime.js';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	// Each language is named in itself, so a reader finds theirs whatever the page is in.
	const languageName = (locale: string) =>
		new Intl.DisplayNames([locale], { type: 'language' }).of(locale);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header>
	{#if data.user}
		<p>
			{m.header_logged_in_as()} <a href={resolve('/account')}>{data.user.name}</a>
			{#if data.user.mayManage}<a href={resolve('/manage')}>{m.header_manage()}</a>{/if}
		</p>
		<form method="post" action="/logout">
			<button>{m.header_log_out()}</button>
		</form>
	{:else}
		<!-- A full request: the login page loads no data, so a client-side navigation would never
		reach the server hook that sends a first visit on to the setup. -->
		<p><a href={resolve('/login')} data-sveltekit-reload>{m.header_log_in()}</a></p>
	{/if}
	<form method="post" action="/language" aria-label={m.header_language()}>
		<input type="hidden" name="redirectTo" value={page.url.pathname + page.url.search} />
		{#each locales as locale (locale)}
			<button name="locale" value={locale} lang={locale} aria-pressed={locale === getLocale()}
				>{languageName(locale)}</button
			>
		{/each}
	</form>
</header>

{@render children()}
