<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import PageHead from './PageHead.svelte';

	const { Story } = defineMeta({ title: 'PageHead', component: PageHead });
</script>

<Story
	name="Title only"
	args={{ title: 'API keys' }}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('API keys');
		await expect(canvas.queryByRole('link')).toBeNull();
		await expect(document.title).toBe('API keys – grimoire');
	}}
/>

<Story
	name="Title naming the instance"
	args={{ title: 'Log in to grimoire', namesInstance: true }}
	play={async () => {
		await expect(document.title).toBe('Log in to grimoire');
	}}
/>

<Story
	name="Instance with a name of its own"
	args={{ title: 'API keys' }}
	parameters={{
		sveltekit_experimental: { state: { page: { data: { instanceName: 'Acme Docs' } } } }
	}}
	play={async () => {
		await expect(document.title).toBe('API keys – Acme Docs');
	}}
/>

<Story
	name="Tab title of its own"
	args={{ title: 'Source Platform docs', documentTitle: 'Preview of auth/login.md' }}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(
			'Source Platform docs'
		);
		await expect(document.title).toBe('Preview of auth/login.md – grimoire');
	}}
/>

<Story
	name="With a lead"
	args={{ title: 'Try a query' }}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Try a query');
		await expect(canvas.getByText(/what an agent without an API key gets/)).toBeVisible();
	}}
>
	{#snippet template(args)}
		<PageHead {...args}>
			<p>Shows what an agent without an API key gets back for a question.</p>
		</PageHead>
	{/snippet}
</Story>

<Story
	name="With a way back"
	args={{ title: 'Source Platform docs', back: { href: '/manage', label: 'All sources' } }}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('link', { name: 'All sources' })).toHaveAttribute(
			'href',
			'/manage'
		);
		await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(
			'Source Platform docs'
		);
	}}
/>
