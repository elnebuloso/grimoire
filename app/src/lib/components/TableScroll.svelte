<script lang="ts">
	import type { Snippet } from 'svelte';

	/** Lets a wide table scroll sideways in place, so the page itself never does. */
	let { label, children }: { label: string; children: Snippet } = $props();
</script>

<!-- Focusable, so a keyboard can scroll the table where it holds no link. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="table-scroll" role="region" aria-label={label} tabindex="0">
	{@render children()}
</div>
