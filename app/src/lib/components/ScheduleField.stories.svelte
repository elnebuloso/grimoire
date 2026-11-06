<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, userEvent } from 'storybook/test';
	import ScheduleField from './ScheduleField.svelte';

	const { Story } = defineMeta({ title: 'ScheduleField', component: ScheduleField });

	const args = {
		label: 'Schedule: cron expression with five fields, empty for the global one (*/15 * * * *)',
		name: 'schedule',
		globalSchedule: '*/15 * * * *',
		timeZone: 'Europe/Berlin'
	};
	const field =
		'Schedule: cron expression with five fields, empty for the global one (*/15 * * * *)';
</script>

<Story
	name="Empty, the global default"
	{args}
	play={async ({ canvas }) => {
		await expect(canvas.getByRole('textbox', { name: field })).toHaveAccessibleDescription(
			/^Global default \*\/15 \* \* \* \*, next runs \(Europe\/Berlin\): .+ · .+ · .+$/
		);
	}}
/>

<Story
	name="Own schedule"
	args={{ ...args, value: '0 6 * * 1-5' }}
	play={async ({ canvas }) => {
		const input = canvas.getByRole('textbox', { name: field });
		await expect(input).toHaveAccessibleDescription(/^Next runs \(Europe\/Berlin\): .*06:00/);
		await expect(input).not.toHaveAccessibleDescription(/(Sat|Sun)/);
	}}
/>

<Story
	name="Invalid while typing"
	{args}
	play={async ({ canvas }) => {
		const input = canvas.getByRole('textbox', { name: field });
		await userEvent.type(input, 'every morning');
		await expect(input).toHaveAccessibleDescription('Not a valid schedule yet.');
		await userEvent.clear(input);
		await expect(input).toHaveAccessibleDescription(/^Global default/);
	}}
/>

<Story
	name="Refused by the server"
	args={{ ...args, value: '0 0 6 * * *', 'aria-invalid': true }}
	play={async ({ canvas }) => {
		const input = canvas.getByRole('textbox', { name: field });
		await expect(input).toHaveAttribute('aria-invalid', 'true');
		await expect(input).toHaveValue('0 0 6 * * *');
		await expect(input).toHaveAccessibleDescription('Not a valid schedule yet.');
	}}
/>
