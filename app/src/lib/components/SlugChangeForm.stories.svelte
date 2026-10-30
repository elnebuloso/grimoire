<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent } from 'storybook/test';
	import SlugChangeForm from './SlugChangeForm.svelte';

	const { Story } = defineMeta({ title: 'SlugChangeForm', component: SlugChangeForm });

	const effects = 'The slug platform is part of the ID of every snippet of this source.';
</script>

<Story
	name="Ready to change"
	args={{ current: 'platform', effects }}
	play={async ({ canvas }) => {
		await expect(canvas.getByText(effects)).toBeVisible();
		const slug = canvas.getByLabelText('New slug');
		await expect(slug).toHaveValue('platform');
		await expect(slug).toHaveAttribute('maxlength', '40');
		await userEvent.clear(slug);
		await userEvent.type(slug, 'platform-team');
		await expect(slug).toHaveValue('platform-team');
		await expect(canvas.getByLabelText('Type the current slug to confirm')).toHaveValue('');
	}}
/>

<Story
	name="Rejected"
	args={{
		current: 'platform',
		effects,
		value: 'billing',
		error: 'The slug "billing" is taken.'
	}}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('alert')).toHaveTextContent('The slug "billing" is taken.');
		await expect(canvas.getByLabelText('New slug')).toHaveValue('billing');
	}}
/>

<Story
	name="Changed"
	args={{ current: 'platform-team', effects, changed: true }}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('status')).toHaveTextContent('Slug changed.');
	}}
/>
