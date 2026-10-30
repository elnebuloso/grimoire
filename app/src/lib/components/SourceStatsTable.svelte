<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { Snippet } from 'svelte';
	import DateTime from './DateTime.svelte';
	import TableScroll from './TableScroll.svelte';
	import type { SourceStats } from '#lib/server/stats.js';

	let {
		sources,
		timeZone,
		name
	}: { sources: SourceStats[]; timeZone: string; name?: Snippet<[SourceStats]> } = $props();
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
				<th scope="col">{m.source_last_sync()}</th>
				<th scope="col">{m.sync_error()}</th>
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
					<td class="num">{source.pages}</td>
					<td class="num">{source.snippets}</td>
					<td class="num">{source.tokens}</td>
					<td class="when">
						{#if source.lastSync}
							<DateTime value={source.lastSync} {timeZone} />
						{:else}
							{m.not_synced()}
						{/if}
					</td>
					<td class={source.error ? 'error' : 'muted'}>{source.error ? m.yes() : m.no()}</td>
					<td class="num">{source.deadLinks}</td>
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
