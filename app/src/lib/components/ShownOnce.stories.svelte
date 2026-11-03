<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import ShownOnce from './ShownOnce.svelte';

	const { Story } = defineMeta({ title: 'ShownOnce', component: ShownOnce });
</script>

<Story
	name="Invitation link"
	args={{
		value: 'https://grimoire.example.com/invite/Jb3q9V6mXo2kR8tW1yZp4sLc7nHd0fGa5eUi',
		copyLabel: 'Copy link'
	}}
	play={async ({ canvas, canvasElement }) => {
		await expect(canvasElement.querySelector('output')).toHaveTextContent(
			'https://grimoire.example.com/invite/Jb3q9V6mXo2kR8tW1yZp4sLc7nHd0fGa5eUi'
		);
		await expect(canvas.getByRole('button', { name: 'Copy link' })).toBeVisible();
	}}
/>
