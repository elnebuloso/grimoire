<script lang="ts">
	import { resolve } from '$app/paths';
	import DeadLinkList from '#lib/components/DeadLinkList.svelte';
	import DateTime from '#lib/components/DateTime.svelte';
	import DescriptionList from '#lib/components/DescriptionList.svelte';
	import SourceLabel from '#lib/components/SourceLabel.svelte';
	import SyncError from '#lib/components/SyncError.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { SYNC_FIX } from '#lib/sync-fix.js';
	import type { PageData } from './$types';

	/** The state of a saved source: its sync, problems, overlaps, warnings and dead links. */
	let {
		data
	}: {
		data: PageData & {
			source: NonNullable<PageData['source']>;
			status: NonNullable<PageData['status']>;
		};
	} = $props();
</script>

{#snippet lastCheck()}
	{#if data.status.lastCheckedAt}
		<DateTime value={data.status.lastCheckedAt} timeZone={data.timeZone} />
	{:else}
		{m.never()}
	{/if}
{/snippet}
{#snippet lastSync()}
	{#if data.status.lastSyncedAt}
		<DateTime value={data.status.lastSyncedAt} timeZone={data.timeZone} />
	{:else}
		{m.never()}
	{/if}
{/snippet}
{#snippet commit()}
	{#if data.status.lastCommit}<code>{data.status.lastCommit}</code>{:else}{m.none()}{/if}
{/snippet}

<section class="sheet" aria-labelledby="status">
	<h2 id="status">{m.source_status()}</h2>
	<DescriptionList
		items={[
			[
				m.source_polling(),
				data.source.paused
					? m.source_polling_paused()
					: data.syncsPaused
						? m.source_polling_all_paused()
						: m.active()
			],
			[m.source_last_check(), lastCheck],
			[m.source_last_sync(), lastSync],
			[m.source_indexed_commit(), commit],
			[
				m.source_totals(),
				`${data.status.totals.pages}, ${data.status.totals.snippets}, ${data.status.totals.tokens}`
			]
		]}
	/>
	{#if data.status.error}
		<div class="part">
			<h3>{m.source_error()}</h3>
			<p class="notice alert" role="alert">
				<SyncError error={data.status.error} kind={data.status.errorKind} />
			</p>
			{#if data.status.errorKind}
				<p class="fix">
					{SYNC_FIX[data.status.errorKind]()}
					<a
						href={resolve('/manage/sources/[id]/[[tab=tab]]', {
							id: String(data.source.id),
							tab: 'settings'
						})}>{m.source_fix_in_settings()}</a
					>
				</p>
			{/if}
		</div>
	{/if}
	{#if data.overlaps.length > 0}
		<div class="part">
			<h3>{m.duplicates_title()}</h3>
			<ul class="flagged">
				{#each data.overlaps as { overlap, other } (other.sourceId)}
					<li>
						{overlap === 'duplicate' ? m.source_duplicate_of() : m.source_overlaps_with()}
						<SourceLabel
							name={other.name}
							slug={other.source}
							href={resolve('/manage/sources/[id]/[[tab=tab]]', { id: String(other.sourceId) })}
						/>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
	{#if data.status.warnings.length > 0}
		<div class="part">
			<h3>{m.source_warnings()}</h3>
			<ul class="flagged">
				{#each data.status.warnings as warning, index (index)}
					<li><code>{warning}</code></li>
				{/each}
			</ul>
		</div>
	{/if}
	{#if data.status.deadLinks.length > 0}
		<div class="part">
			<h3>{m.dead_links()}</h3>
			<DeadLinkList
				links={data.status.deadLinks}
				source={{ id: data.source.id, path: data.source.path }}
			/>
		</div>
	{/if}
</section>

<style>
	.sheet {
		display: grid;
		gap: var(--s4);
	}
	.part {
		display: grid;
		gap: var(--s3);
		min-width: 0;
		padding-top: var(--s4);
		border-top: 1px solid var(--line);
	}
	.fix {
		color: var(--ink-2);
	}
	.flagged {
		display: grid;
		gap: var(--s2);
		list-style: none;
	}
	.flagged li {
		padding-inline-start: var(--s4);
		border-inline-start: 3px solid var(--warn);
		overflow-wrap: anywhere;
	}
	.flagged code {
		font-size: var(--fs-3);
	}
</style>
