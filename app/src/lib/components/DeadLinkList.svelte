<script lang="ts">
	import type { DeadLink } from '#lib/server/admin/status.js';

	/** Dead links as the page and section holding them, and where they point. */
	let { links }: { links: DeadLink[] } = $props();
</script>

<ul>
	{#each links as link, index (index)}
		<li><code>{link.file}{link.anchor ? `#${link.anchor}` : ''} → {link.target}</code></li>
	{/each}
</ul>

<style>
	ul {
		list-style: none;
	}
	li {
		padding: var(--s2) 0;
		border-top: 1px solid var(--line);
		overflow-wrap: anywhere;
	}
	li:first-child {
		border-top: 0;
	}
	code {
		font-size: 13px;
	}
</style>
