<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent, waitFor } from 'storybook/test';
	import ActionMenu from './ActionMenu.svelte';
	import ConfirmAction from './ConfirmAction.svelte';

	const { Story } = defineMeta({ title: 'ActionMenu', component: ActionMenu });

	const args = { label: 'Actions for ada@example.com' };
</script>

{#snippet actions()}
	<ConfirmAction
		action="?/passwordLink"
		label="Password link"
		buttonLabel="Password link for ada@example.com"
		title="Create a link to set the password of ada@example.com?"
		consequence="Whoever has the link can set the password and log in with it."
		success="Link created."
	/>
	<ConfirmAction
		action="?/delete"
		label="Delete"
		buttonLabel="Delete ada@example.com"
		title="Delete ada@example.com?"
		consequence="Their API keys stop working at once. This cannot be undone."
		danger
		success="ada@example.com deleted."
	/>
{/snippet}

<Story
	name="Closed"
	{args}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('button', { name: 'Actions for ada@example.com' })).toBeVisible();
		await expect(canvas.queryByRole('button', { name: 'Delete ada@example.com' })).toBeNull();
	}}
>
	{#snippet template(args)}<ActionMenu label={args.label}>{@render actions()}</ActionMenu>{/snippet}
</Story>

<Story
	name="Open"
	{args}
	play={async ({ canvas }) => {
		await userEvent.click(canvas.getByRole('button', { name: 'Actions for ada@example.com' }));
		await expect(
			canvas.getByRole('button', { name: 'Password link for ada@example.com' })
		).toBeVisible();
		await expect(canvas.getByRole('button', { name: 'Delete ada@example.com' })).toBeVisible();
	}}
>
	{#snippet template(args)}<ActionMenu label={args.label}>{@render actions()}</ActionMenu>{/snippet}
</Story>

<Story
	name="An action asks first and closes the menu"
	{args}
	play={async ({ canvas }) => {
		await userEvent.click(canvas.getByRole('button', { name: 'Actions for ada@example.com' }));
		await userEvent.click(canvas.getByRole('button', { name: 'Delete ada@example.com' }));
		await expect(canvas.getByRole('dialog', { name: 'Delete ada@example.com?' })).toBeVisible();

		await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
		// The menu closes on the dialog's close event, which may come a frame later.
		await waitFor(() =>
			expect(canvas.queryByRole('button', { name: 'Delete ada@example.com' })).toBeNull()
		);
	}}
>
	{#snippet template(args)}<ActionMenu label={args.label}>{@render actions()}</ActionMenu>{/snippet}
</Story>
