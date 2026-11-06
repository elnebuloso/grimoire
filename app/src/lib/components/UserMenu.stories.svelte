<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent } from 'storybook/test';
	import UserMenu from './UserMenu.svelte';

	const { Story } = defineMeta({ title: 'UserMenu', component: UserMenu });
</script>

<Story
	name="Closed"
	args={{ email: 'ada@example.com', theme: 'system' }}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('button', { name: 'ada@example.com' })).toBeVisible();
		await expect(canvas.queryByRole('button', { name: 'Log out' })).toBeNull();
	}}
/>

<Story
	name="Open"
	args={{ email: 'ada@example.com', theme: 'dark' }}
	play={async ({ canvas }) => {
		const button = canvas.getByRole('button', { name: 'ada@example.com' });
		await userEvent.click(button);
		await expect(canvas.getByRole('heading', { name: 'ada@example.com' })).toBeVisible();
		await expect(canvas.getByRole('button', { name: 'Dark' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await expect(canvas.getByRole('link', { name: 'Login and password' })).toHaveAttribute(
			'href',
			'/account'
		);
		const logOut = canvas.getByRole('button', { name: 'Log out' });
		await expect(logOut.closest('form')).toHaveAttribute('action', '/logout');
	}}
/>
