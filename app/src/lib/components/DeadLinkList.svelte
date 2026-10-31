<script lang="ts">
	import type { DeadLink } from '#lib/server/admin/status.js';
	import { m } from '#lib/paraglide/messages.js';

	/** Dead links as the page and section holding them, and where they point. */
	let { links }: { links: DeadLink[] } = $props();
</script>

<ul>
	{#each links as link, index (index)}
		<li>
			<code>{link.file}{link.anchor ? `#${link.anchor}` : ''}</code>
			<span aria-hidden="true">→</span> <span class="spoken">{m.dead_link_to()}</span>
			<code>{link.target}</code>
		</li>
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
	span {
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
