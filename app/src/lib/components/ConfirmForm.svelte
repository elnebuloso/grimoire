<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * A form with a single button that asks before it posts. Without JavaScript it posts at once:
	 * the question is a guard against a slip, not a requirement.
	 */
	let {
		action,
		question,
		label,
		buttonLabel,
		children
	}: {
		action: string;
		question: string;
		label: string;
		/** Accessible name of the button when `label` alone is ambiguous, e.g. in a list. */
		buttonLabel?: string;
		/** Hidden inputs posted with the form. */
		children?: Snippet;
	} = $props();
</script>

<form
	method="post"
	{action}
	onsubmit={(event) => {
		if (!confirm(question)) event.preventDefault();
	}}
>
	{@render children?.()}
	<button aria-label={buttonLabel}>{label}</button>
</form>
