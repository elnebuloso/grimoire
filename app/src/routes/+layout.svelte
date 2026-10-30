<script lang="ts">
	import '../app.css';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import BookOpen from '@lucide/svelte/icons/book-open';
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
	<a class="wordmark" href={resolve('/')}>{data.instanceName}</a>
	<div class="session">
		{#if data.user}
			<span class="muted"
				>{m.header_logged_in_as()} <a href={resolve('/account')}>{data.user.name}</a></span
			>
			{#if data.user.mayManage}<a class="button" href={resolve('/manage')}>{m.header_manage()}</a
				>{/if}
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

<footer>
	<div class="links">
		<a
			href="https://github.com/elnebuloso/grimoire"
			aria-label={m.footer_github()}
			title={m.footer_github()}
		>
			<!-- The GitHub mark: Lucide has no brand icons. -->
			<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true">
				<path
					d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"
				/>
			</svg>
		</a>
		<a
			href="https://elnebuloso.github.io/grimoire/"
			aria-label={m.footer_docs()}
			title={m.footer_docs()}
		>
			<BookOpen size={20} aria-hidden="true" />
		</a>
	</div>
</footer>

<style>
	header,
	main,
	footer {
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
	.session :is(button, .button) {
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

	footer {
		padding-block: 0 var(--s5);
	}
	/* The rule runs as wide as the sheets, not into the padding of the footer. */
	.links {
		display: flex;
		justify-content: flex-end;
		gap: var(--s2);
		padding-top: var(--s3);
		border-top: 1px solid var(--line);
	}
	footer a {
		display: inline-grid;
		place-items: center;
		min-width: 32px;
		min-height: 32px;
		color: var(--ink-2);
		transition: color var(--t);
	}
	footer a:hover {
		color: var(--accent);
	}

	@media (max-width: 40rem) {
		header {
			padding-inline: var(--s4);
		}
		main {
			padding: var(--s5) var(--s3) var(--s7);
		}
		footer {
			padding-inline: var(--s3);
		}
	}
	@media (pointer: coarse) {
		.session :is(button, .button) {
			min-height: 44px;
		}
		footer a {
			min-width: 44px;
			min-height: 44px;
		}
	}
</style>
