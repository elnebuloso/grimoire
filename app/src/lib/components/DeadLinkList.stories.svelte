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
		const pages = canvas.getAllByRole('list')[0].querySelectorAll(':scope > li');
		await expect([...pages].map((page) => page.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
			'auth-service.md#rotating_the_signing_keys → links to auth-service#token-lifetime',
			'index.md → links to services'
		]);
	}}
/>

<Story
	name="Several links from one section"
	args={{
		links: [
			{ file: 'invoices.md', anchor: 'payment-provider-outages', target: 'invoices#late-fees' },
			{ file: 'invoices.md', anchor: 'payment-provider-outages', target: 'refunds' },
			{ file: 'invoices.md', anchor: null, target: 'refunds' }
		]
	}}
	play={async ({ canvas }) => {
		const pages = canvas.getAllByRole('list')[0].querySelectorAll(':scope > li');
		await expect([...pages].map((page) => page.querySelector('.from')?.textContent)).toEqual([
			'invoices.md#payment-provider-outages',
			'invoices.md'
		]);
		await expect(pages[0].querySelectorAll('li')).toHaveLength(2);
	}}
/>

<Story
	name="A path without a break opportunity"
	args={{
		links: [
			{
				file: `runbooks/${'very_long_page_name_'.repeat(20)}.md`,
				anchor: 'a_heading_anchor_that_is_long',
				target: `../shared/${'unbroken_target_'.repeat(20)}.md`
			}
		]
	}}
	play={async ({ canvas }) => {
		const list = canvas.getAllByRole('list')[0];
		await expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
	}}
/>
