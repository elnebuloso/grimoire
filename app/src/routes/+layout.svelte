<script lang="ts">
	import '../app.css';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import SegmentedSwitch from '#lib/components/SegmentedSwitch.svelte';
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
	<div class="switches">
		<SegmentedSwitch
			label={m.header_language()}
			action="/language"
			name="locale"
			options={locales.map((locale) => ({
				value: locale,
				label: languageName(locale) ?? locale,
				lang: locale
			}))}
			current={getLocale()}
		/>
		<SegmentedSwitch
			label={m.header_theme()}
			action="/theme"
			name="theme"
			options={[
				{ value: 'system', label: m.theme_system() },
				{ value: 'light', label: m.theme_light() },
				{ value: 'dark', label: m.theme_dark() }
			]}
			current={data.theme}
		/>
	</div>
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

	.switches {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s3);
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
		.session button {
			min-height: 44px;
		}
	}
</style>
