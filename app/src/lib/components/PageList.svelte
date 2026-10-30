<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageSummary } from '#lib/server/admin/status.js';
	import TextField from './TextField.svelte';

	/**
	 * The pages of a source, each linked to its preview on the source page. The filter needs
	 * JavaScript and appears only with it; without, the whole list shows.
	 */
	let { pages, sourceId }: { pages: PageSummary[]; sourceId: number } = $props();

	let filterable = $state(false);
	let filter = $state('');

	onMount(() => {
		filterable = true;
	});

	const shown = $derived.by(() => {
		const words = filter.trim().toLowerCase();
		if (!words) return pages;
		return pages.filter((page) => `${page.file}\n${page.title}`.toLowerCase().includes(words));
	});
</script>

{#if filterable}
	<TextField
		label={m.pages_filter()}
		type="search"
		value={filter}
		oninput={(event) => (filter = event.currentTarget.value)}
	/>
{/if}
{#if shown.length === 0}
	<p>{m.pages_filter_none()}</p>
{:else}
	<ul>
		{#each shown as page (page.file)}
			<li>
				<a
					href="{resolve('/manage/sources/[id]', {
						id: String(sourceId)
					})}?preview={encodeURIComponent(page.file)}">{page.file}</a
				>
				– {m.source_page_line({ title: page.title, snippets: page.snippets, tokens: page.tokens })}
			</li>
		{/each}
	</ul>
{/if}
