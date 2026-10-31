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
{#if data.settings.syncsPaused}
	<p class="notice warn">{m.syncs_paused_notice()}</p>
{/if}

<section class="sheet">
	<form method="post">
		<ChoiceField
			name="syncsPaused"
			checked={data.settings.syncsPaused}
			label={m.settings_syncs_paused()}
			aria-describedby="syncs-paused-hint"
		/>
		<p class="hint" id="syncs-paused-hint">{m.settings_syncs_paused_hint()}</p>
		<button class="primary">{m.settings_submit()}</button>
	</form>
</section>

<style>
	.notice,
	.sheet {
		max-width: 40rem;
	}
	/* Under the label, past the 18px checkbox and its gap. */
	.hint {
		margin-top: calc(var(--s2) * -1);
		padding-inline-start: calc(18px + var(--s3));
		color: var(--ink-2);
		font-size: 13px;
		text-wrap: pretty;
	}
</style>
