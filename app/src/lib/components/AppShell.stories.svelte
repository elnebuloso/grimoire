<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import AppShell from './AppShell.svelte';

	const { Story } = defineMeta({ title: 'AppShell', component: AppShell });

	const frame = { theme: 'system', instanceTitle: 'Acme Docs', version: '1.9.0' } as const;
	const admin = { name: 'ada@example.com', mayManage: true };
	const user = { name: 'lin@example.com', mayManage: false };
</script>

<Story
	name="Anonymous visitor"
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('link', { name: 'Acme Docs' })).toHaveAttribute('href', '/');
		await expect(canvas.getByRole('link', { name: 'Log in' })).toBeVisible();
		await expect(canvas.queryByRole('navigation', { name: 'Areas' })).toBeNull();
		await expect(canvas.getByRole('form', { name: 'Language' })).toBeVisible();
		await expect(canvas.getByRole('form', { name: 'Theme' })).toBeVisible();
		await expect(canvas.getByRole('main')).toHaveTextContent('The page');
	}}
>
	{#snippet template()}
		<AppShell {...frame} user={null} area="start"><p>The page</p></AppShell>
	{/snippet}
</Story>

<Story
	name="User without a role"
	play={async ({ canvas }) => {
		const areas = canvas.getByRole('navigation', { name: 'Areas' });
		await expect(areas).toHaveTextContent('StartAccount');
		await expect(canvas.queryByRole('link', { name: 'Management' })).toBeNull();
		await expect(canvas.getByRole('button', { name: 'lin@example.com' })).toBeVisible();
		await expect(canvas.queryByRole('link', { name: 'Log in' })).toBeNull();
		// Language and theme sit in the user menu, not in the footer.
		await expect(canvas.getByRole('contentinfo')).not.toHaveTextContent('Theme');
	}}
>
	{#snippet template()}
		<AppShell {...frame} {user} area="account"><p>The page</p></AppShell>
	{/snippet}
</Story>

<Story
	name="Admin in the management area"
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('link', { name: 'Management' })).toHaveAttribute(
			'aria-current',
			'true'
		);
		await expect(canvas.getByRole('button', { name: 'ada@example.com' })).toBeVisible();
	}}
>
	{#snippet template()}
		<AppShell {...frame} user={admin} area="manage"><p>The page</p></AppShell>
	{/snippet}
</Story>

<Story
	name="Login page"
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('link', { name: 'Acme Docs' })).toBeVisible();
		await expect(canvas.queryByRole('navigation', { name: 'Areas' })).toBeNull();
		await expect(canvas.queryByRole('link', { name: 'Log in' })).toBeNull();
		await expect(canvas.getByRole('form', { name: 'Theme' })).toBeVisible();
	}}
>
	{#snippet template()}
		<AppShell {...frame} user={null} area="start" auth="card"><p>The page</p></AppShell>
	{/snippet}
</Story>
