<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { formatDate } from '#lib/time-zone.js';
	import type { DailyRequests } from '#lib/server/api-keys.js';

	/** The requests of one API key per day, folded behind their total. */
	let { days }: { days: DailyRequests[] } = $props();

	const total = $derived(days.reduce((sum, day) => sum + day.requests, 0));
	const count = (value: number) => value.toLocaleString(getLocale());
</script>

{#if days.length === 0}
	<p class="muted">{m.requests_none()}</p>
{:else}
	<details>
		<summary>{m.requests_summary({ count: count(total) })}</summary>
		<table>
			<caption class="muted">{m.requests_per_day()}</caption>
			<thead>
				<tr>
					<th scope="col">{m.requests_day()}</th>
					<th scope="col" class="num">{m.requests_count()}</th>
				</tr>
			</thead>
			<tbody>
				{#each days as day (day.day)}
					<tr>
						<td>{formatDate(day.day, getLocale())}</td>
						<td class="num">{count(day.requests)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</details>
{/if}

<style>
	table {
		width: auto;
		margin-top: var(--s2);
	}
	caption {
		text-align: start;
		font-size: var(--fs-3);
	}
</style>
