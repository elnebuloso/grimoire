<script module lang="ts">
	import { resolve } from '$app/paths';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import type { SourceStats } from '#lib/server/stats.js';
	import SourceStatsTable from './SourceStatsTable.svelte';

	const { Story } = defineMeta({ title: 'SourceStatsTable', component: SourceStatsTable });

	const synced: SourceStats = {
		id: 1,
		slug: 'platform-docs',
		name: 'Platform docs',
		description: 'Platform team handbook',
		public: false,
		docsUrl: null,
		pages: 7,
		snippets: 24,
		tokens: 3120,
		lastSync: '2026-10-29T18:06:56.148Z',
		error: false,
		paused: false,
		deadLinks: 0
	};
</script>

<Story
	name="Synced"
	args={{ timeZone: 'UTC', sources: [synced] }}
	play={async ({ canvas }) => {
		const row = canvas.getByRole('row', { name: /platform-docs/ });
		await expect(row).toHaveTextContent('Platform team handbook');
		await expect(row).toHaveTextContent('synced');
		await expect(row).toHaveTextContent('3,120');
		await expect(canvas.getByRole('columnheader', { name: 'Last sync (UTC)' })).toBeVisible();
		await expect(canvas.getByText('10/29/26, 6:06 PM')).toHaveAttribute(
			'datetime',
			synced.lastSync
		);
	}}
/>

<Story
	name="Empty"
	args={{ timeZone: 'UTC', sources: [] }}
	play={async ({ canvas }) => {
		await expect(canvas.getAllByRole('row')).toHaveLength(1);
	}}
/>

<Story
	name="Not synced"
	args={{
		timeZone: 'UTC',
		sources: [
			{
				...synced,
				id: 2,
				slug: 'billing-docs',
				name: 'Billing docs',
				description: '',
				lastSync: null,
				pages: 0
			}
		]
	}}
	play={async ({ canvas }) => {
		const row = canvas.getByRole('row', { name: /billing-docs/ });
		await expect(row).toHaveTextContent('not synced');
		await expect(row).toHaveTextContent('never');
	}}
/>

<Story
	name="Sync error and dead links"
	args={{ timeZone: 'UTC', sources: [{ ...synced, error: true, paused: true, deadLinks: 3 }] }}
	play={async ({ canvas }) => {
		const cells = canvas.getAllByRole('cell');
		await expect(cells[4]).toHaveTextContent('failed');
		await expect(cells[6]).toHaveTextContent('3');
	}}
/>

<Story
	name="Paused"
	args={{ timeZone: 'UTC', sources: [{ ...synced, paused: true }] }}
	play={async ({ canvas }) => {
		await expect(canvas.getAllByRole('cell')[4]).toHaveTextContent('paused');
	}}
/>

<Story
	name="Public and private"
	args={{
		timeZone: 'UTC',
		sources: [
			synced,
			{
				...synced,
				id: 2,
				slug: 'billing-docs',
				name: 'Billing docs',
				public: true,
				docsUrl: 'https://docs.example.com/billing/'
			}
		]
	}}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('row', { name: /platform-docs/ })).toHaveTextContent('private');
		await expect(canvas.getByRole('row', { name: /billing-docs/ })).toHaveTextContent('public');
		await expect(canvas.getByRole('link')).toHaveAttribute(
			'href',
			'https://docs.example.com/billing/'
		);
	}}
/>

<Story
	name="Linked names"
	args={{ timeZone: 'UTC', sources: [synced] }}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('link', { name: 'platform-docs' })).toHaveAttribute(
			'href',
			'/manage/sources/1'
		);
	}}
>
	{#snippet template(args)}
		<SourceStatsTable {...args}>
			{#snippet name(source)}<a href={resolve('/manage/sources/[id]', { id: String(source.id) })}
					>{source.slug}</a
				>{/snippet}
		</SourceStatsTable>
	{/snippet}
</Story>

<Story
	name="Linked dead links"
	args={{ timeZone: 'UTC', sources: [{ ...synced, deadLinks: 3 }] }}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('link', { name: '3 dead links' })).toHaveAttribute(
			'href',
			'/manage/dead-links#source-1'
		);
	}}
>
	{#snippet template(args)}
		<SourceStatsTable {...args}>
			{#snippet deadLinks(source)}<a
					href="{resolve('/manage/dead-links')}#source-{source.id}"
					aria-label="{source.deadLinks} dead links">{source.deadLinks}</a
				>{/snippet}
		</SourceStatsTable>
	{/snippet}
</Story>
