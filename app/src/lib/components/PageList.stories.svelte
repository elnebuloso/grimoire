<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent } from 'storybook/test';
	import type { PageSummary } from '#lib/server/admin/status.js';
	import PageList from './PageList.svelte';

	const { Story } = defineMeta({ title: 'PageList', component: PageList });

	const pages: PageSummary[] = [
		{ file: 'index.md', title: 'Platform handbook', snippets: 4, tokens: 380 },
		{ file: 'runbooks/rollback.md', title: 'Rolling back a release', snippets: 3, tokens: 240 },
		{ file: 'services/auth.md', title: 'Auth service', snippets: 5, tokens: 410 }
	];
	const args = { pages, sourceId: 1 };
</script>

<Story
	name="All pages"
	{args}
	play={async ({ canvas }) => {
		await expect(canvas.getAllByRole('listitem')).toHaveLength(3);
		await expect(canvas.getByRole('link', { name: 'runbooks/rollback.md' })).toHaveAttribute(
			'href',
			'/manage/sources/1?preview=runbooks%2Frollback.md'
		);
	}}
/>

<Story
	name="Filtered by typing"
	{args}
	play={async ({ canvas }) => {
		const filter = canvas.getByRole('searchbox', { name: 'Filter pages' });

		await userEvent.type(filter, 'ROLL');
		await expect(canvas.getAllByRole('listitem')).toHaveLength(1);
		await expect(canvas.getByRole('link', { name: 'runbooks/rollback.md' })).toBeVisible();

		await userEvent.clear(filter);
		await userEvent.type(filter, 'auth service');
		await expect(canvas.getByRole('listitem')).toHaveTextContent('services/auth.md');

		await userEvent.clear(filter);
		await expect(canvas.getAllByRole('listitem')).toHaveLength(3);
	}}
/>

<Story
	name="Filter matching nothing"
	{args}
	play={async ({ canvas }) => {
		await userEvent.type(canvas.getByRole('searchbox', { name: 'Filter pages' }), 'kubernetes');
		await expect(canvas.queryAllByRole('listitem')).toHaveLength(0);
		await expect(canvas.getByText('No page matches the filter.')).toBeVisible();
	}}
/>
