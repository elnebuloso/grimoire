<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, userEvent, waitFor } from 'storybook/test';
	import ConfirmAction from './ConfirmAction.svelte';
	import TextField from './TextField.svelte';

	const { Story } = defineMeta({ title: 'ConfirmAction', component: ConfirmAction });

	// Storybook's `enhance` reports a submit that gets through as an event instead of posting it.
	function recordSubmits() {
		const submitted = fn();
		window.addEventListener('storybook:enhance', submitted, { once: true });
		return submitted;
	}

	const revoke = {
		action: '?/revoke',
		label: 'Revoke',
		buttonLabel: 'Revoke laptop',
		title: 'Revoke the key laptop?',
		consequence: 'Agents using it lose access at once.',
		danger: true,
		success: 'Key laptop revoked.'
	};
</script>

<Story
	name="Asks before it posts"
	args={revoke}
	play={async ({ canvas }) => {
		const submitted = recordSubmits();
		const trigger = canvas.getByRole('button', { name: 'Revoke laptop' });
		await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
		await expect(canvas.queryByRole('dialog')).toBeNull();
		await userEvent.click(trigger);
		await expect(canvas.getByRole('dialog', { name: 'Revoke the key laptop?' })).toBeVisible();
		await expect(submitted).not.toHaveBeenCalled();
		await userEvent.click(canvas.getByRole('button', { name: 'Revoke' }));
		await expect(submitted).toHaveBeenCalledOnce();
	}}
>
	{#snippet template(args)}
		<ConfirmAction {...args}><input type="hidden" name="id" value="3" /></ConfirmAction>
	{/snippet}
</Story>

<Story
	name="Cancelled"
	args={revoke}
	play={async ({ canvas }) => {
		const submitted = recordSubmits();
		await userEvent.click(canvas.getByRole('button', { name: 'Revoke laptop' }));
		await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(canvas.queryByRole('dialog')).toBeNull());
		await expect(submitted).not.toHaveBeenCalled();
		window.removeEventListener('storybook:enhance', submitted);
	}}
/>

<Story
	name="With a field on the page and a typed slug"
	args={{
		action: '?/slug',
		label: 'Change the slug',
		title: 'Change the slug of Billing docs?',
		consequence: 'IDs and URLs that agents have stored stop working.',
		typed: { value: 'billing-docs', label: 'Type billing-docs to confirm' },
		success: 'Slug changed.'
	}}
	play={async ({ canvas }) => {
		const submitted = recordSubmits();
		const field = canvas.getByLabelText('New slug');
		await userEvent.clear(field);
		// An empty field on the page is reported before the dialog covers it.
		await userEvent.click(canvas.getByRole('button', { name: 'Change the slug' }));
		await expect(canvas.queryByRole('dialog')).toBeNull();
		await userEvent.type(field, 'billing');
		await userEvent.click(canvas.getByRole('button', { name: 'Change the slug' }));
		const dialog = canvas.getByRole('dialog', { name: 'Change the slug of Billing docs?' });
		const confirm = canvas.getAllByRole('button', { name: 'Change the slug' }).at(-1)!;
		await expect(dialog).toContainElement(confirm);
		await expect(confirm).toBeDisabled();
		await userEvent.type(canvas.getByLabelText('Type billing-docs to confirm'), 'billing-docs');
		await userEvent.click(confirm);
		await expect(submitted).toHaveBeenCalledOnce();
	}}
>
	{#snippet template(args)}
		<ConfirmAction {...args}>
			<TextField label="New slug" name="slug" required value="billing-docs" mono />
		</ConfirmAction>
	{/snippet}
</Story>
