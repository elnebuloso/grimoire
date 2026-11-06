<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent, within } from 'storybook/test';
	import SourcePicker from './SourcePicker.svelte';

	const { Story } = defineMeta({ title: 'SourcePicker', component: SourcePicker });

	const few = [
		{ slug: 'auth-service', name: 'Auth Service' },
		{ slug: 'billing-docs', name: 'Billing' },
		{ slug: 'platform-docs', name: 'Platform' }
	];
	const many = Array.from({ length: 500 }, (_, index) => {
		const number = String(index + 1).padStart(3, '0');
		return { slug: `team-${number}-docs`, name: `Team ${number}` };
	});

	/** The slugs the form would send. */
	const sent = (canvasElement: HTMLElement) =>
		[...canvasElement.querySelectorAll<HTMLInputElement>('input[type="hidden"]')].map(
			(input) => input.value
		);
</script>

<Story
	name="Nothing chosen"
	args={{ sources: few, label: 'Only these sources' }}
	play={async ({ canvas, canvasElement }) => {
		await expect(canvas.queryByRole('list', { name: /Chosen sources/ })).toBeNull();
		const matches = within(canvas.getByRole('list', { name: 'Matching sources' }));
		await expect(matches.getAllByRole('checkbox')).toHaveLength(3);

		await userEvent.click(matches.getByRole('checkbox', { name: /Billing/ }));
		await expect(canvas.getByRole('list', { name: 'Chosen sources (1)' })).toHaveTextContent(
			'billing-docs'
		);
		await expect(sent(canvasElement)).toEqual(['billing-docs']);
	}}
/>

<Story
	name="Chosen"
	args={{ sources: few, selected: ['platform-docs', 'auth-service'], label: 'Only these sources' }}
	play={async ({ canvas, canvasElement }) => {
		await expect(sent(canvasElement)).toEqual(['platform-docs', 'auth-service']);
		await expect(canvas.getByRole('checkbox', { name: /Platform/ })).toBeChecked();

		await userEvent.click(canvas.getByRole('button', { name: 'Remove Platform' }));
		await expect(sent(canvasElement)).toEqual(['auth-service']);
		await expect(canvas.getByRole('checkbox', { name: /Platform/ })).not.toBeChecked();
	}}
/>

<Story
	name="Hundreds of sources"
	args={{ sources: many, label: 'Only these sources' }}
	play={async ({ canvas, canvasElement }) => {
		await expect(canvas.getAllByRole('checkbox')).toHaveLength(8);
		await expect(canvas.getByRole('status')).toHaveTextContent('8 of 500 shown');

		// Three given sources, found by search without scrolling.
		const search = canvas.getByRole('searchbox', { name: 'Search sources by name or slug' });
		for (const number of ['042', '137', '404']) {
			await userEvent.clear(search);
			await userEvent.type(search, `team-${number}{Enter}`);
			await userEvent.click(canvas.getByRole('checkbox', { name: new RegExp(`Team ${number}`) }));
		}
		await expect(sent(canvasElement)).toEqual(['team-042-docs', 'team-137-docs', 'team-404-docs']);
	}}
/>

<Story
	name="No match"
	args={{ sources: few, label: 'Only these sources' }}
	play={async ({ canvas }) => {
		await userEvent.type(canvas.getByRole('searchbox'), 'payroll');
		await expect(canvas.getByText('No source matches the search.')).toBeVisible();
		await expect(canvas.queryByRole('checkbox')).toBeNull();
	}}
/>

<Story
	name="Refused"
	args={{
		sources: few,
		label: 'Only these sources',
		'aria-invalid': true
	}}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('searchbox')).toHaveAttribute('aria-invalid', 'true');
	}}
/>
