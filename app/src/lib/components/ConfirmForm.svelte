<script lang="ts">
	import type { Snippet } from 'svelte';
	import { enhance } from '$app/forms';
	import { submitWithToast } from '#lib/forms.js';

	/** A form with a single button that asks before it posts, and reports success in a toast. */
	let {
		action,
		question,
		label,
		buttonLabel,
		success,
		children
	}: {
		action: string;
		question: string;
		label: string;
		/** Accessible name of the button when `label` alone is ambiguous, e.g. in a list. */
		buttonLabel?: string;
		/** The toast after the action succeeded. */
		success?: string;
		/** Hidden inputs posted with the form. */
		children?: Snippet;
	} = $props();
</script>

<!-- Asked before `enhance` sees the submit: a cancelled one stops here. -->
<form
	method="post"
	{action}
	onsubmit={(event) => {
		if (confirm(question)) return;
		event.preventDefault();
		event.stopImmediatePropagation();
	}}
	use:enhance={submitWithToast({ success: () => success })}
>
	{@render children?.()}
	<button class="danger" aria-label={buttonLabel}>{label}</button>
</form>
