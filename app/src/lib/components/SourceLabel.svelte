<script lang="ts">
	/** A source as people know it, by name, with the slug agents use below it. */
	let { name, slug, href }: { name: string; slug: string; href?: string } = $props();
</script>

<span class="label">
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the caller resolves it -->
	{#if href}<a class="name" {href}>{name}</a>{:else}<span class="name">{name}</span>{/if}
	<code>{slug}</code>
</span>

<style>
	.label {
		display: inline-grid;
		gap: 2px;
	}
	.name {
		font-weight: 500;
	}
	code {
		color: var(--ink-2);
		font-size: 12.5px;
	}
</style>
