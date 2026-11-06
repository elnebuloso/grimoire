<script lang="ts">
	/**
	 * An empty list that has a way to fill it: the sentence and the action, a link or, with
	 * `onclick`, a button such as one that opens a dialog.
	 */
	let {
		text,
		action
	}: {
		text: string;
		action: { label: string } & ({ href: string } | { onclick: () => void });
	} = $props();
</script>

<div class="empty">
	<p class="muted">{text}</p>
	{#if 'href' in action}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the caller resolves it -->
		<a class="button primary" href={action.href}>{action.label}</a>
	{:else}
		<button type="button" class="primary" aria-haspopup="dialog" onclick={action.onclick}
			>{action.label}</button
		>
	{/if}
</div>

<style>
	.empty {
		display: grid;
		justify-items: start;
		gap: var(--s3);
	}
</style>
