<script lang="ts">
	import { resolve } from '$app/paths';
	import DateTime from '#lib/components/DateTime.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const tryQuery = (question: string, sources: string | null) =>
		new URLSearchParams([
			['q', question],
			...(sources?.split(', ') ?? []).map((source) => ['source', source])
		]).toString();
</script>

<h1>{m.missed_title()}</h1>
<p>{m.missed_intro()}</p>

{#if data.queries.length === 0}
	<p>{m.missed_none()}</p>
{:else}
	<table>
		<thead>
			<tr>
				<th>{m.query_question()}</th>
				<th>{m.query_sources()}</th>
				<th>{m.missed_count()}</th>
				<th>{m.missed_last_asked()}</th>
			</tr>
		</thead>
		<tbody>
			{#each data.queries as query (`${query.sources}\n${query.question}`)}
				<tr>
					<td>
						<a href="{resolve('/manage/query')}?{tryQuery(query.question, query.sources)}"
							>{query.question}</a
						>
					</td>
					<td>{query.sources ?? m.query_all_sources()}</td>
					<td>{query.count}</td>
					<td><DateTime value={query.lastAskedAt} timeZone={data.timeZone} /></td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
