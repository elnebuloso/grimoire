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
		pages: 7,
		snippets: 24,
		tokens: 3120,
		lastSync: '2026-10-29T18:06:56.148Z',
		error: false,
		deadLinks: 0
	};
</script>

<Story
	name="Synced"
	args={{ timeZone: 'UTC', sources: [synced] }}
	play={async ({ canvas }) => {
		const row = canvas.getByRole('row', { name: /platform-docs/ });
		await expect(row).toHaveTextContent('Platform team handbook');
		await expect(canvas.getByText('Oct 29, 2026, 6:06 PM UTC')).toHaveAttribute(
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
		await expect(canvas.getByRole('row', { name: /billing-docs/ })).toHaveTextContent('not synced');
	}}
/>

<Story
	name="Sync error and dead links"
	args={{ timeZone: 'UTC', sources: [{ ...synced, error: true, deadLinks: 3 }] }}
	play={async ({ canvas }) => {
		const cells = canvas.getAllByRole('cell');
		await expect(cells[5]).toHaveTextContent('yes');
		await expect(cells[6]).toHaveTextContent('3');
	}}
/>

<Story
	name="Public and private"
	args={{
		timeZone: 'UTC',
		sources: [
			synced,
			{ ...synced, id: 2, slug: 'billing-docs', name: 'Billing docs', public: true }
		]
	}}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('row', { name: /platform-docs/ })).toHaveTextContent('private');
		await expect(canvas.getByRole('row', { name: /billing-docs/ })).toHaveTextContent('public');
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
