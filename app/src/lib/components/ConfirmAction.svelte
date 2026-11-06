<script lang="ts">
	import type { Snippet } from 'svelte';
	import { enhance, type ActionResult } from '$app/forms';
	import { submitWithToast } from '#lib/forms.js';
	import ConfirmDialog from './ConfirmDialog.svelte';

	/**
	 * A form action that asks first. Its button opens a `ConfirmDialog`; confirmed, the form posts,
	 * the dialog shows a refusal or closes and a toast reports success. `children` are the form's
	 * fields: hidden inputs, or fields on the page such as a new slug.
	 */
	let {
		action,
		label,
		buttonLabel,
		title,
		consequence,
		confirmLabel = label,
		danger = false,
		typed,
		success,
		children
	}: {
		action: string;
		/** The button that opens the dialog. */
		label: string;
		/** Accessible name of that button when `label` alone is ambiguous, e.g. in a list. */
		buttonLabel?: string;
		title: string;
		consequence: string;
		confirmLabel?: string;
		danger?: boolean;
		typed?: { value: string; label: string };
		/** The toast after the action succeeded, or how to tell it from the answer. */
		success: string | ((result: ActionResult) => string | undefined);
		children?: Snippet;
	} = $props();

	const formId = $props.id();
	let open = $state(false);
	let busy = $state(false);
	let error = $state<string>();

	const submit = submitWithToast({
		success: (result) => (typeof success === 'string' ? success : success(result)),
		onsuccess: () => (open = false),
		onfailure: (data) => (error = data?.error)
	});
</script>

<form
	id={formId}
	method="post"
	{action}
	use:enhance={(input) => {
		busy = true;
		error = undefined;
		const done = submit(input);
		return async (output) => {
			try {
				if (typeof done === 'function') await done(output);
			} finally {
				busy = false;
			}
		};
	}}
>
	{@render children?.()}
	<button
		type="button"
		class={danger ? 'danger' : undefined}
		aria-label={buttonLabel}
		aria-haspopup="dialog"
		onclick={(event) => {
			// Fields on the page are checked before the dialog covers them.
			if (!event.currentTarget.form?.reportValidity()) return;
			error = undefined;
			open = true;
		}}>{label}</button
	>
</form>

<ConfirmDialog
	bind:open
	{title}
	{consequence}
	{confirmLabel}
	{danger}
	{typed}
	{formId}
	{busy}
	{error}
/>
