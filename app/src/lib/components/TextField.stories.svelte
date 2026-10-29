<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent } from 'storybook/test';
	import TextField from './TextField.svelte';

	const { Story } = defineMeta({ title: 'TextField', component: TextField });
</script>

<Story
	name="Text"
	args={{ label: 'Slug', name: 'slug', required: true, value: 'platform' }}
	play={async ({ canvas }) => {
		const input = canvas.getByLabelText('Slug');
		await expect(input).toHaveValue('platform');
		await expect(input).toBeRequired();
		await userEvent.clear(input);
		await userEvent.type(input, 'billing');
		await expect(input).toHaveValue('billing');
	}}
/>

<Story
	name="Password"
	args={{
		label: 'Password (at least 12 characters)',
		name: 'password',
		type: 'password',
		minlength: 12,
		autocomplete: 'new-password'
	}}
	play={async ({ canvas }) => {
		const input = canvas.getByLabelText('Password (at least 12 characters)');
		await expect(input).toHaveAttribute('type', 'password');
		await expect(input).toHaveAttribute('minlength', '12');
		await expect(input).toHaveAttribute('autocomplete', 'new-password');
	}}
/>

<Story
	name="Read-only"
	args={{ label: 'Username', name: 'username', readonly: true, value: 'admin' }}
	play={async ({ canvas }) => {
		const input = canvas.getByLabelText('Username');
		await userEvent.type(input, 'x');
		await expect(input).toHaveValue('admin');
	}}
/>
