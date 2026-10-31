<script lang="ts">
	import type { DeadLink } from '#lib/server/admin/status.js';
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';

	/** Dead links as the page and section holding them, and where they point. */
	let {
		links,
		sourceId
	}: {
		links: DeadLink[];
		/** Links each page to its preview on the source page, where it is checked after the fix. */
		sourceId: number;
	} = $props();

	// One entry per page and section, its targets below: a page with five dead links names itself
	// once. The links come sorted by page and section.
	const groups = $derived(
		links.reduce<{ file: string; from: string; targets: string[] }[]>((groups, link) => {
			const from = link.anchor ? `${link.file}#${link.anchor}` : link.file;
			const last = groups.at(-1);
			if (last?.from === from) last.targets.push(link.target);
			else groups.push({ file: link.file, from, targets: [link.target] });
			return groups;
		}, [])
	);
</script>

<!-- role="list": WebKit drops the list role of a list without bullets. -->
<ul role="list">
	{#each groups as group, index (index)}
		<li>
			<a
				class="from"
				href="{resolve('/manage/sources/[id]', {
					id: String(sourceId)
				})}?preview={encodeURIComponent(group.file)}"><code>{group.from}</code></a
			>
			<ul role="list">
				{#each group.targets as target, index (index)}
					<li>
						<span aria-hidden="true">→</span> <span class="spoken">{m.dead_link_to()}</span>
						<code>{target}</code>
					</li>
				{/each}
			</ul>
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
	li li {
		display: block;
		padding: 0;
		border-top: 0;
	}
	code {
		font-size: 13px;
	}
	.from {
		justify-self: start;
	}
	li li code {
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
