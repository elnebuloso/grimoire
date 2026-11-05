<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		label,
		mono = false,
		value,
		...input
	}: {
		label: string;
		/** For machine strings such as slugs, paths and cron expressions. */
		mono?: boolean;
	} & HTMLInputAttributes = $props();
</script>

<!-- As `defaultValue`: hydration sets `value` again and so erases what was typed before it. -->
<label><span>{label}</span> <input class:mono defaultValue={value} {...input} /></label>

<style>
	label {
		display: grid;
		gap: 6px;
		align-content: start;
		min-width: 0;
	}
	.mono {
		font-family: var(--mono);
		font-size: 14px;
	}
</style>
