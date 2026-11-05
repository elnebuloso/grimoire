<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, userEvent } from 'storybook/test';
	import ConfirmForm from './ConfirmForm.svelte';

	const { Story } = defineMeta({ title: 'ConfirmForm', component: ConfirmForm });

	// Storybook's `enhance` reports a submit that gets through as an event instead of posting it.
	function recordSubmits() {
		const submitted = fn();
		window.addEventListener('storybook:enhance', submitted, { once: true });
		return submitted;
	}
</script>

<Story
	name="Confirmed"
	args={{ action: '?/delete', question: 'Delete source docs?', label: 'Delete source' }}
	play={async ({ canvas }) => {
		const submitted = recordSubmits();
		window.confirm = fn(() => true);
		await userEvent.click(canvas.getByRole('button', { name: 'Delete source' }));
		await expect(window.confirm).toHaveBeenCalledWith('Delete source docs?');
		await expect(submitted).toHaveBeenCalledOnce();
	}}
/>

<Story
	name="Cancelled"
	args={{ action: '?/delete', question: 'Delete source docs?', label: 'Delete source' }}
	play={async ({ canvas }) => {
		const submitted = recordSubmits();
		window.confirm = fn(() => false);
		await userEvent.click(canvas.getByRole('button', { name: 'Delete source' }));
		await expect(submitted).not.toHaveBeenCalled();
	}}
/>

<Story
	name="In a list, with a hidden input"
	args={{
		action: '?/revoke',
		question: 'Revoke the key ci?',
		label: 'Revoke',
		buttonLabel: 'Revoke ci'
	}}
	play={async ({ canvas, canvasElement }) => {
		await expect(canvas.getByRole('button', { name: 'Revoke ci' })).toHaveTextContent('Revoke');
		await expect(canvasElement.querySelector('input[name="id"]')).toHaveValue('3');
	}}
>
	{#snippet template(args)}
		<ConfirmForm {...args}>
			<input type="hidden" name="id" value="3" />
		</ConfirmForm>
	{/snippet}
</Story>
