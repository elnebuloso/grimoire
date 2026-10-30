<script lang="ts">
	import PageHead from '#lib/components/PageHead.svelte';
	import ChoiceField from '#lib/components/ChoiceField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<PageHead title={m.settings_title()} />

{#if form?.saved}
	<p class="notice" role="status">{m.settings_saved()}</p>
{/if}

<section class="sheet">
	<form method="post">
		<ChoiceField
			name="syncsPaused"
			checked={data.settings.syncsPaused}
			label={m.settings_syncs_paused()}
		/>
		<button class="primary">{m.settings_submit()}</button>
	</form>
</section>

<style>
	.notice,
	.sheet {
		max-width: 40rem;
	}
</style>
