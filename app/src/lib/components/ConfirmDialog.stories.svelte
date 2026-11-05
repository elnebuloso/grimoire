<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, userEvent, waitFor } from 'storybook/test';
	import ConfirmDialog from './ConfirmDialog.svelte';

	const { Story } = defineMeta({
		title: 'ConfirmDialog',
		component: ConfirmDialog,
		args: { open: true, onconfirm: fn() }
	});
</script>

<Story
	name="Level 1"
	args={{
		title: 'Revoke the key laptop?',
		consequence: 'Agents using it lose access at once.',
		confirmLabel: 'Revoke',
		danger: true
	}}
	play={async ({ args, canvas }) => {
		const dialog = canvas.getByRole('dialog', { name: 'Revoke the key laptop?' });
		await expect(dialog).toHaveTextContent('Agents using it lose access at once.');
		// The safe choice has the focus.
		await waitFor(() => expect(canvas.getByRole('button', { name: 'Cancel' })).toHaveFocus());
		await userEvent.click(canvas.getByRole('button', { name: 'Revoke' }));
		await expect(args.onconfirm).toHaveBeenCalledOnce();
	}}
/>

<Story
	name="Cancelled"
	args={{
		title: 'Make anna@example.com an admin?',
		consequence:
			'Admins manage the sources, users, all API keys and the settings of this instance.',
		confirmLabel: 'Make admin'
	}}
	play={async ({ args, canvas }) => {
		await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
		await expect(args.onconfirm).not.toHaveBeenCalled();
	}}
/>

<Story
	name="Level 2, locked until the slug is typed"
	args={{
		title: 'Delete the source Billing docs?',
		consequence: 'Its index goes with it. This cannot be undone.',
		confirmLabel: 'Delete source',
		danger: true,
		typed: { value: 'billing-docs', label: 'Type billing-docs to confirm' }
	}}
	play={async ({ args, canvas }) => {
		const confirm = canvas.getByRole('button', { name: 'Delete source' });
		const field = canvas.getByLabelText('Type billing-docs to confirm');
		await waitFor(() => expect(field).toHaveFocus());
		await expect(confirm).toBeDisabled();
		await userEvent.type(field, 'billing-doc');
		await expect(confirm).toBeDisabled();
		await userEvent.type(field, 's');
		await expect(confirm).toBeEnabled();
		await userEvent.click(confirm);
		await expect(args.onconfirm).toHaveBeenCalledOnce();
	}}
/>

<Story
	name="Refused"
	args={{
		title: 'Remove the admin role of agent@example.com?',
		consequence: 'They keep their account and their API keys.',
		confirmLabel: 'Remove admin role',
		danger: true,
		error: 'The last admin keeps the role: make another user an admin first.'
	}}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('alert')).toHaveTextContent('The last admin keeps the role');
	}}
/>

<Story
	name="Running"
	args={{
		title: 'Revoke the key laptop?',
		consequence: 'Agents using it lose access at once.',
		confirmLabel: 'Revoke',
		danger: true,
		busy: true
	}}
	play={async ({ canvas }) => {
		const confirm = canvas.getByRole('button', { name: 'Revoke' });
		await expect(confirm).toBeDisabled();
		await expect(confirm).toHaveAttribute('aria-busy', 'true');
	}}
/>
