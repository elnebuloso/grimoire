<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent } from 'storybook/test';
	import ChoiceField from './ChoiceField.svelte';

	const { Story } = defineMeta({ title: 'ChoiceField', component: ChoiceField });
</script>

<Story
	name="Checkbox"
	args={{ label: 'Remove the stored token', name: 'removeToken' }}
	play={async ({ canvas }) => {
		const checkbox = canvas.getByRole('checkbox', { name: 'Remove the stored token' });
		await expect(checkbox).not.toBeChecked();
		await userEvent.click(checkbox);
		await expect(checkbox).toBeChecked();
	}}
/>

<Story
	name="Checked checkbox"
	args={{ label: 'Paused', name: 'paused', checked: true }}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('checkbox', { name: 'Paused' })).toBeChecked();
	}}
/>

<Story
	name="Radio buttons"
	play={async ({ canvas }) => {
		const all = canvas.getByRole('radio', { name: 'All sources' });
		const selected = canvas.getByRole('radio', { name: 'Only these' });
		await expect(all).toBeChecked();
		await userEvent.click(selected);
		await expect(selected).toBeChecked();
		await expect(all).not.toBeChecked();
	}}
>
	{#snippet template()}
		<ChoiceField type="radio" name="scope" value="all" checked label="All sources" />
		<ChoiceField type="radio" name="scope" value="selected" label="Only these" />
	{/snippet}
</Story>

<Story
	name="Machine string"
	args={{ label: 'billing-docs', name: 'source', value: 'billing-docs', mono: true }}
	play={async ({ canvas }) => {
		const checkbox = canvas.getByRole('checkbox', { name: 'billing-docs' });
		await userEvent.click(checkbox);
		await expect(checkbox).toBeChecked();
		await expect(getComputedStyle(canvas.getByText('billing-docs')).fontFamily).toContain(
			'IBM Plex Mono'
		);
	}}
/>
