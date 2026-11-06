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
		<!-- A user turned away here wanted something of their own: their account comes first. -->
		{#if page.status === 403 && page.data.user}
			<p>{m.error_forbidden_admins()}</p>
			<p class="ways">
				<a href={resolve('/account/api-keys')}>{m.error_account()}</a>
				<a href={resolve('/')}>{m.error_start_page()}</a>
			</p>
		{:else}
			<p><a href={resolve('/')}>{m.error_start_page()}</a></p>
		{/if}
	</PageHead>
</section>

<style>
	section {
		gap: var(--s5);
		padding-block: var(--s6);
	}
	.ways {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s4);
	}
</style>
