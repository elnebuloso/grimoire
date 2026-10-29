<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	let { label, value, ...textarea }: { label: string; value: string } & HTMLTextareaAttributes =
		$props();
</script>

<p><label>{label} <textarea {...textarea}>{value}</textarea></label></p>
