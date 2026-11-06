<script lang="ts">
	/** An empty list that has a way to fill it: the sentence and the action. */
	let { text, action }: { text: string; action: { href: string; label: string } } = $props();
</script>

<div class="empty">
	<p class="muted">{text}</p>
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the caller resolves it -->
	<a class="button primary" href={action.href}>{action.label}</a>
</div>

<style>
	.empty {
		display: grid;
		justify-items: start;
		gap: var(--s3);
	}
</style>
