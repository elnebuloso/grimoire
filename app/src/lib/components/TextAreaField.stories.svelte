<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent } from 'storybook/test';
	import TextAreaField from './TextAreaField.svelte';

	const { Story } = defineMeta({ title: 'TextAreaField', component: TextAreaField });
</script>

<Story
	name="With lines"
	args={{ label: 'Exclusions', name: 'exclusions', value: 'docs/drafts/**\nCHANGELOG.md' }}
	play={async ({ canvas }) => {
		const textarea = canvas.getByLabelText('Exclusions');
		await expect(textarea).toHaveValue('docs/drafts/**\nCHANGELOG.md');
		await userEvent.type(textarea, '\nREADME.md');
		await expect(textarea).toHaveValue('docs/drafts/**\nCHANGELOG.md\nREADME.md');
	}}
/>

<Story
	name="Empty"
	args={{ label: 'Exclusions', name: 'exclusions', value: '' }}
	play={async ({ canvas }) => {
		await expect(canvas.getByLabelText('Exclusions')).toHaveValue('');
	}}
/>
