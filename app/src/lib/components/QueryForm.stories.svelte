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
		answer: {
			hits: [
				{
					id: 'billing-docs/invoices#storno',
					titlePath: ['billing-docs', 'Invoices', 'Cancel an invoice'],
					content: 'Run:\n\n```\nbilling cancel <invoice>\n```'
				}
			],
			skipped: 2,
			raw: '### billing-docs › Invoices › Cancel an invoice\nSource: billing-docs/invoices#storno'
		}
	}}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('heading', { name: 'Answer' })).toHaveFocus();
		const hit = canvas.getByRole('region', { name: 'billing-docs › Invoices › Cancel an invoice' });
		await expect(hit).toHaveTextContent('billing-docs/invoices#storno');
		await expect(hit).toHaveTextContent('billing cancel <invoice>');
		await expect(canvas.getByText('2 more hits did not fit the token budget.')).toBeVisible();

		const raw = canvas.getByText('Raw answer, as an agent gets it');
		await expect(canvas.getByText(/^### billing-docs/)).not.toBeVisible();
		await userEvent.click(raw);
		await expect(canvas.getByText(/^### billing-docs/)).toBeVisible();
	}}
/>

<Story
	name="Nothing found"
	args={{
		values: { question: 'kubernetes ', tokens: '3000' },
		answer: { hits: [], skipped: 0, raw: 'No results for "kubernetes".' }
	}}
	play={async ({ canvas }) => {
		await expect(
			canvas.getByText('Nothing found for “kubernetes”. Try other words.')
		).toBeVisible();
		await expect(canvas.queryByText('Raw answer, as an agent gets it')).toBeNull();
	}}
/>

<Story
	name="Nothing fits the budget"
	args={{
		values: { question: 'invoice', tokens: '5' },
		answer: { hits: [], skipped: 3, raw: 'Did not fit: billing-docs/invoices' }
	}}
	play={async ({ canvas }) => {
		await expect(
			canvas.getByText('3 hits found, but none fits the token budget: raise it.')
		).toBeVisible();
	}}
/>

<Story
	name="Invalid"
	args={{
		values: { question: 'rollback', tokens: '0' },
		refusal: { error: 'Ask for at least one token.', field: 'tokens' }
	}}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('alert')).toHaveTextContent('Ask for at least one token.');
		const tokens = canvas.getByRole('spinbutton', { name: 'Token budget' });
		await expect(tokens).toHaveValue(0);
		await expect(tokens).toHaveAttribute('aria-invalid', 'true');
		await expect(tokens).toHaveAccessibleDescription('Ask for at least one token.');
		await expect(canvas.getByRole('searchbox')).not.toHaveAttribute('aria-invalid');
		await expect(tokens).toHaveFocus();
	}}
/>
