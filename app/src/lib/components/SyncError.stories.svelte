<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import SyncError from './SyncError.svelte';

	const { Story } = defineMeta({ title: 'SyncError', component: SyncError });
</script>

<Story
	name="Known kind"
	args={{ error: 'source path "docs" does not exist in the repository', kind: 'path' }}
	play={async ({ canvas }) => {
		await expect(canvas.getByText('The path does not exist in the repository.')).toBeVisible();
		await expect(
			canvas.getByText('source path "docs" does not exist in the repository')
		).toBeVisible();
	}}
/>

<Story
	name="Unknown kind"
	args={{ error: 'disk full', kind: 'unknown' }}
	play={async ({ canvasElement }) => {
		await expect(canvasElement).toHaveTextContent(/^\s*disk full\s*$/);
	}}
/>
