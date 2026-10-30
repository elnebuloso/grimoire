<script module lang="ts">
	import { resolve } from '$app/paths';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import type { ProjectStats } from '#lib/server/stats.js';
	import ProjectStatsTable from './ProjectStatsTable.svelte';

	const { Story } = defineMeta({ title: 'ProjectStatsTable', component: ProjectStatsTable });

	const synced: ProjectStats = {
		id: 1,
		slug: 'platform',
		name: 'Platform',
		description: 'Platform team handbook',
		sources: 2,
		pages: 7,
		snippets: 24,
		tokens: 3120,
		oldestSync: '2026-10-29T18:06:56.148Z',
		sourcesWithError: 0,
		deadLinks: 0
	};
</script>

<Story
	name="Synced"
	args={{ timeZone: 'UTC', projects: [synced] }}
	play={async ({ canvas }) => {
		const row = canvas.getByRole('row', { name: /platform/ });
		await expect(row).toHaveTextContent('Platform team handbook');
		await expect(canvas.getByText('Oct 29, 2026, 6:06 PM UTC')).toHaveAttribute(
			'datetime',
			synced.oldestSync
		);
	}}
/>

<Story
	name="Empty"
	args={{ timeZone: 'UTC', projects: [] }}
	play={async ({ canvas }) => {
		await expect(canvas.getAllByRole('row')).toHaveLength(1);
	}}
/>

<Story
	name="Not synced and without sources"
	args={{
		timeZone: 'UTC',
		projects: [
			{
				...synced,
				id: 2,
				slug: 'billing',
				name: 'Billing',
				description: '',
				oldestSync: null,
				pages: 0
			},
			{ ...synced, id: 3, slug: 'drafts', name: 'Drafts', sources: 0, oldestSync: null, pages: 0 }
		]
	}}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('row', { name: /billing/ })).toHaveTextContent('not synced');
		await expect(canvas.getByRole('row', { name: /drafts/ })).toHaveTextContent('no sources');
	}}
/>

<Story
	name="Sync errors and dead links"
	args={{ timeZone: 'UTC', projects: [{ ...synced, sourcesWithError: 1, deadLinks: 3 }] }}
	play={async ({ canvas }) => {
		const cells = canvas.getAllByRole('cell');
		await expect(cells[5]).toHaveTextContent('1');
		await expect(cells[6]).toHaveTextContent('3');
	}}
/>

<Story
	name="Linked names"
	args={{ timeZone: 'UTC', projects: [synced] }}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('link', { name: 'platform' })).toHaveAttribute(
			'href',
			'/manage/projects/1'
		);
	}}
>
	{#snippet template(args)}
		<ProjectStatsTable {...args}>
			{#snippet name(project)}<a href={resolve('/manage/projects/[id]', { id: String(project.id) })}
					>{project.slug}</a
				>{/snippet}
		</ProjectStatsTable>
	{/snippet}
</Story>
