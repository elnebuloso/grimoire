<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	let { label, value, ...textarea }: { label: string; value: string } & HTMLTextareaAttributes =
		$props();
</script>

<label><span>{label}</span> <textarea {...textarea}>{value}</textarea></label>

<style>
	label {
		display: grid;
		gap: 6px;
		min-width: 0;
	}
</style>
