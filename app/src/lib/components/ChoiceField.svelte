<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	/** A checkbox or radio button with its label after it. */
	let {
		label,
		type = 'checkbox',
		...input
	}: { label: string; type?: 'checkbox' | 'radio' } & HTMLInputAttributes = $props();
</script>

<p><label><input {type} {...input} /> {label}</label></p>
