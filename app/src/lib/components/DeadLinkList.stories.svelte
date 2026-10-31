<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import DeadLinkList from './DeadLinkList.svelte';

	const { Story } = defineMeta({ title: 'DeadLinkList', component: DeadLinkList });
</script>

<Story
	name="With and without a section"
	args={{
		links: [
			{
				file: 'auth-service.md',
				anchor: 'rotating_the_signing_keys',
				target: 'auth-service#token-lifetime'
			},
			{ file: 'index.md', anchor: null, target: 'services' }
		]
	}}
	play={async ({ canvas }) => {
		const items = canvas.getAllByRole('listitem');
		await expect(items.map((item) => item.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
			'auth-service.md#rotating_the_signing_keys → links to auth-service#token-lifetime',
			'index.md → links to services'
		]);
	}}
/>
