<script lang="ts">
	import PageHead from '#lib/components/PageHead.svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ChoiceField from '#lib/components/ChoiceField.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { markRefusal, submitWithToast } from '#lib/forms.js';
	import { m } from '#lib/paraglide/messages.js';
	import { showToast } from '#lib/toasts.svelte.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let exporting = $state(false);
	let exportFailed = $state(false);
	const refusal = $derived(exportFailed ? undefined : data.exportProblem);

	// The answer is either the file, saved through a link of its own, or the way back to this page
	// with the reason in the address; anything else, a lost connection included, is a failure.
	async function exportInstance(event: SubmitEvent) {
		event.preventDefault();
		const form = event.currentTarget as HTMLFormElement;
		exporting = true;
		exportFailed = false;
		try {
			const response = await fetch(form.action, { method: 'POST', body: new FormData(form) });
			const disposition = response.headers.get('content-disposition') ?? '';
			const fileName = /filename="([^"]+)"/.exec(disposition)?.[1];
			const refusal = response.redirected && new URL(response.url).searchParams.has('export');
			if (response.ok && fileName) {
				const link = document.createElement('a');
				link.href = URL.createObjectURL(await response.blob());
				link.download = fileName;
				link.click();
				URL.revokeObjectURL(link.href);
				form.reset();
				showToast(m.export_downloaded());
				if (data.exportProblem) await goto(resolve('/manage/settings'), { reset: false });
			} else if (refusal) {
				// The refusal comes back as the reason in the address of this page.
				// eslint-disable-next-line svelte/no-navigation-without-resolve -- this page, resolved, plus its query
				await goto(`${resolve('/manage/settings')}${new URL(response.url).search}`, {
					reset: false
				});
			} else {
				exportFailed = true;
			}
		} catch {
			exportFailed = true;
		} finally {
			exporting = false;
		}
	}
</script>

<PageHead title={m.settings_title()} />

{#if data.settings.syncsPaused}
	<p class="notice warn">{m.syncs_paused_notice()}</p>
{/if}

<section class="sheet" aria-labelledby="syncs">
	<h2 id="syncs">{m.settings_syncs()}</h2>
	<form method="post" use:enhance={submitWithToast({ success: () => m.settings_saved() })}>
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

<section class="sheet" aria-labelledby="export">
	<h2 id="export">{m.export_title()}</h2>
	<p class="muted">{m.export_lead()}</p>
	<p class="notice warn">{m.export_warning()}</p>
	<form method="post" action={resolve('/manage/settings/export')} onsubmit={exportInstance}>
		<FormError
			message={exportFailed ? m.export_failed() : data.exportProblem?.error}
			id="export-error"
		/>
		<TextField
			label={m.password_current()}
			name="current"
			type="password"
			required
			autocomplete="current-password"
			{...markRefusal(refusal, 'current', 'export-error')}
		/>
		<TextField
			label={m.export_passphrase({ min: data.minPassphraseLength })}
			name="passphrase"
			type="password"
			required
			minlength={data.minPassphraseLength}
			autocomplete="new-password"
			{...markRefusal(refusal, 'passphrase', 'export-error')}
		/>
		<TextField
			label={m.export_passphrase_repeat()}
			name="repeat"
			type="password"
			required
			autocomplete="new-password"
		/>
		<button class="primary" disabled={exporting} aria-busy={exporting || undefined}
			>{m.export_submit()}</button
		>
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
		font-size: var(--fs-3);
		text-wrap: pretty;
	}
</style>
