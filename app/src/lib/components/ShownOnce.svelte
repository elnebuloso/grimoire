<script lang="ts">
	import CopyButton from './CopyButton.svelte';

	/** A secret shown only once, such as a new API key or an invitation link, to select or copy. */
	let { value, copyLabel }: { value: string; copyLabel: string } = $props();
</script>

<!-- Sunk in a well, dashed: it is not stored anywhere it could be shown again. -->
<div class="secret">
	<output>{value}</output>
	<CopyButton {value} label={copyLabel} />
</div>

<style>
	.secret {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--s3);
		padding: var(--s4);
		background: var(--well);
		border-radius: var(--r-control);
		box-shadow: var(--sink);
	}
	output {
		flex: 1 1 18rem;
		padding: var(--s3);
		font-family: var(--mono);
		font-size: var(--fs-5);
		background: var(--sheet);
		border: 1px dashed var(--edge);
		border-radius: var(--r-control);
		overflow-wrap: anywhere;
		user-select: all;
	}
</style>
