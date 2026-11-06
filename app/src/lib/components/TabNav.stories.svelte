<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import TabNav from './TabNav.svelte';

	const { Story } = defineMeta({ title: 'TabNav', component: TabNav });
</script>

<Story
	name="Second tab current"
	args={{
		label: 'Source',
		tabs: [
			{ href: '/manage/sources/1', label: 'Status', current: false },
			{ href: '/manage/sources/1/pages', label: 'Pages', current: true },
			{ href: '/manage/sources/1/settings', label: 'Settings', current: false }
		]
	}}
	play={async ({ canvas }) => {
		const nav = canvas.getByRole('navigation', { name: 'Source' });
		await expect(nav).toBeVisible();
		await expect(canvas.getByRole('link', { name: 'Pages' })).toHaveAttribute(
			'aria-current',
			'page'
		);
		await expect(canvas.getByRole('link', { name: 'Status' })).not.toHaveAttribute('aria-current');
		await expect(canvas.getByRole('link', { name: 'Settings' })).toHaveAttribute(
			'href',
			'/manage/sources/1/settings'
		);
	}}
/>
