<script lang="ts">
	/** The message of a rejected form; nothing is shown without one. */
	let { message }: { message?: string } = $props();
</script>

{#if message}<p role="alert">{message}</p>{/if}
