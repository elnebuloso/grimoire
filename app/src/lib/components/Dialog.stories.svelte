<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent, waitFor } from 'storybook/test';
	import Dialog from './Dialog.svelte';

	const { Story } = defineMeta({ title: 'Dialog', component: Dialog });
</script>

<script lang="ts">
	let open = $state(true);
</script>

<Story
	name="Open"
	play={async ({ canvas }) => {
		const dialog = canvas.getByRole('dialog', { name: 'Invite a user' });
		await expect(dialog).toBeVisible();
		await expect(dialog).toHaveTextContent('They get a link by mail.');
	}}
>
	{#snippet template()}
		<Dialog open title="Invite a user">
			<p>They get a link by mail.</p>
		</Dialog>
	{/snippet}
</Story>

<Story
	name="Closed by the browser or beside the box"
	play={async ({ canvas }) => {
		const dialog = canvas.getByRole('dialog') as HTMLDialogElement;
		// What Escape does in the browser: the dialog closes and `open` follows.
		dialog.close();
		await waitFor(() => expect(open).toBe(false));
		open = true;
		await waitFor(() => expect(canvas.getByRole('dialog')).toBeVisible());
		// Pressed and released on the backdrop, which is the dialog element itself, not its box.
		await userEvent.pointer({ keys: '[MouseLeft]', target: dialog });
		await waitFor(() => expect(open).toBe(false));
	}}
>
	{#snippet template()}
		<Dialog bind:open title="Invite a user">
			<button>Send invitation</button>
		</Dialog>
	{/snippet}
</Story>

<Story
	name="Kept when a press inside is released beside the box"
	play={async ({ canvas }) => {
		open = true;
		const dialog = canvas.getByRole('dialog') as HTMLDialogElement;
		const field = canvas.getByRole('textbox', { name: 'Email address' });
		await userEvent.type(field, 'anna@example.com');
		// Selecting the text and letting go over the backdrop: the browser clicks the dialog.
		await userEvent.pointer([
			{ keys: '[MouseLeft>]', target: field },
			{ target: dialog },
			{ keys: '[/MouseLeft]' }
		]);
		await expect(open).toBe(true);
		await expect(field).toHaveValue('anna@example.com');
	}}
>
	{#snippet template()}
		<Dialog bind:open title="Invite a user">
			<label>Email address <input name="email" /></label>
		</Dialog>
	{/snippet}
</Story>

<Story
	name="Closed"
	play={async ({ canvas }) => {
		await expect(canvas.queryByRole('dialog')).toBeNull();
	}}
>
	{#snippet template()}
		<Dialog title="Invite a user"><p>They get a link by mail.</p></Dialog>
	{/snippet}
</Story>
