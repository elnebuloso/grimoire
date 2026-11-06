<script lang="ts">
	import { invalidate } from '$app/navigation';
	import SegmentedSwitch from './SegmentedSwitch.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale, locales } from '#lib/paraglide/runtime.js';
	import type { Theme } from '#lib/theme.js';

	/** The language and theme switches, each applying its choice at once. */
	let { theme }: { theme: Theme | 'system' } = $props();

	// Each language is named in itself, so a reader finds theirs whatever the page is in.
	const languageName = (locale: string) =>
		new Intl.DisplayNames([locale], { type: 'language' }).of(locale);
</script>

<div class="preferences">
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
		onpick={() => {
			// Every text on the page was rendered in the old language: only a reload renders it anew.
			location.reload();
		}}
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
		current={theme}
		onpick={(picked) => {
			if (picked === 'system') document.documentElement.removeAttribute('data-theme');
			else document.documentElement.setAttribute('data-theme', picked);
			// Only the root layout reads the theme; the page's own data stays.
			return invalidate('app:theme');
		}}
	/>
</div>

<style>
	.preferences {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s3);
	}
</style>
