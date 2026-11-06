<script lang="ts">
	import { resolve } from '$app/paths';
	import type { DeadLink } from '#lib/server/admin/status.js';
	import { m } from '#lib/paraglide/messages.js';

	/**
	 * Dead links as the page and section holding them, and where they point. Each page links to its
	 * preview and names its file in the repository, where the link is fixed.
	 */
	let {
		links,
		source
	}: {
		links: DeadLink[];
		/** The source the links belong to, and its path in the repository. */
		source: { id: number; path: string };
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

	const preview = (file: string) =>
		`${resolve('/manage/sources/[id]/[[tab=tab]]', { id: String(source.id), tab: 'pages' })}?preview=${encodeURIComponent(file)}`;
	const inRepository = (file: string) =>
		[...source.path.split('/'), file].filter((part) => part !== '' && part !== '.').join('/');
</script>

<!-- role="list": WebKit drops the list role of a list without bullets. -->
<ul role="list">
	{#each groups as group, index (index)}
		<li>
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved in preview() -->
			<a class="from" href={preview(group.file)}><code>{group.from}</code></a>
			<span class="repository"
				>{m.dead_link_in_repository()}: <code>{inRepository(group.file)}</code></span
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
		/* anywhere, not break-word: only anywhere lets a grid item shrink below its longest
		unbroken path, which would otherwise widen the page on a phone. */
		overflow-wrap: anywhere;
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
	.repository {
		color: var(--ink-2);
		font-size: 13px;
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
