<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import FormError from './FormError.svelte';

	const { Story } = defineMeta({ title: 'FormError', component: FormError });
</script>

<Story
	name="With a message"
	args={{ message: 'Wrong username or password.' }}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('alert')).toHaveTextContent('Wrong username or password.');
	}}
/>

<Story
	name="Without a message"
	args={{}}
	play={async ({ canvas }) => {
		await expect(canvas.queryByRole('alert')).toBeNull();
	}}
/>
