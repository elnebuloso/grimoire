<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, userEvent, waitFor } from 'storybook/test';
	import CopyButton from './CopyButton.svelte';

	const { Story } = defineMeta({ title: 'CopyButton', component: CopyButton });

	// The real clipboard needs a permission the test browser does not grant.
	function mockClipboard(writeText: (text: string) => Promise<void>) {
		const clipboard = { writeText: fn(writeText) };
		Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true });
		return clipboard;
	}
</script>

<Story
	name="Copied"
	args={{ value: 'grimoire_secret', label: 'Copy key' }}
	play={async ({ canvas }) => {
		const clipboard = mockClipboard(async () => {});
		await expect(canvas.getByRole('status')).toHaveTextContent('');

		await userEvent.click(canvas.getByRole('button', { name: 'Copy key' }));

		await expect(clipboard.writeText).toHaveBeenCalledWith('grimoire_secret');
		await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('Copied.'));
	}}
/>

<Story
	name="Clipboard refused"
	args={{ value: 'grimoire_secret', label: 'Copy key' }}
	play={async ({ canvas }) => {
		mockClipboard(async () => {
			throw new DOMException('Write permission denied.', 'NotAllowedError');
		});

		await userEvent.click(canvas.getByRole('button', { name: 'Copy key' }));

		await waitFor(() =>
			expect(canvas.getByRole('status')).toHaveTextContent(
				'Could not copy. Select the text and copy it by hand.'
			)
		);
	}}
/>
