<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHead from '#lib/components/PageHead.svelte';
	import DescriptionList from '#lib/components/DescriptionList.svelte';
	import SourceStatsTable from '#lib/components/SourceStatsTable.svelte';
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

	// Where on the source page a problem is fixed: its settings, or its status for what it reports.
	function section(problem: Problem): string {
		return problem.kind === 'error' || problem.kind === 'paused' ? 'settings' : 'status';
	}
</script>

<PageHead title={m.admin_title({ name: data.instanceName })} namesInstance />

{#if data.syncsPaused}
	<p class="notice warn" role="status">
		{m.syncs_paused_notice()} <a href={resolve('/manage/settings')}>{m.settings_title()}</a>
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
						<a
							href="{resolve('/manage/sources/[id]', { id: String(item.sourceId) })}#{section(
								item
							)}">{item.source}</a
						>
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
		<h2 id="overview">{m.admin_numbers()}</h2>
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

<section class="sheet flush" aria-labelledby="sources">
	<div class="sheet-head">
		<h2 id="sources">{m.sources()}</h2>
		<a class="button primary" href={resolve('/manage/sources/[id]', { id: 'new' })}
			>{m.source_new()}</a
		>
	</div>
	{#if data.sources.length === 0}
		<p class="muted">{m.no_sources_yet()}</p>
	{:else}
		<SourceStatsTable sources={data.sources} timeZone={data.timeZone}>
			{#snippet name(source)}
				<a href={resolve('/manage/sources/[id]', { id: String(source.id) })}>{source.name}</a>
			{/snippet}
			{#snippet deadLinks(source)}
				{#if source.deadLinks > 0}
					<a
						href="{resolve('/manage/dead-links')}#source-{source.id}"
						aria-label={source.deadLinks === 1
							? m.admin_dead_link()
							: m.admin_dead_links({ count: source.deadLinks })}
						>{source.deadLinks.toLocaleString(getLocale())}</a
					>
				{:else}0{/if}
			{/snippet}
		</SourceStatsTable>
	{/if}
</section>

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
	.attention > li > a:first-child {
		font-family: var(--mono);
		font-size: 14px;
		font-weight: 500;
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
