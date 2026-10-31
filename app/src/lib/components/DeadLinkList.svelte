<script lang="ts">
	import type { DeadLink } from '#lib/server/admin/status.js';
	import { m } from '#lib/paraglide/messages.js';

	/** Dead links as the page and section holding them, and where they point. */
	let { links }: { links: DeadLink[] } = $props();
</script>

<!-- role="list": WebKit drops the list role of a list without bullets. -->
<ul role="list">
	{#each links as link, index (index)}
		<li>
			<code class="from">{link.file}{link.anchor ? `#${link.anchor}` : ''}</code>
			<span class="to"
				><span aria-hidden="true">→</span> <span class="spoken">{m.dead_link_to()}</span>
				<code>{link.target}</code></span
			>
		</li>
	{/each}
</ul>

<style>
	ul {
		list-style: none;
	}
	li {
		display: grid;
		gap: var(--s1);
		padding: var(--s2) 0;
		border-top: 1px solid var(--line);
		overflow-wrap: break-word;
	}
	li:first-child {
		border-top: 0;
	}
	code {
		font-size: 13px;
	}
	.from {
		color: var(--ink-2);
	}
	.to code {
		font-weight: 500;
	}
	[aria-hidden] {
		color: var(--ink-2);
	}
	/* The arrow reads as "right arrow"; a screen reader gets the words instead. */
	.spoken {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
