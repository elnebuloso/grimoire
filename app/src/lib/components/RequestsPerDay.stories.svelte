<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent } from 'storybook/test';
	import RequestsPerDay from './RequestsPerDay.svelte';

	const { Story } = defineMeta({ title: 'RequestsPerDay', component: RequestsPerDay });
</script>

<Story
	name="Several days"
	args={{
		days: [
			{ day: '2026-11-03', requests: 50 },
			{ day: '2026-11-02', requests: 1000 },
			{ day: '2026-11-01', requests: 100 }
		]
	}}
	play={async ({ canvas }) => {
		const summary = canvas.getByText('1,150 requests in the last 90 days');
		await expect(canvas.getByRole('table', { hidden: true })).not.toBeVisible();
		await userEvent.click(summary);
		const rows = canvas.getAllByRole('row').slice(1);
		const cells = (row: HTMLTableRowElement) => [...row.cells].map((cell) => cell.textContent);
		await expect(rows.map((row) => cells(row as HTMLTableRowElement))).toEqual([
			['Nov 3, 2026', '50'],
			['Nov 2, 2026', '1,000'],
			['Nov 1, 2026', '100']
		]);
	}}
/>

<Story
	name="No requests"
	args={{ days: [] }}
	play={async ({ canvas }) => {
		await expect(canvas.getByText('No requests in the last 90 days')).toBeVisible();
		await expect(canvas.queryByRole('table')).toBeNull();
	}}
/>
