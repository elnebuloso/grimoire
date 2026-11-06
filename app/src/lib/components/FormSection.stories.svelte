<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import FormSection from './FormSection.svelte';
	import TextField from './TextField.svelte';

	const { Story } = defineMeta({ title: 'FormSection', component: FormSection });
</script>

<Story
	name="With a lead"
	play={async ({ canvas }) => {
		const section = canvas.getByRole('region', { name: 'Repository' });
		await expect(section).toHaveTextContent('Where grimoire reads the documentation from.');
		await expect(canvas.getByLabelText('Branch')).toBeVisible();
	}}
>
	{#snippet template()}
		<FormSection title="Repository" lead="Where grimoire reads the documentation from.">
			<TextField label="Branch" name="branch" value="main" />
		</FormSection>
	{/snippet}
</Story>

<Story
	name="Without a lead"
	play={async ({ canvas }) => {
		const section = canvas.getByRole('region', { name: 'General' });
		await expect(section.querySelector('p')).toBeNull();
	}}
>
	{#snippet template()}
		<FormSection title="General">
			<TextField label="Name" name="name" />
		</FormSection>
	{/snippet}
</Story>
