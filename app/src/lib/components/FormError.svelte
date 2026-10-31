<script lang="ts">
	/**
	 * The message of a rejected form; nothing is shown without one. `id` lets the fields it is
	 * about point to it with `aria-describedby`.
	 */
	let { message, id }: { message?: string; id?: string } = $props();
</script>

{#if message}<p class="notice alert" role="alert" {id}>{message}</p>{/if}
