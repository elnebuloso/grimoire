<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, spyOn, userEvent, waitFor } from 'storybook/test';
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

<Story
	name="A theme picked by a click"
	args={{ theme: 'system' }}
	play={async ({ canvas }) => {
		const root = document.documentElement;
		const before = root.getAttribute('data-theme');
		const fetch = spyOn(window, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));
		try {
			await userEvent.click(canvas.getByRole('button', { name: 'Dark' }));
			await waitFor(() => expect(root).toHaveAttribute('data-theme', 'dark'));
			await userEvent.click(canvas.getByRole('button', { name: 'System' }));
			await waitFor(() => expect(root).not.toHaveAttribute('data-theme'));
		} finally {
			fetch.mockRestore();
			if (before) root.setAttribute('data-theme', before);
		}
	}}
/>
