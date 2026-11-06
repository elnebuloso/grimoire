<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import AreaSwitch from './AreaSwitch.svelte';
	import AuthLayout from './AuthLayout.svelte';
	import Preferences from './Preferences.svelte';
	import UserMenu from './UserMenu.svelte';
	import favicon from '#lib/assets/favicon.svg';
	import { releaseNotesUrl } from '#lib/release.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { Area } from '#lib/areas.js';
	import type { Theme } from '#lib/theme.js';

	/**
	 * The frame of every page: brand, area switch and user menu above, version and links below.
	 * A page of getting in (`auth`) sits in an `AuthLayout` instead of below the header.
	 */
	let {
		user,
		area,
		auth,
		narrow = false,
		theme,
		instanceTitle,
		version,
		children
	}: {
		user: { name: string; mayManage: boolean } | null;
		area: Area;
		/** A page of getting in: one card, or a wide page with cards of its own. */
		auth?: 'card' | 'wide';
		/** A page with a single form sits in a narrow column. */
		narrow?: boolean;
		theme: Theme | 'system';
		instanceTitle: string;
		version: string;
		children: Snippet;
	} = $props();

	const releaseNotes = $derived(releaseNotesUrl(version));
	const loggedIn = $derived(user !== null && !auth);
</script>

<a class="button skip sr-only-focusable" href="#main">{m.skip_to_content()}</a>

{#if auth}
	<main id="main" class="auth">
		<AuthLayout {instanceTitle} wide={auth === 'wide'}>{@render children()}</AuthLayout>
	</main>
{:else}
	<header>
		<a class="brand" href={resolve('/')}>
			<img src={favicon} alt="" width="32" height="32" />
			<span>{instanceTitle}</span>
		</a>
		{#if loggedIn && user}
			<AreaSwitch current={area} mayManage={user.mayManage} />
			<UserMenu email={user.name} {theme} />
		{:else}
			<!-- A full request: the login page loads no data, so a client-side navigation would never
			reach the server hook that sends a first visit on to the setup. -->
			<a class="login" href={resolve('/login')} data-sveltekit-reload>{m.header_log_in()}</a>
		{/if}
	</header>

	<main id="main" class:narrow>
		{@render children()}
	</main>
{/if}

<footer>
	<div class="links">
		<!-- The product, whatever INSTANCE_TITLE calls this instance. -->
		<span class="product"
			>grimoire
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- a page on GitHub -->
			{#if releaseNotes}<a href={releaseNotes}>{version}</a>{:else}{version}{/if}</span
		>
		{#if !loggedIn}<Preferences {theme} />{/if}
		<a
			class="icon"
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
			class="icon"
			href="https://elnebuloso.github.io/grimoire/"
			aria-label={m.footer_docs()}
			title={m.footer_docs()}
		>
			<BookOpen size={20} aria-hidden="true" />
		</a>
	</div>
</footer>

<style>
	/* Off screen until focused, so keyboard users can pass the header. */
	.skip:focus {
		position: absolute;
		top: var(--s2);
		inset-inline-start: var(--s4);
		z-index: 1;
	}
	header,
	main,
	footer {
		max-width: 78rem;
		margin: 0 auto;
		padding-inline: var(--s5);
	}
	header {
		display: flex;
		align-items: center;
		gap: var(--s5);
		padding-block: var(--s4);
	}
	.brand {
		display: flex;
		align-items: center;
		gap: var(--s3);
		margin-inline-end: auto;
		color: var(--ink);
		font-weight: 600;
		letter-spacing: -0.01em;
		text-decoration: none;
	}
	.login {
		font-size: var(--fs-5);
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
	main.auth {
		padding-block: var(--s7);
	}

	footer {
		padding-block: 0 var(--s5);
	}
	/* The rule runs as wide as the sheets, not into the padding of the footer. */
	.links {
		display: flex;
		align-items: center;
		gap: var(--s2) var(--s4);
		padding-top: var(--s3);
		border-top: 1px solid var(--line);
	}
	footer .icon {
		display: inline-grid;
		place-items: center;
		min-width: 32px;
		min-height: 32px;
		color: var(--ink-2);
		transition: color var(--t);
	}
	.product {
		margin-inline-end: auto;
		color: var(--ink-2);
		font-size: var(--fs-3);
		font-weight: 500;
		letter-spacing: -0.01em;
	}
	.product a {
		color: inherit;
		font-weight: 400;
	}
	.product a:hover,
	footer .icon:hover {
		color: var(--accent);
	}
</style>
