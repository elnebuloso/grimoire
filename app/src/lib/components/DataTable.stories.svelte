<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import DataTable from './DataTable.svelte';

	const { Story } = defineMeta({ title: 'DataTable', component: DataTable });

	interface Source {
		id: number;
		name: string;
		pages: number;
	}
	const rows: Source[] = Array.from({ length: 100 }, (_, index) => ({
		id: index + 1,
		name: `Source ${index + 1}`,
		pages: index * 3
	}));
	const columns = [
		{ label: 'Source', sort: 'name' },
		{ label: 'Pages', sort: 'pages', numeric: true },
		{ label: 'Note' }
	];
	const filters = [
		{
			name: 'status',
			label: 'Status',
			options: [
				{ value: 'error', label: 'sync error' },
				{ value: 'synced', label: 'synced' }
			]
		}
	];
</script>

<Story
	name="Sorted as the server applied it"
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('columnheader', { name: /Pages/ })).toHaveAttribute(
			'aria-sort',
			'descending'
		);
		await expect(canvas.getByRole('columnheader', { name: /Source/ })).toHaveAttribute(
			'aria-sort',
			'none'
		);
	}}
>
	{#snippet template()}
		<DataTable
			label="Sources"
			list={{
				rows: rows.slice(0, 3),
				total: 3,
				page: 1,
				pageCount: 1,
				sort: { key: 'pages', descending: true }
			}}
			{columns}
			key={(source) => source.id}
		>
			{#snippet row(source)}<td>{source.name}</td><td class="num">{source.pages}</td><td
				></td>{/snippet}
			{#snippet empty()}<p>No sources.</p>{/snippet}
		</DataTable>
	{/snippet}
</Story>

<Story
	name="A page of many"
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('searchbox', { name: 'Search by name' })).toBeVisible();
		await expect(canvas.getByRole('combobox', { name: 'Status' })).toHaveValue('');
		await expect(canvas.getByRole('columnheader', { name: /Source/ })).toHaveAttribute(
			'aria-sort',
			'ascending'
		);
		await expect(canvas.getByRole('columnheader', { name: /Pages/ })).toHaveAttribute(
			'aria-sort',
			'none'
		);
		await expect(canvas.getByRole('columnheader', { name: 'Note' })).not.toHaveAttribute(
			'aria-sort'
		);
		await expect(canvas.getAllByRole('row')).toHaveLength(101);
		const pages = canvas.getByRole('navigation', { name: 'Pages of Sources' });
		await expect(pages).toHaveTextContent('1–100 of 512');
		await expect(canvas.getByRole('button', { name: 'Previous' })).toBeDisabled();
		await expect(canvas.getByRole('button', { name: 'Next' })).toBeEnabled();
	}}
>
	{#snippet template()}
		<DataTable
			label="Sources"
			list={{ rows, total: 512, page: 1, pageCount: 6, sort: { key: 'name', descending: false } }}
			{columns}
			key={(source) => source.id}
			search="Search by name"
			{filters}
		>
			{#snippet row(source)}
				<th scope="row">{source.name}</th>
				<td class="num">{source.pages}</td>
				<td></td>
			{/snippet}
			{#snippet empty()}<p class="muted">No sources yet.</p>{/snippet}
		</DataTable>
	{/snippet}
</Story>

<Story
	name="Fits one page"
	play={async ({ canvas }) => {
		await expect(canvas.getAllByRole('row')).toHaveLength(4);
		await expect(canvas.queryByRole('navigation')).toBeNull();
		await expect(canvas.queryByRole('search')).toBeNull();
	}}
>
	{#snippet template()}
		<DataTable
			label="Sources"
			list={{ rows: rows.slice(0, 3), total: 3, page: 1, pageCount: 1 }}
			{columns}
			key={(source) => source.id}
		>
			{#snippet row(source)}
				<th scope="row">{source.name}</th>
				<td class="num">{source.pages}</td>
				<td></td>
			{/snippet}
			{#snippet empty()}<p class="muted">No sources yet.</p>{/snippet}
		</DataTable>
	{/snippet}
</Story>

<Story
	name="Empty"
	play={async ({ canvas }) => {
		await expect(canvas.queryByRole('table')).toBeNull();
		await expect(canvas.getByText('Nothing matches.')).toBeVisible();
		await expect(canvas.getByRole('searchbox', { name: 'Search by name' })).toBeVisible();
	}}
>
	{#snippet template()}
		<DataTable
			label="Sources"
			list={{ rows: [], total: 0, page: 1, pageCount: 1 }}
			{columns}
			key={(source: Source) => source.id}
			search="Search by name"
		>
			{#snippet row(source)}
				<th scope="row">{source.name}</th>
			{/snippet}
			{#snippet empty()}<p class="muted">Nothing matches.</p>{/snippet}
		</DataTable>
	{/snippet}
</Story>
