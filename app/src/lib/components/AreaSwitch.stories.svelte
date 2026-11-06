<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect } from 'storybook/test';
	import AreaSwitch from './AreaSwitch.svelte';

	const { Story } = defineMeta({ title: 'AreaSwitch', component: AreaSwitch });
</script>

<Story
	name="User without a role"
	args={{ current: 'start', mayManage: false }}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('link', { name: 'Start' })).toHaveAttribute(
			'aria-current',
			'true'
		);
		await expect(canvas.getByRole('link', { name: 'Account' })).toHaveAttribute(
			'href',
			'/account/api-keys'
		);
		await expect(canvas.getByRole('link', { name: 'Account' })).not.toHaveAttribute('aria-current');
		await expect(canvas.queryByRole('link', { name: 'Management' })).toBeNull();
	}}
/>

<Story
	name="Admin"
	args={{ current: 'manage', mayManage: true }}
	play={async ({ canvas }) => {
		const manage = canvas.getByRole('link', { name: 'Management' });
		await expect(manage).toHaveAttribute('href', '/manage');
		await expect(manage).toHaveAttribute('aria-current', 'true');
		await expect(canvas.getByRole('link', { name: 'Start' })).not.toHaveAttribute('aria-current');
	}}
/>
