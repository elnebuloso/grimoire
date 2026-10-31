<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type { Snippet } from 'svelte';
	import DateTime from './DateTime.svelte';
	import TableScroll from './TableScroll.svelte';
	import type { SourceStats } from '#lib/server/stats.js';

	let {
		sources,
		timeZone,
		name,
		deadLinks
	}: {
		sources: SourceStats[];
		timeZone: string;
		name?: Snippet<[SourceStats]>;
		deadLinks?: Snippet<[SourceStats]>;
	} = $props();

	const count = (value: number) => value.toLocaleString(getLocale());

	// One word per source, the most pressing first.
	function state(source: SourceStats): { word: string; tone?: 'error' | 'muted' } {
		if (source.error) return { word: m.source_history_failed(), tone: 'error' };
		if (source.paused) return { word: m.state_paused() };
		if (source.lastSync === null) return { word: m.not_synced() };
		return { word: m.source_history_synced(), tone: 'muted' };
	}
</script>

<TableScroll label={m.sources_table()}>
	<table>
		<thead>
			<tr>
				<th scope="col">{m.source()}</th>
				<th scope="col">{m.visibility()}</th>
				<th scope="col" class="num">{m.pages()}</th>
				<th scope="col" class="num">{m.snippets()}</th>
				<th scope="col" class="num">{m.tokens()}</th>
				<th scope="col">{m.source_status()}</th>
				<th scope="col">{m.last_sync_in_zone({ zone: timeZone })}</th>
				<th scope="col" class="num">{m.dead_links()}</th>
			</tr>
		</thead>
		<tbody>
			{#each sources as source (source.slug)}
				<tr>
					<th scope="row">
						<div class="source">
							<span class="name"
								>{#if name}{@render name(source)}{:else}{source.name}{/if}</span
							>
							<code>{source.slug}</code>
							{#if source.description}<span class="muted">{source.description}</span>{/if}
							{#if source.docsUrl}<a href={source.docsUrl} rel="external">{m.source_docs_link()}</a
								>{/if}
						</div>
					</th>
					<td>{source.public ? m.visibility_public() : m.visibility_private()}</td>
					<td class="num">{count(source.pages)}</td>
					<td class="num">{count(source.snippets)}</td>
					<td class="num">{count(source.tokens)}</td>
					<td class={state(source).tone}>{state(source).word}</td>
					<td class="when">
						{#if source.lastSync}
							<DateTime value={source.lastSync} {timeZone} short />
						{:else}
							{m.never()}
						{/if}
					</td>
					<td class="num"
						>{#if deadLinks}{@render deadLinks(source)}{:else}{count(source.deadLinks)}{/if}</td
					>
				</tr>
			{/each}
		</tbody>
	</table>
</TableScroll>

<style>
	.source {
		display: grid;
		gap: 2px;
		min-width: 12rem;
	}
	.name {
		font-weight: 500;
	}
	code {
		color: var(--ink-2);
		font-size: 12.5px;
	}
	.when {
		color: var(--ink-2);
		white-space: nowrap;
	}
	.error {
		color: var(--err);
		font-weight: 600;
	}
</style>
