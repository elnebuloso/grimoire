<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import DateTime from './DateTime.svelte';

	const { Story } = defineMeta({ title: 'DateTime', component: DateTime });

	const value = '2026-10-29T18:06:56.148Z';
</script>

<Story
	name="In the time zone of the instance"
	args={{ value, timeZone: 'Europe/Berlin' }}
	play={async ({ canvasElement }) => {
		const time = canvasElement.querySelector('time');
		await expect(time).toHaveTextContent('Oct 29, 2026, 7:06 PM GMT+1');
		await expect(time).toHaveAttribute('datetime', value);
	}}
/>
