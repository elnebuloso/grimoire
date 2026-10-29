<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent } from 'storybook/test';
	import NameField from './NameField.svelte';

	const { Story } = defineMeta({ title: 'NameField', component: NameField });
</script>

<Story
	name="Typing a name"
	args={{ label: 'Name', name: 'name' }}
	play={async ({ canvas }) => {
		const input = canvas.getByLabelText('Name');
		await expect(input).toBeRequired();
		await expect(input).toHaveAttribute('maxlength', '80');
		await expect(canvas.getByRole('status')).toHaveTextContent('Slug: –');
		await userEvent.type(input, 'Prüfung & Abnahme');
		await expect(canvas.getByRole('status')).toHaveTextContent('Slug: pruefung-abnahme');
	}}
/>

<Story
	name="With a name"
	args={{ label: 'Name', name: 'name', value: 'Auth Service' }}
	play={async ({ canvas }) => {
		await expect(canvas.getByLabelText('Name')).toHaveValue('Auth Service');
		await expect(canvas.getByRole('status')).toHaveTextContent('Slug: auth-service');
	}}
/>

<Story
	name="Without letters or digits"
	args={{ label: 'Name', name: 'name', value: '!!!' }}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('status')).toHaveTextContent('Slug: –');
	}}
/>
