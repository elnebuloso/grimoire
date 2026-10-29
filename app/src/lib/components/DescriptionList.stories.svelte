<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import DescriptionList from './DescriptionList.svelte';

	const { Story } = defineMeta({ title: 'DescriptionList', component: DescriptionList });
</script>

<Story
	name="Terms and values"
	args={{
		items: [
			['Last sync', 'never'],
			['Pages', 12]
		]
	}}
	play={async ({ canvas }) => {
		const terms = canvas.getAllByRole('term');
		const values = canvas.getAllByRole('definition');
		await expect(terms.map((term) => term.textContent)).toEqual(['Last sync', 'Pages']);
		await expect(values.map((value) => value.textContent)).toEqual(['never', '12']);
	}}
/>

<Story
	name="Empty"
	args={{ items: [] }}
	play={async ({ canvas }) => {
		await expect(canvas.queryAllByRole('term')).toHaveLength(0);
	}}
/>
