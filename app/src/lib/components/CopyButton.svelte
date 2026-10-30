<script lang="ts">
	import { onMount } from 'svelte';
	import { m } from '#lib/paraglide/messages.js';

	/**
	 * Copies `value` to the clipboard and says whether that worked. Appears only where the browser
	 * offers a clipboard; the value itself stays on the page to be selected by hand.
	 */
	let { value, label }: { value: string; label: string } = $props();

	let available = $state(false);
	let outcome = $state<'copied' | 'failed'>();

	onMount(() => {
		available = navigator.clipboard !== undefined;
	});

	async function copy() {
		try {
			await navigator.clipboard.writeText(value);
			outcome = 'copied';
		} catch {
			// The browser may refuse, e.g. without permission or focus.
			outcome = 'failed';
		}
	}
</script>

{#if available}
	<button type="button" onclick={copy}>{label}</button>
	<span role="status" class={outcome}
		>{outcome === 'copied' ? m.copy_done() : outcome === 'failed' ? m.copy_failed() : ''}</span
	>
{/if}

<style>
	span {
		font-size: 14px;
		font-weight: 500;
	}
	.copied {
		color: var(--ok);
	}
	.failed {
		color: var(--err);
	}
</style>
