<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
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
