<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent, waitFor, within } from 'storybook/test';
	import { NEW_SOURCE_FIELDS } from '#lib/source-fields.js';
	import SourceSettingsForm from './SourceSettingsForm.svelte';

	const values = {
		...NEW_SOURCE_FIELDS,
		name: 'Billing docs',
		gitUrl: 'https://gitlab.acme.example/billing/docs.git',
		path: 'docs',
		removeToken: false,
		encryptedToken: ''
	};
	const saved = { name: 'Billing docs', visibility: 'internal', hasToken: true };

	const { Story } = defineMeta({
		title: 'SourceSettingsForm',
		component: SourceSettingsForm,
		args: {
			values,
			source: saved,
			globalSchedule: '*/15 * * * *',
			timeZone: 'Europe/Berlin',
			instanceTitle: 'Acme Docs'
		}
	});

	/** The submitters of the posts the form sends, in order: Storybook's `enhance` reports them. */
	function recordPosts(): string[] {
		const posts: string[] = [];
		window.addEventListener('storybook:enhance', (event) => {
			const submit = (event as CustomEvent<[SubmitEvent]>).detail[0];
			posts.push(submit.submitter?.getAttribute('formaction') ?? 'save');
		});
		return posts;
	}
</script>

<Story
	name="Tests the connection, then saves"
	play={async ({ canvas }) => {
		const posts = recordPosts();
		await expect(
			canvas.getByLabelText('Access token (stored; leave empty to keep it)')
		).toHaveValue('');
		await userEvent.click(canvas.getByRole('button', { name: 'Test connection' }));
		await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
		await waitFor(() => expect(posts).toEqual(['?/test', 'save']));
		await expect(canvas.queryByRole('dialog')).toBeNull();
	}}
/>

<Story
	name="Asks before making a source public"
	play={async ({ canvasElement, canvas }) => {
		const posts = recordPosts();
		const page = within(canvasElement.ownerDocument.body);
		await userEvent.click(canvas.getByRole('radio', { name: /public/i }));

		// A connection test of the public source asks nothing.
		await userEvent.click(canvas.getByRole('button', { name: 'Test connection' }));
		await waitFor(() => expect(posts).toEqual(['?/test']));

		await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
		const dialog = await page.findByRole('dialog');
		await expect(posts).toEqual(['?/test']);
		await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(page.queryByRole('dialog')).toBeNull());
		await expect(posts).toEqual(['?/test']);

		await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
		await userEvent.click(
			within(await page.findByRole('dialog')).getByRole('button', { name: 'Save as public' })
		);
		await waitFor(() => expect(posts).toEqual(['?/test', 'save']));
	}}
/>

<Story
	name="Refused on a field, with the overlap to confirm"
	args={{
		refusal: {
			error: 'This source overlaps with "Billing API". Confirm to save it anyway.',
			field: 'confirmOverlap',
			overlap: true
		}
	}}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('alert')).toHaveTextContent('overlaps with "Billing API"');
		await expect(canvas.getByRole('checkbox', { name: /indexed twice/ })).toBeVisible();
	}}
/>

<Story
	name="The path refused by the Git server"
	args={{ refusal: { error: 'The path docs does not exist on branch main.', field: 'path' } }}
	play={async ({ canvas }) => {
		const path = canvas.getByRole('textbox', { name: /^Path in the repository/ });
		await expect(path).toHaveAttribute('aria-invalid', 'true');
		await expect(path).toHaveAccessibleDescription('The path docs does not exist on branch main.');
	}}
/>

<Story
	name="A new source"
	args={{
		source: undefined,
		values: { ...NEW_SOURCE_FIELDS, removeToken: false, encryptedToken: '' }
	}}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('button', { name: 'Create source' })).toBeVisible();
		await expect(canvas.getByLabelText('Access token (none stored)')).toBeVisible();
		await expect(canvas.getByText('* Required field')).toBeVisible();
		for (const label of ['Name', 'Git URL (HTTPS)', 'Branch']) {
			await expect(canvas.getByLabelText(label)).toBeRequired();
		}
		await expect(canvas.getByLabelText(/^Path in the repository/)).not.toBeRequired();
	}}
/>
