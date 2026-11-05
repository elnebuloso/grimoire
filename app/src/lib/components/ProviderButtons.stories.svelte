<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import ProviderButtons from './ProviderButtons.svelte';

	const { Story } = defineMeta({ title: 'ProviderButtons', component: ProviderButtons });
</script>

<Story
	name="Two providers"
	args={{
		providers: [
			{ key: 'gitlab', label: 'GitLab' },
			{ key: 'entra', label: 'Microsoft' }
		],
		fields: { next: '/account' }
	}}
	play={async ({ canvas, canvasElement }) => {
		const gitlab = canvas.getByRole('button', { name: 'Log in with GitLab' });
		await expect(canvas.getByRole('button', { name: 'Log in with Microsoft' })).toBeVisible();
		const form = gitlab.closest('form')!;
		await expect(form.getAttribute('action')).toMatch(/\/auth\/oidc\/gitlab$/);
		await expect(form.getAttribute('method')).toBe('post');
		const next = canvasElement.querySelector<HTMLInputElement>('input[name="next"]');
		await expect(next?.value).toBe('/account');
	}}
/>

<Story
	name="Without providers"
	args={{ providers: [] }}
	play={async ({ canvas }) => {
		await expect(canvas.queryByRole('button')).toBeNull();
	}}
/>
