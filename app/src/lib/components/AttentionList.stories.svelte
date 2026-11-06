<script module lang="ts">
	import { sourceFilterQuery } from '#lib/source-state.js';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, within } from 'storybook/test';
	import AttentionList from './AttentionList.svelte';
	import type { Problem } from '#lib/server/admin/status.js';

	const { Story } = defineMeta({ title: 'AttentionList', component: AttentionList });

	const auth = { sourceId: 1, source: 'auth-service', name: 'Auth Service' };
	const billing = { sourceId: 2, source: 'billing-docs', name: 'Billing' };
	const platform = { sourceId: 3, source: 'platform-docs', name: 'Platform' };

	const error: Problem = {
		...auth,
		kind: 'error',
		error: 'source path "docs" does not exist in the repository',
		errorKind: 'path'
	};
	const duplicate: Problem = {
		...platform,
		kind: 'duplicate',
		overlap: 'duplicate',
		other: { sourceId: 4, source: 'platform-next', name: 'Platform next' }
	};
	const overlap: Problem = {
		...billing,
		kind: 'duplicate',
		overlap: 'overlap',
		other: { sourceId: 5, source: 'billing-api', name: 'Billing API' }
	};

	const neverSynced = Array.from({ length: 5 }, (_, index) => ({
		sourceId: 10 + index,
		source: `team-${index + 1}-docs`,
		name: `Team ${index + 1}`,
		kind: 'neverSynced' as const
	}));
</script>

<Story
	name="Every kind"
	args={{
		groups: [
			{ kind: 'error', total: 1, shown: [error] },
			{ kind: 'duplicate', total: 1, shown: [duplicate] },
			{
				kind: 'warnings',
				total: 1,
				shown: [
					{ ...billing, kind: 'warnings', warnings: ['index.md: include "fees.md" not found'] }
				]
			},
			{ kind: 'deadLinks', total: 1, shown: [{ ...platform, kind: 'deadLinks', count: 3 }] },
			{ kind: 'paused', total: 1, shown: [{ ...auth, kind: 'paused', neverSynced: false }] },
			{ kind: 'neverSynced', total: 1, shown: [neverSynced[0]] }
		]
	}}
	play={async ({ canvas }) => {
		await expect(canvas.getAllByRole('heading').map((heading) => heading.textContent)).toEqual([
			'Sync errors (1)',
			'Duplicates and overlaps (1)',
			'Sync warnings (1)',
			'Dead links (1)',
			'Polling paused (1)',
			'Never synced (1)'
		]);
		const errors = within(canvas.getByRole('region', { name: 'Sync errors (1)' }));
		await expect(errors.getByText(/Correct "Path in the repository"/)).toBeVisible();
		await expect(errors.getByRole('link', { name: 'Auth Service' })).toHaveAttribute(
			'href',
			'/manage/sources/1/settings'
		);
		await expect(canvas.getByRole('link', { name: '3 dead links' })).toHaveAttribute(
			'href',
			'/manage/dead-links#source-3'
		);
		// Nothing more to show in any group.
		await expect(canvas.queryByRole('link', { name: /^Show all/ })).toBeNull();
	}}
/>

<Story
	name="Duplicates only"
	args={{ groups: [{ kind: 'duplicate', total: 2, shown: [overlap, duplicate] }] }}
	play={async ({ canvas }) => {
		const items = canvas.getAllByRole('listitem');
		await expect(items[0]).toHaveTextContent(/Billing.*overlaps with.*Billing API/s);
		await expect(items[1]).toHaveTextContent(/Platform.*duplicate of.*Platform next/s);
		await expect(canvas.getByRole('link', { name: 'Platform' })).toHaveAttribute(
			'href',
			'/manage/sources/3'
		);
		await expect(canvas.getByRole('link', { name: 'Platform next' })).toHaveAttribute(
			'href',
			'/manage/sources/4'
		);
	}}
/>

<Story
	name="More than five"
	args={{
		groups: [
			{ kind: 'neverSynced', total: 12, shown: neverSynced },
			{ kind: 'warnings', total: 6, shown: [] }
		]
	}}
	play={async ({ canvas }) => {
		const never = within(canvas.getByRole('region', { name: 'Never synced (12)' }));
		await expect(never.getAllByRole('listitem')).toHaveLength(5);
		await expect(never.getByRole('link', { name: 'Show all 12' })).toHaveAttribute(
			'href',
			`/manage/sources${sourceFilterQuery('status', 'never')}`
		);
		await expect(canvas.getByRole('link', { name: 'Show all 6' })).toHaveAttribute(
			'href',
			`/manage/sources${sourceFilterQuery('warnings', 'yes')}`
		);
	}}
/>

<Story
	name="Empty"
	args={{ groups: [] }}
	play={async ({ canvas }) => {
		await expect(canvas.queryByRole('heading')).toBeNull();
		await expect(canvas.queryByRole('listitem')).toBeNull();
	}}
/>
