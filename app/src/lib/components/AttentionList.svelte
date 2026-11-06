<script lang="ts">
	import { resolve } from '$app/paths';
	import SourceLabel from './SourceLabel.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { SYNC_FIX } from '#lib/sync-fix.js';
	import type { Problem, ProblemGroup } from '#lib/server/admin/status.js';

	/** What needs an admin to act, by kind; each group with its first entries. */
	let { groups }: { groups: ProblemGroup[] } = $props();

	const HEADING: Record<Problem['kind'], (count: { count: number }) => string> = {
		error: m.attention_group_error,
		duplicate: m.attention_group_duplicate,
		warnings: m.attention_group_warnings,
		deadLinks: m.attention_group_dead_links,
		paused: m.attention_group_paused,
		neverSynced: m.attention_group_never_synced
	};

	const sources = resolve('/manage/sources');
	const ALL: Record<Problem['kind'], string> = {
		error: `${sources}?status=error`,
		duplicate: resolve('/manage/duplicates'),
		warnings: `${sources}?warnings=yes`,
		deadLinks: resolve('/manage/dead-links'),
		paused: `${sources}?status=paused`,
		neverSynced: `${sources}?status=never`
	};

	const statusOf = (sourceId: number) =>
		resolve('/manage/sources/[id]/[[tab=tab]]', { id: String(sourceId) });

	// Where a problem is fixed: the settings of the source, or its status for what it reports.
	function fixAt(problem: Problem): string {
		return problem.kind === 'error' || problem.kind === 'paused'
			? resolve('/manage/sources/[id]/[[tab=tab]]', {
					id: String(problem.sourceId),
					tab: 'settings'
				})
			: statusOf(problem.sourceId);
	}
</script>

<div class="groups">
	{#each groups as group (group.kind)}
		<section class="group" aria-labelledby="attention-{group.kind}">
			<h3 id="attention-{group.kind}">{HEADING[group.kind]({ count: group.total })}</h3>
			<ul class="attention">
				{#each group.shown as item (`${item.sourceId}-${item.kind}`)}
					<li class:error={item.kind === 'error'}>
						<SourceLabel name={item.name} slug={item.source} href={fixAt(item)} />
						{#if item.kind === 'error'}
							– {m.admin_sync_error({ error: item.error })}
							<p class="fix">{SYNC_FIX[item.errorKind]()}</p>
						{:else if item.kind === 'duplicate'}
							– {item.overlap === 'duplicate'
								? m.attention_duplicate_of()
								: m.attention_overlaps_with()}
							<SourceLabel
								name={item.other.name}
								slug={item.other.source}
								href={statusOf(item.other.sourceId)}
							/>
						{:else if item.kind === 'warnings'}
							– {item.warnings.length === 1
								? m.admin_sync_warning()
								: m.admin_sync_warnings({ count: item.warnings.length })}
							<ul>
								{#each item.warnings as warning, index (index)}<li>
										<code>{warning}</code>
									</li>{/each}
							</ul>
						{:else if item.kind === 'deadLinks'}
							–
							<a href="{resolve('/manage/dead-links')}#source-{item.sourceId}"
								>{item.count === 1
									? m.admin_dead_link()
									: m.admin_dead_links({ count: item.count })}</a
							>
						{:else if item.kind === 'paused'}
							– {item.neverSynced
								? m.admin_polling_paused_never_synced()
								: m.admin_polling_paused()}
						{:else}
							– {m.admin_never_synced()}
						{/if}
					</li>
				{/each}
			</ul>
			{#if group.total > group.shown.length}
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved above -->
				<a class="all" href={ALL[group.kind]} aria-describedby="attention-{group.kind}"
					>{m.attention_show_all({ count: group.total })}</a
				>
			{/if}
		</section>
	{/each}
</div>

<style>
	.groups {
		display: grid;
		gap: var(--s5);
	}
	.group {
		display: grid;
		gap: var(--s2);
	}
	.attention {
		display: grid;
		gap: var(--s2);
		list-style: none;
	}
	.attention > li {
		padding: var(--s2) 0 var(--s2) var(--s4);
		border-inline-start: 3px solid var(--warn);
		overflow-wrap: anywhere;
	}
	.attention > li.error {
		border-color: var(--err);
	}
	/* Warnings of a source: one step quieter than the source they belong to. */
	.attention ul {
		display: grid;
		gap: var(--s1);
		margin-top: var(--s2);
		list-style: none;
	}
	.attention ul li {
		padding-inline-start: var(--s3);
		border-inline-start: 1px solid var(--line);
		color: var(--ink-2);
	}
	.fix {
		margin-top: var(--s1);
		color: var(--ink-2);
	}
	.attention code {
		font-size: 13px;
	}
	.all {
		justify-self: start;
	}
</style>
