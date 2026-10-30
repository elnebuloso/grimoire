<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		label,
		mono = false,
		...input
	}: {
		label: string;
		/** For machine strings such as slugs, paths and cron expressions. */
		mono?: boolean;
	} & HTMLInputAttributes = $props();
</script>

<label><span>{label}</span> <input class:mono {...input} /></label>

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
