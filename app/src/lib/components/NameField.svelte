<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { MAX_NAME_LENGTH, slugify } from '#lib/slug.js';

	/** A name with the slug it turns into, updated while typing; without JavaScript as sent. */
	let { label, name, value = '' }: { label: string; name: string; value?: string } = $props();

	let typed = $derived(value);
	const slug = $derived(slugify(typed));
</script>

<p>
	<label>{label} <input {name} required maxlength={MAX_NAME_LENGTH} bind:value={typed} /></label>
	<output>{m.slug_preview({ slug: slug || m.slug_preview_empty() })}</output>
</p>
