<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import PageHead from '#lib/components/PageHead.svelte';
	import { errorTitles } from './error-titles';
	import { m } from '#lib/paraglide/messages.js';

	const { heading, documentTitle } = $derived(errorTitles(page.status));
</script>

<section class="sheet">
	<PageHead title={heading} {documentTitle}>
		<p><a href={resolve('/')}>{m.error_start_page()}</a></p>
	</PageHead>
</section>

<style>
	section {
		gap: var(--s5);
		padding-block: var(--s6);
	}
</style>
