<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, userEvent } from 'storybook/test';
	import ConfirmForm from './ConfirmForm.svelte';

	const { Story } = defineMeta({ title: 'ConfirmForm', component: ConfirmForm });

	// The story stays on its page: a submit that gets through is recorded instead of posted.
	function recordSubmits(canvasElement: HTMLElement) {
		const submitted = fn();
		canvasElement.querySelector('form')!.addEventListener('submit', (event) => {
			if (!event.defaultPrevented) submitted();
			event.preventDefault();
		});
		return submitted;
	}
</script>

<Story
	name="Confirmed"
	args={{ action: '?/delete', question: 'Delete source docs?', label: 'Delete source' }}
	play={async ({ canvas, canvasElement }) => {
		const submitted = recordSubmits(canvasElement);
		window.confirm = fn(() => true);
		await userEvent.click(canvas.getByRole('button', { name: 'Delete source' }));
		await expect(window.confirm).toHaveBeenCalledWith('Delete source docs?');
		await expect(submitted).toHaveBeenCalledOnce();
	}}
/>

<Story
	name="Cancelled"
	args={{ action: '?/delete', question: 'Delete source docs?', label: 'Delete source' }}
	play={async ({ canvas, canvasElement }) => {
		const submitted = recordSubmits(canvasElement);
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
