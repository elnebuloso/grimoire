<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent } from 'storybook/test';
	import QueryForm from './QueryForm.svelte';

	const { Story } = defineMeta({ title: 'QueryForm', component: QueryForm });

	const values = { question: '', tokens: '3000' };
</script>

<Story
	name="Not sent yet"
	args={{ values }}
	play={async ({ canvas }) => {
		const question = canvas.getByRole('searchbox', { name: 'Search terms' });
		await expect(question).toHaveAttribute('placeholder', 'e.g. rollback deployment');
		await userEvent.type(question, 'rollback');
		await expect(question).toHaveValue('rollback');
		await expect(canvas.queryByRole('checkbox')).toBeNull();
		await expect(canvas.getByRole('spinbutton', { name: 'Token budget' })).toHaveValue(3000);
		await expect(canvas.queryByRole('heading', { name: 'Answer' })).toBeNull();
	}}
/>

<Story
	name="Answered"
	args={{
		values: { question: 'invoice', tokens: '500' },
		answer: '### billing-docs › Invoices\nSource: billing-docs/invoices'
	}}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('heading', { name: 'Answer' })).toBeVisible();
		await expect(canvas.getByRole('heading', { name: 'Answer' })).toHaveFocus();
		await expect(canvas.getByText(/Source: billing-docs\/invoices/)).toBeVisible();
	}}
/>

<Story
	name="Invalid"
	args={{
		values: { question: 'rollback', tokens: '0' },
		error: 'The token budget must be a positive whole number.'
	}}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('alert')).toHaveTextContent('positive whole number');
		const tokens = canvas.getByRole('spinbutton', { name: 'Token budget' });
		await expect(tokens).toHaveValue(0);
		await expect(tokens).toHaveAttribute('aria-invalid', 'true');
		await expect(tokens).toHaveAccessibleDescription(
			'The token budget must be a positive whole number.'
		);
		await expect(canvas.getByRole('searchbox')).not.toHaveAttribute('aria-invalid');
		await expect(tokens).toHaveFocus();
	}}
/>
