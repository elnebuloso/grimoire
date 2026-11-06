<script lang="ts">
	import DataTable from '#lib/components/DataTable.svelte';
	import DateTime from '#lib/components/DateTime.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import SyncError from '#lib/components/SyncError.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { wholeList } from '#lib/list.js';
	import type { PageData } from './$types';

	/** The sync runs of a saved source, the latest first. */
	let { data }: { data: PageData & { status: NonNullable<PageData['status']> } } = $props();
</script>

<section class="sheet" aria-labelledby="history">
	<h2 id="history">{m.source_history()}</h2>
	<DataTable
		label={m.source_history()}
		list={wholeList(data.status.history)}
		key={(run) => run.finishedAt}
		columns={[
			{ label: m.source_history_when() },
			{ label: m.source_history_outcome() },
			{ label: m.source_commit() },
			{ label: m.source_error() }
		]}
	>
		{#snippet row(run)}
			<td class="when">
				{#if run.runs > 1}
					<span><DateTime value={run.startedAt} timeZone={data.timeZone} /> –</span>
					<span><DateTime value={run.finishedAt} timeZone={data.timeZone} /></span>
					<span class="runs">({m.source_history_runs({ runs: run.runs })})</span>
				{:else}
					<DateTime value={run.finishedAt} timeZone={data.timeZone} />
				{/if}
			</td>
			<td><StatusBadge state={run.outcome} /></td>
			<td
				>{#if run.commit}<code title={run.commit}>{run.commit.slice(0, 12)}</code>{/if}</td
			>
			<td
				>{#if run.error}<SyncError error={run.error} kind={run.errorKind} />{/if}</td
			>
		{/snippet}
		{#snippet empty()}<p class="muted">{m.source_history_none()}</p>{/snippet}
	</DataTable>
</section>

<style>
	/* A date breaks between its parts, never inside them: a run range is start, end and count on
	lines of their own instead of one word per line in a narrow column. */
	.when {
		white-space: nowrap;
	}
	.when span {
		display: block;
	}
	.runs {
		color: var(--ink-2);
	}
	td:has(code[title]) {
		white-space: nowrap;
	}
</style>
