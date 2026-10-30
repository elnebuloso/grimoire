<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { MAX_SLUG_LENGTH } from '#lib/slug.js';
	import FormError from './FormError.svelte';
	import TextField from './TextField.svelte';

	/**
	 * Changes a slug that agents already use. The admin reads what breaks and types the current
	 * slug again before anything changes; the form posts to the page's `slug` action.
	 */
	let {
		current,
		effects,
		value,
		error,
		changed = false
	}: {
		current: string;
		/** What changing this slug breaks, in a sentence. */
		effects: string;
		/** The new slug entered before a rejection. */
		value?: string;
		error?: string;
		changed?: boolean;
	} = $props();
</script>

<form method="post" action="?/slug">
	<p class="muted">{effects}</p>
	{#if changed}<p class="notice" role="status">{m.slug_changed()}</p>{/if}
	<FormError message={error} />
	<TextField
		label={m.slug_change_new()}
		name="slug"
		required
		maxlength={MAX_SLUG_LENGTH}
		value={value ?? current}
		mono
	/>
	<TextField
		label={m.slug_change_confirmation()}
		name="confirmation"
		required
		autocomplete="off"
		mono
	/>
	<button>{m.slug_change_submit()}</button>
</form>
