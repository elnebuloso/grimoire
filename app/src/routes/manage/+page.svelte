<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHead from '#lib/components/PageHead.svelte';
	import DescriptionList from '#lib/components/DescriptionList.svelte';
	import SourceLabel from '#lib/components/SourceLabel.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type { SyncErrorKind } from '#lib/server/sync/error-kind.js';
	import type { Problem } from '#lib/server/admin/status.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const FIX: Record<SyncErrorKind, () => string> = {
		path: m.admin_fix_path,
		branch: m.admin_fix_branch,
		access: m.admin_fix_access,
		unreachable: m.admin_fix_unreachable,
		deadline: m.admin_fix_deadline,
		aborted: m.admin_fix_aborted,
		noPage: m.admin_fix_no_page,
		unknown: m.admin_fix_unknown
	};

	// Where a problem is fixed: the settings of the source, or its status for what it reports.
	function fixAt(problem: Problem): string {
		const id = String(problem.sourceId);
		return problem.kind === 'error' || problem.kind === 'paused'
			? resolve('/manage/sources/[id]/[[tab=tab]]', { id, tab: 'settings' })
			: resolve('/manage/sources/[id]/[[tab=tab]]', { id });
	}
</script>

<PageHead title={m.admin_title({ name: data.instanceTitle })} namesInstance />

{#if data.syncsPaused}
	<p class="notice warn" role="status">
		{m.syncs_paused_notice()}
		<a href={resolve('/manage/settings')}>{m.settings_title()}</a>
	</p>
{/if}

{#snippet deadLinks()}
	<a
		href={resolve('/manage/dead-links')}
		aria-label={data.totals.deadLinks === 1
			? m.admin_dead_link()
			: m.admin_dead_links({ count: data.totals.deadLinks })}
		>{data.totals.deadLinks.toLocaleString(getLocale())}</a
	>
{/snippet}

<div class="split">
	<section class="sheet" aria-labelledby="attention">
		<h2 id="attention">{m.admin_attention()}</h2>
		{#if data.attention.length === 0}
			<p class="muted">{m.admin_all_fine()}</p>
		{:else}
			<ul class="attention">
				{#each data.attention as item (`${item.sourceId}-${item.kind}`)}
					<li class:error={item.kind === 'error'}>
						<SourceLabel name={item.name} slug={item.source} href={fixAt(item)} />
						{#if item.kind === 'error'}
							– {m.admin_sync_error({ error: item.error })}
							<p class="fix">{FIX[item.errorKind]()}</p>
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
		{/if}
	</section>
	<section class="sheet" aria-labelledby="overview">
		<h2 id="overview">{m.admin_overview()}</h2>
		<DescriptionList
			numbers
			items={[
				[m.sources(), data.totals.sources],
				[m.pages(), data.totals.pages],
				[m.snippets(), data.totals.snippets],
				[m.tokens(), data.totals.tokens],
				[m.dead_links(), deadLinks],
				[m.api_keys(), data.totals.apiKeys]
			]}
		/>
	</section>
</div>

<style>
	/* The problems lead; the totals sit beside them, and both sheets end on one line. */
	.split {
		display: grid;
		gap: var(--s5);
		align-items: start;
	}
	@media (min-width: 64rem) {
		.split {
			grid-template-columns: minmax(0, 1fr) 19rem;
			align-items: stretch;
		}
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
</style>
