<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent } from 'storybook/test';
	import KeyScope from './KeyScope.svelte';

	const { Story } = defineMeta({ title: 'KeyScope', component: KeyScope });
</script>

<Story
	name="All sources"
	args={{ allSources: true, slugs: [] }}
	play={async ({ canvas }) => {
		await expect(canvas.getByText('all sources')).toBeVisible();
	}}
/>

<Story
	name="No source left"
	args={{ allSources: false, slugs: [] }}
	play={async ({ canvas }) => {
		await expect(canvas.getByText('no sources')).toBeVisible();
	}}
/>

<Story
	name="A few sources"
	args={{ allSources: false, slugs: ['billing-docs', 'platform-docs'] }}
	play={async ({ canvas }) => {
		await expect(canvas.getByText('billing-docs')).toBeVisible();
		await expect(canvas.queryByText(/more/)).toBeNull();
	}}
/>

<Story
	name="Many sources, shortened"
	args={{
		allSources: false,
		slugs: ['auth', 'billing-docs', 'cli', 'deploy', 'events', 'platform-docs']
	}}
	play={async ({ canvas }) => {
		const summary = canvas.getByText(/and 3 more/);
		await expect(summary).toBeVisible();
		await expect(canvas.getByText('events')).not.toBeVisible();
		await userEvent.click(summary);
		await expect(canvas.getByText('events')).toBeVisible();
	}}
/>
