<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto, refreshAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import PageHead from '#lib/components/PageHead.svelte';
	import SourceSettingsForm from '#lib/components/SourceSettingsForm.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import { VISIBILITY_LABEL } from '#lib/visibility-label.js';
	import TabNav from '#lib/components/TabNav.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { submitWithToast } from '#lib/forms.js';
	import { showToast } from '#lib/toasts.svelte.js';
	import { NEW_SOURCE_FIELDS, toSourceFields } from '#lib/source-fields.js';
	import { sourceState } from '#lib/source-state.js';
	import HistoryTab from './HistoryTab.svelte';
	import PagesTab from './PagesTab.svelte';
	import SettingsTab from './SettingsTab.svelte';
	import StatusTab from './StatusTab.svelte';
	import { pollSyncEnd } from './sync-poll';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// The end of a queued sync refreshes the page data once and reports the outcome. Every tab
	// shares this component, so the poll goes on when the tab changes.
	$effect(() => {
		if (!data.syncPending || !data.source) return;
		const id = data.source.id;
		return pollSyncEnd(id, async () => {
			await refreshAll();
			if (data.source?.id !== id) return;
			const name = data.source.name;
			if (data.status?.error) showToast(m.source_sync_failed({ name }));
			else showToast(m.source_sync_done({ name }));
		});
	});

	// Links from before the sub pages pointed at sections of one page.
	$effect(() => {
		if (data.source && data.tab === 'status' && location.hash === '#settings') {
			goto(tabHref('settings'), { replace: true });
		}
	});

	const tabHref = (tab?: 'pages' | 'history' | 'settings') =>
		resolve('/manage/sources/[id]/[[tab=tab]]', { id: String(data.source!.id), tab });
	const tabs = $derived(
		data.source
			? [
					{ href: tabHref(), label: m.source_status(), current: data.tab === 'status' },
					{ href: tabHref('pages'), label: m.pages(), current: data.tab === 'pages' },
					{
						href: tabHref('history'),
						label: m.source_tab_history(),
						current: data.tab === 'history'
					},
					{
						href: tabHref('settings'),
						label: m.source_settings(),
						current: data.tab === 'settings'
					}
				]
			: []
	);

	const headState = $derived(
		data.source && data.status
			? sourceState(
					{
						error: data.status.error !== null,
						paused: data.source.paused,
						lastSync: data.status.lastSyncedAt
					},
					data.syncPending
				)
			: 'never'
	);

	// What the settings form shows: what was sent, after a refusal or a test, else what is stored.
	const settingsForm = $derived({
		values: form?.values ?? {
			...(data.source ? toSourceFields(data.source) : NEW_SOURCE_FIELDS),
			removeToken: false,
			encryptedToken: ''
		},
		refusal:
			form && typeof form.error === 'string'
				? {
						error: form.error,
						field: form.field,
						overlap: 'overlap' in form && form.overlap === true
					}
				: undefined,
		access: form?.access,
		source: data.source,
		globalSchedule: data.globalSchedule,
		timeZone: data.timeZone,
		nextCheck: data.nextCheck,
		instanceTitle: data.instanceTitle
	});
</script>

{#if data.source}
	<div class="head">
		<PageHead
			title={m.source_title({ name: data.source.name })}
			documentTitle={data.preview ? m.source_preview_title({ file: data.preview.file }) : undefined}
			back={{ href: resolve('/manage/sources'), label: m.all_sources_link() }}
		>
			<p class="facts">
				<code>{data.source.slug}</code>
				<span>{VISIBILITY_LABEL[data.source.visibility]()}</span>
				<span aria-live="polite"><StatusBadge state={headState} /></span>
				{#if data.source.docsUrl}
					<a href={data.source.docsUrl} rel="external">{m.source_docs_link()}</a>
				{/if}
			</p>
		</PageHead>
		<!-- Only the page data reloads: the settings form keeps what was entered, a tested token
		included, which following the redirect would drop. -->
		<form
			method="post"
			action="?/sync"
			use:enhance={submitWithToast({
				success: () => m.source_sync_started({ name: data.source!.name })
			})}
		>
			<button class="primary" disabled={data.syncPending} aria-busy={data.syncPending}
				>{m.source_sync_now()}</button
			>
		</form>
	</div>
	<TabNav label={m.source_tabs()} {tabs} />
{:else}
	<PageHead
		title={m.source_new()}
		back={{ href: resolve('/manage/sources'), label: m.all_sources_link() }}
	/>
{/if}

{#if data.source && data.status}
	{@const source = data.source}
	{@const status = data.status}
	{#if data.tab === 'status'}
		<StatusTab data={{ ...data, source, status }} />
	{:else if data.tab === 'pages'}
		<PagesTab data={{ ...data, source, status }} />
	{:else if data.tab === 'history'}
		<HistoryTab data={{ ...data, status }} />
	{:else}
		<SettingsTab data={{ ...data, source }} form={settingsForm} />
	{/if}
{:else}
	<div class="new"><SourceSettingsForm {...settingsForm} /></div>
{/if}

<style>
	.head {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: var(--s5);
	}
	.facts {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--s2) var(--s4);
	}
	.new {
		max-width: 52rem;
	}
</style>
