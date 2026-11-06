<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import SourceLabel from './SourceLabel.svelte';

	const { Story } = defineMeta({ title: 'SourceLabel', component: SourceLabel });
</script>

<Story
	name="Linked"
	args={{ name: 'Platform docs', slug: 'platform-docs', href: '/manage/sources/1' }}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('link', { name: 'Platform docs' })).toHaveAttribute(
			'href',
			'/manage/sources/1'
		);
		await expect(canvas.getByText('platform-docs')).toBeVisible();
	}}
/>

<Story
	name="Plain"
	args={{ name: 'Billing docs', slug: 'billing-docs' }}
	play={async ({ canvas }) => {
		await expect(canvas.queryByRole('link')).toBeNull();
		await expect(canvas.getByText('Billing docs')).toBeVisible();
	}}
/>
