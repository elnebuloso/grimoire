<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, userEvent } from 'storybook/test';
	import EmptyState from './EmptyState.svelte';

	const { Story } = defineMeta({ title: 'EmptyState', component: EmptyState });
</script>

<Story
	name="With its action"
	args={{
		text: 'No sources yet.',
		action: { href: '/manage/sources/new', label: 'New source' }
	}}
	play={async ({ canvas }) => {
		await expect(canvas.getByText('No sources yet.')).toBeVisible();
		await expect(canvas.getByRole('link', { name: 'New source' })).toHaveAttribute(
			'href',
			'/manage/sources/new'
		);
	}}
/>

<Story
	name="With a button"
	args={{ text: 'No API keys yet.', action: { label: 'New key', onclick: fn() } }}
	play={async ({ args, canvas }) => {
		await userEvent.click(canvas.getByRole('button', { name: 'New key' }));
		await expect('onclick' in args.action && args.action.onclick).toHaveBeenCalledOnce();
	}}
/>
