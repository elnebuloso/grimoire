<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, spyOn, userEvent, waitFor } from 'storybook/test';
	import { toasts } from '#lib/toasts.svelte.js';
	import SegmentedSwitch from './SegmentedSwitch.svelte';

	const { Story } = defineMeta({
		title: 'SegmentedSwitch',
		component: SegmentedSwitch,
		args: { onpick: fn() }
	});

	const themes = [
		{ value: 'system', label: 'System' },
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' }
	];
</script>

<Story
	name="Following the system"
	args={{ label: 'Theme', action: '/theme', name: 'theme', options: themes, current: 'system' }}
	play={async ({ canvas }) => {
		const form = canvas.getByRole('form', { name: 'Theme' });
		await expect(form).toHaveAttribute('action', '/theme');
		await expect(form).toHaveAttribute('method', 'post');
		await expect(canvas.getByRole('button', { name: 'System' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await expect(canvas.getByRole('button', { name: 'Dark' })).toHaveAttribute(
			'aria-pressed',
			'false'
		);
		await expect(canvas.getByRole('button', { name: 'Dark' })).toHaveAttribute('value', 'dark');
	}}
/>

<Story
	name="A picked option"
	args={{ label: 'Theme', action: '/theme', name: 'theme', options: themes, current: 'dark' }}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('button', { name: 'Dark' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await expect(canvas.getByRole('button', { name: 'System' })).toHaveAttribute(
			'aria-pressed',
			'false'
		);
	}}
/>

<Story
	name="Options in their own language"
	args={{
		label: 'Language',
		action: '/language',
		name: 'locale',
		options: [
			{ value: 'en', label: 'English', lang: 'en' },
			{ value: 'de', label: 'Deutsch', lang: 'de' }
		],
		current: 'en'
	}}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('button', { name: 'Deutsch' })).toHaveAttribute('lang', 'de');
		await expect(canvas.getByRole('button', { name: 'English' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	}}
/>

<Story
	name="A choice the server does not take"
	args={{ label: 'Theme', action: '/theme', name: 'theme', options: themes, current: 'system' }}
	play={async ({ args, canvas }) => {
		const fetch = spyOn(window, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
		try {
			await userEvent.click(canvas.getByRole('button', { name: 'Dark' }));
			await waitFor(() =>
				expect(toasts[0]?.message).toBe('Your choice could not be saved. Try again.')
			);
			await expect(args.onpick).not.toHaveBeenCalled();
		} finally {
			fetch.mockRestore();
		}
	}}
/>
