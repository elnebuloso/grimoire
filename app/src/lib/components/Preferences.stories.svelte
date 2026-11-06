<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import Preferences from './Preferences.svelte';

	const { Story } = defineMeta({ title: 'Preferences', component: Preferences });
</script>

<Story
	name="Following the system"
	args={{ theme: 'system' }}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('form', { name: 'Language' })).toHaveAttribute(
			'action',
			'/language'
		);
		await expect(canvas.getByRole('button', { name: 'Deutsch' })).toHaveAttribute('lang', 'de');
		await expect(canvas.getByRole('button', { name: 'System' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	}}
/>

<Story
	name="A picked theme"
	args={{ theme: 'light' }}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('button', { name: 'Light' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	}}
/>
