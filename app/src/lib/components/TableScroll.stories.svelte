<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import TableScroll from './TableScroll.svelte';

	const { Story } = defineMeta({ title: 'TableScroll', component: TableScroll });
</script>

<Story
	name="Wider than its container"
	args={{ label: 'Sync history' }}
	play={async ({ canvas }) => {
		const region = canvas.getByRole('region', { name: 'Sync history' });
		await expect(region).toHaveAttribute('tabindex', '0');
		await expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
		await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
	}}
>
	{#snippet template(args)}
		<div style="max-width: 20rem">
			<TableScroll label={args.label}>
				<table>
					<thead>
						<tr><th>When</th><th>Outcome</th><th>Commit</th><th>Error</th></tr>
					</thead>
					<tbody>
						<tr>
							<td>Oct 30, 2026, 7:00 AM UTC – Oct 30, 2026, 4:45 PM UTC (9 runs)</td>
							<td>failed</td>
							<td><code>7c9a74829f2d</code></td>
							<td>source path "archive/docs" does not exist in the repository</td>
						</tr>
					</tbody>
				</table>
			</TableScroll>
		</div>
	{/snippet}
</Story>
