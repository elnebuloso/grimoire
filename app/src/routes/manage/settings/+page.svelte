<script lang="ts">
	import PageHead from '#lib/components/PageHead.svelte';
	import { resolve } from '$app/paths';
	import ChoiceField from '#lib/components/ChoiceField.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import TextField from '#lib/components/TextField.svelte';
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

<section class="sheet" aria-labelledby="syncs">
	<h2 id="syncs">{m.settings_syncs()}</h2>
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

<!-- A plain form: the answer is a download, the page stays as it is. -->
<section class="sheet" aria-labelledby="export">
	<h2 id="export">{m.export_title()}</h2>
	<p class="muted">{m.export_lead()}</p>
	<p class="notice warn">{m.export_warning()}</p>
	<form method="post" action={resolve('/manage/settings/export')}>
		<FormError message={data.exportProblem?.message} id="export-error" />
		<TextField
			label={m.export_passphrase({ min: data.minPassphraseLength })}
			name="passphrase"
			type="password"
			required
			minlength={data.minPassphraseLength}
			autocomplete="new-password"
			aria-invalid={data.exportProblem?.aboutPassphrase || undefined}
			aria-describedby={data.exportProblem?.aboutPassphrase ? 'export-error' : undefined}
		/>
		<TextField
			label={m.export_passphrase_repeat()}
			name="repeat"
			type="password"
			required
			autocomplete="new-password"
		/>
		<button class="primary">{m.export_submit()}</button>
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
