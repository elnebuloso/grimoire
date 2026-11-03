<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHead from '#lib/components/PageHead.svelte';
	import TableScroll from '#lib/components/TableScroll.svelte';
	import DateTime from '#lib/components/DateTime.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// The start page searches everything the admin may read; the sources asked for narrow nothing.
	const tryQuery = (question: string) => new URLSearchParams({ q: question }).toString();
</script>

<PageHead title={m.missed_title()}><p>{m.missed_intro()}</p></PageHead>

<section class="sheet flush">
	{#if data.queries.length === 0}
		<p class="muted">{m.missed_none()}</p>
	{:else}
		<TableScroll label={m.missed_title()}>
			<table>
				<thead>
					<tr>
						<th scope="col">{m.query_question()}</th>
						<th scope="col">{m.sources()}</th>
						<th scope="col" class="num">{m.missed_count()}</th>
						<th scope="col">{m.missed_last_asked()}</th>
					</tr>
				</thead>
				<tbody>
					{#each data.queries as query (`${query.sources}\n${query.question}`)}
						<tr>
							<td>
								<a href="{resolve('/')}?{tryQuery(query.question)}#query">{query.question}</a>
							</td>
							<td>
								{#if query.sources}<code>{query.sources.join(', ')}</code
									>{:else}{m.query_all_sources()}{/if}
							</td>
							<td class="num">{query.count}</td>
							<td class="when"><DateTime value={query.lastAskedAt} timeZone={data.timeZone} /></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</TableScroll>
	{/if}
</section>

<style>
	.when {
		color: var(--ink-2);
		white-space: nowrap;
	}
	/* On a phone the date may break between its parts, so the column fits instead of lying past
	the scroll edge. */
	@media (max-width: 40rem) {
		.when {
			white-space: normal;
		}
	}
</style>
