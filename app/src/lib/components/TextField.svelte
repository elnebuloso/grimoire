<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	let { label, ...input }: { label: string } & HTMLInputAttributes = $props();
</script>

<p><label>{label} <input {...input} /></label></p>
