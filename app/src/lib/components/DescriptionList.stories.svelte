<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import DescriptionList from './DescriptionList.svelte';

	const { Story } = defineMeta({ title: 'DescriptionList', component: DescriptionList });
</script>

{#snippet snippetValue()}<em>rendered by a snippet</em>{/snippet}

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
	name="Snippet as value"
	args={{ items: [['Last sync', snippetValue]] }}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('definition')).toHaveTextContent('rendered by a snippet');
	}}
/>

<Story
	name="Empty"
	args={{ items: [] }}
	play={async ({ canvas }) => {
		await expect(canvas.queryAllByRole('term')).toHaveLength(0);
	}}
/>

<Story
	name="Numbers"
	args={{
		numbers: true,
		items: [
			['Sources', 4],
			['Tokens', 3222]
		]
	}}
	play={async ({ canvas }) => {
		const values = canvas.getAllByRole('definition');
		await expect(values.map((value) => value.textContent?.trim())).toEqual(['4', '3222']);
		await expect(getComputedStyle(values[1]).textAlign).toBe('end');
	}}
/>
