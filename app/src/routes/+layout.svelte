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

	// Pages with a single form, and the error page, sit in a narrow column.
	const NARROW_ROUTES = ['/setup', '/login', '/login/forgot', '/login/reset/[token]', '/account'];
	const narrow = $derived(page.error !== null || NARROW_ROUTES.includes(page.route.id ?? ''));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header>
	<a class="wordmark" href={resolve('/')}>grimoire</a>
	<div class="session">
		{#if data.user}
			<span class="muted"
				>{m.header_logged_in_as()} <a href={resolve('/account')}>{data.user.name}</a></span
			>
			{#if data.user.mayManage}<a href={resolve('/manage')}>{m.header_manage()}</a>{/if}
			<form method="post" action="/logout">
				<button>{m.header_log_out()}</button>
			</form>
		{:else}
			<!-- A full request: the login page loads no data, so a client-side navigation would never
			reach the server hook that sends a first visit on to the setup. -->
			<a href={resolve('/login')} data-sveltekit-reload>{m.header_log_in()}</a>
		{/if}
	</div>
	<form class="track" method="post" action="/language" aria-labelledby="language-label">
		<span id="language-label">{m.header_language()}</span>
		<input type="hidden" name="redirectTo" value={page.url.pathname + page.url.search} />
		{#each locales as locale (locale)}
			<button name="locale" value={locale} lang={locale} aria-pressed={locale === getLocale()}
				>{languageName(locale)}</button
			>
		{/each}
	</form>
</header>

<main class:narrow>
	{@render children()}
</main>

<style>
	header,
	main {
		max-width: 78rem;
		margin: 0 auto;
		padding-inline: var(--s5);
	}
	header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--s3) var(--s5);
		padding-block: var(--s4);
	}
	.wordmark {
		margin-inline-end: auto;
		color: var(--ink);
		font-size: 17px;
		font-weight: 600;
		letter-spacing: -0.02em;
		text-decoration: none;
	}
	.session {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--s2) var(--s4);
		font-size: 14px;
	}
	.session form {
		display: contents;
	}
	.session button {
		min-height: 34px;
	}

	/* The segmented track: a recessed groove, the chosen option raised out of it. */
	.track {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		padding: 3px;
		background: var(--well);
		border-radius: 10px;
		box-shadow: var(--sink);
	}
	.track span {
		padding-inline: var(--s1) var(--s2);
		color: var(--ink-2);
		font-size: 12px;
		font-weight: 500;
	}
	.track button {
		min-height: 32px;
		padding: 0 var(--s3);
		color: var(--ink-2);
		background: transparent;
		border: 0;
		border-radius: 7px;
		box-shadow: none;
		font-size: 13px;
		font-weight: 400;
	}
	.track button:hover {
		color: var(--ink);
	}
	.track button[aria-pressed='true'] {
		color: var(--ink);
		background: var(--raised);
		box-shadow: var(--lift-raised);
		font-weight: 500;
	}

	main {
		display: grid;
		gap: var(--s5);
		padding-block: var(--s6) var(--s7);
	}
	main > :global(*) {
		min-width: 0;
	}
	main.narrow {
		justify-items: start;
		padding-block-start: var(--s7);
	}
	main.narrow > :global(*) {
		width: 100%;
		max-width: 30rem;
	}

	@media (max-width: 40rem) {
		header {
			padding-inline: var(--s4);
		}
		main {
			padding: var(--s5) var(--s3) var(--s7);
		}
	}
	@media (pointer: coarse) {
		.session button,
		.track button {
			min-height: 44px;
		}
	}
</style>
