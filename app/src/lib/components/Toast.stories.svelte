<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, spyOn, userEvent, waitFor } from 'storybook/test';
	import Toast from './Toast.svelte';

	const { Story } = defineMeta({
		title: 'Toast',
		component: Toast,
		args: { ondismiss: fn() }
	});

	const revoked = { id: 1, message: 'Key laptop revoked.' };
	const saved = { id: 2, message: 'Source Billing docs saved. A sync has started.' };
</script>

<Story
	name="One message"
	args={{ items: [revoked] }}
	play={async ({ canvas }) => {
		const region = canvas.getByRole('status', { name: 'Notifications' });
		await expect(region).toHaveTextContent('Key laptop revoked.');
		await expect(canvas.getByRole('button', { name: 'Close' })).toBeVisible();
	}}
/>

<Story
	name="Stacked, newest on top"
	args={{ items: [saved, revoked] }}
	play={async ({ canvas }) => {
		const items = canvas.getAllByRole('listitem');
		await expect(items).toHaveLength(2);
		await expect(items[0]).toHaveTextContent('Source Billing docs saved.');
		await expect(items[1]).toHaveTextContent('Key laptop revoked.');
	}}
/>

<Story
	name="Empty"
	args={{ items: [] }}
	play={async ({ canvas }) => {
		// The live region stays in the page, so the next message is announced.
		await expect(canvas.getByRole('status', { name: 'Notifications' })).toBeInTheDocument();
		await expect(canvas.queryAllByRole('listitem')).toHaveLength(0);
	}}
/>

<Story
	name="Closed by its button"
	args={{ items: [revoked] }}
	play={async ({ args, canvas }) => {
		await userEvent.click(canvas.getByRole('button', { name: 'Close' }));
		await expect(args.ondismiss).toHaveBeenCalledWith(1);
	}}
/>

<Story
	name="Gone after its time"
	args={{ items: [revoked], duration: 50 }}
	play={async ({ args }) => {
		await waitFor(() => expect(args.ondismiss).toHaveBeenCalledWith(1));
	}}
/>

<Story
	name="Kept while the pointer rests on it"
	args={{ items: [revoked], duration: 600_000 }}
	play={async ({ args, canvas }) => {
		// The timer started at mount runs in real time but not within the story; the ones after it
		// wait in `pending` until the story lets them run, so no hover races a clock.
		const pending: Record<number, () => void> = {};
		let nextId = 1_000_000;
		const realSet = window.setTimeout;
		const realClear = window.clearTimeout;
		const set = spyOn(window, 'setTimeout').mockImplementation(((
			run: () => void,
			delay?: number,
			...rest: unknown[]
		) => {
			if (delay !== args.duration) return realSet(run, delay, ...rest);
			pending[++nextId] = run;
			return nextId;
		}) as typeof setTimeout);
		const clear = spyOn(window, 'clearTimeout').mockImplementation((id) => {
			if ((id as number) in pending) delete pending[id as number];
			else realClear(id);
		});
		const elapse = () => {
			const due = Object.values(pending);
			for (const id of Object.keys(pending)) delete pending[Number(id)];
			due.forEach((run) => run());
		};
		try {
			const item = canvas.getByRole('listitem');
			await userEvent.hover(item);
			await expect(clear).toHaveBeenCalled();
			await expect(Object.keys(pending)).toHaveLength(0);
			elapse();
			await expect(args.ondismiss).not.toHaveBeenCalled();

			await userEvent.unhover(item);
			await expect(Object.keys(pending)).toHaveLength(1);
			elapse();
			await expect(args.ondismiss).toHaveBeenCalledWith(1);
		} finally {
			set.mockRestore();
			clear.mockRestore();
		}
	}}
/>
