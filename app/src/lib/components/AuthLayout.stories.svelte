<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import AuthLayout from './AuthLayout.svelte';

	const { Story } = defineMeta({ title: 'AuthLayout', component: AuthLayout });
</script>

<Story
	name="One card"
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('link', { name: 'Acme Docs' })).toHaveAttribute('href', '/');
		const card = canvas.getByRole('heading', { name: 'Log in to Acme Docs' }).closest('.sheet');
		await expect(card).toContainElement(canvas.getByRole('button', { name: 'Log in' }));
	}}
>
	{#snippet template()}
		<AuthLayout instanceTitle="Acme Docs">
			<h1>Log in to Acme Docs</h1>
			<form><button class="primary">Log in</button></form>
		</AuthLayout>
	{/snippet}
</Story>

<Story
	name="Two ways"
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('link', { name: 'Acme Docs' })).toBeVisible();
		// The page brings its own cards: the layout adds none around them.
		await expect(canvas.getAllByRole('region')).toHaveLength(2);
		await expect(canvas.getByRole('region', { name: 'Start new' }).parentElement).not.toHaveClass(
			'sheet'
		);
	}}
>
	{#snippet template()}
		<AuthLayout instanceTitle="Acme Docs" wide>
			<h1>Set up Acme Docs</h1>
			<div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--s5)">
				<section class="sheet" aria-labelledby="new"><h2 id="new">Start new</h2></section>
				<section class="sheet" aria-labelledby="move">
					<h2 id="move">Move an instance here</h2>
				</section>
			</div>
		</AuthLayout>
	{/snippet}
</Story>
