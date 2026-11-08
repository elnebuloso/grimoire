<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, within } from 'storybook/test';
	import type { ListPage } from '#lib/list.js';
	import SourceLabel from './SourceLabel.svelte';
	import SourceTable, { type SourceRow } from './SourceTable.svelte';

	const { Story } = defineMeta({ title: 'SourceTable', component: SourceTable });

	type Source = SourceRow & { name: string; slug: string };

	const rows: Source[] = [
		{
			id: 1,
			name: 'Billing docs',
			slug: 'billing-docs',
			visibility: 'public',
			pages: 42,
			snippets: 310,
			tokens: 48200,
			lastSync: '2026-11-06T09:00:00Z',
			lastCheck: '2026-11-06T09:00:00Z',
			error: false,
			paused: false,
			deadLinks: 3
		},
		{
			id: 2,
			name: 'Platform archive',
			slug: 'platform-archive',
			visibility: 'internal',
			pages: 0,
			snippets: 0,
			tokens: 0,
			lastSync: null,
			lastCheck: '2026-11-06T09:05:00Z',
			error: true,
			paused: false,
			deadLinks: 0
		}
	];
	const list: ListPage<Source> = { rows, total: rows.length, page: 1, pageCount: 1 };
	const noSources: ListPage<Source> = { rows: [], total: 0, page: 1, pageCount: 1 };
</script>

<Story
	name="Linked, as in the management area"
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('link', { name: 'Billing docs' })).toHaveAttribute(
			'href',
			'/manage/sources/1'
		);
		await expect(canvas.getByRole('link', { name: '3 dead links' })).toHaveAttribute(
			'href',
			'/manage/dead-links#source-1'
		);
		const archive = canvas.getByRole('row', { name: /Platform archive/ });
		await expect(within(archive).getByText('sync error')).toBeVisible();
		await expect(within(archive).getByText('internal')).toBeVisible();
	}}
>
	{#snippet template()}
		<SourceTable
			{list}
			timeZone="UTC"
			deadLinksHref={(source) => `/manage/dead-links#source-${source.id}`}
		>
			{#snippet name(source)}
				<SourceLabel name={source.name} slug={source.slug} href="/manage/sources/{source.id}" />
			{/snippet}
			{#snippet empty()}<p>No sources yet.</p>{/snippet}
		</SourceTable>
	{/snippet}
</Story>

<Story
	name="Without links, as on the start page"
	play={async ({ canvas }) => {
		await expect(canvas.queryByRole('link')).toBeNull();
		const billing = canvas.getByRole('row', { name: /Billing docs/ });
		await expect(within(billing).getByText('3')).toBeVisible();
		await expect(within(billing).getByText('synced')).toBeVisible();
		await expect(canvas.getByRole('searchbox')).toBeVisible();
	}}
>
	{#snippet template()}
		<SourceTable {list} timeZone="UTC">
			{#snippet name(source)}<SourceLabel name={source.name} slug={source.slug} />{/snippet}
			{#snippet empty()}<p>No sources yet.</p>{/snippet}
		</SourceTable>
	{/snippet}
</Story>

<Story
	name="Empty"
	play={async ({ canvas }) => {
		await expect(canvas.getByText('No sources yet.')).toBeVisible();
		await expect(canvas.queryByRole('table')).toBeNull();
	}}
>
	{#snippet template()}
		<SourceTable list={noSources} timeZone="UTC">
			{#snippet name(source)}<SourceLabel name={String(source.id)} slug="" />{/snippet}
			{#snippet empty()}<p>No sources yet.</p>{/snippet}
		</SourceTable>
	{/snippet}
</Story>
