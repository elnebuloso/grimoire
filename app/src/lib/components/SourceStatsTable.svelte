<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { Snippet } from 'svelte';
	import DateTime from './DateTime.svelte';
	import type { SourceStats } from '#lib/server/stats.js';

	let {
		sources,
		timeZone,
		name
	}: { sources: SourceStats[]; timeZone: string; name?: Snippet<[SourceStats]> } = $props();
</script>

<!-- Focusable, so a keyboard can scroll the table where it holds no link. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="table-scroll" role="region" aria-label={m.sources()} tabindex="0">
	<table>
		<thead>
			<tr>
				<th scope="col">{m.source()}</th>
				<th scope="col">{m.visibility()}</th>
				<th scope="col">{m.pages()}</th>
				<th scope="col">{m.snippets()}</th>
				<th scope="col">{m.tokens()}</th>
				<th scope="col">{m.source_last_sync()}</th>
				<th scope="col">{m.sync_error()}</th>
				<th scope="col">{m.dead_links()}</th>
			</tr>
		</thead>
		<tbody>
			{#each sources as source (source.slug)}
				<tr>
					<th scope="row">
						{#if name}{@render name(source)}{:else}{source.name}{/if}
						<code>{source.slug}</code>
						{#if source.description}<br />{source.description}{/if}
						{#if source.docsUrl}<br /><a href={source.docsUrl} rel="external"
								>{m.source_docs_link()}</a
							>{/if}
					</th>
					<td>{source.public ? m.visibility_public() : m.visibility_private()}</td>
					<td>{source.pages}</td>
					<td>{source.snippets}</td>
					<td>{source.tokens}</td>
					<td>
						{#if source.lastSync}
							<DateTime value={source.lastSync} {timeZone} />
						{:else}
							{m.not_synced()}
						{/if}
					</td>
					<td>{source.error ? m.yes() : m.no()}</td>
					<td>{source.deadLinks}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
