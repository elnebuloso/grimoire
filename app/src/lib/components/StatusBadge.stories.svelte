<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import StatusBadge from './StatusBadge.svelte';

	const { Story } = defineMeta({ title: 'StatusBadge', component: StatusBadge });

	const SOURCE = {
		syncing: 'syncing…',
		error: 'sync error',
		paused: 'paused',
		never: 'not synced',
		synced: 'synced'
	} as const;
	const RUN = { synced: 'synced', unchanged: 'unchanged', failed: 'failed' } as const;
</script>

<Story
	name="Every state of a source"
	play={async ({ canvas }) => {
		for (const word of Object.values(SOURCE)) {
			await expect(canvas.getByText(word, { exact: true })).toBeVisible();
		}
	}}
>
	{#snippet template()}
		<p style="display: flex; gap: var(--s3)">
			{#each Object.keys(SOURCE) as state (state)}<StatusBadge
					state={state as keyof typeof SOURCE}
				/>{/each}
		</p>
	{/snippet}
</Story>

<Story
	name="Every outcome of a sync"
	play={async ({ canvas }) => {
		for (const word of Object.values(RUN)) {
			await expect(canvas.getByText(word, { exact: true })).toBeVisible();
		}
	}}
>
	{#snippet template()}
		<p style="display: flex; gap: var(--s3)">
			{#each Object.keys(RUN) as state (state)}<StatusBadge
					state={state as keyof typeof RUN}
				/>{/each}
		</p>
	{/snippet}
</Story>
