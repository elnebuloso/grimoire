<script lang="ts">
	let { items }: { items: [term: string, description: string | number][] } = $props();
</script>

<dl>
	{#each items as [term, description] (term)}
		<dt>{term}</dt>
		<dd>{description}</dd>
	{/each}
</dl>
