<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import TextField from './TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { upcomingRuns } from '#lib/schedule.js';

	/**
	 * A cron schedule with its next runs below it while it is typed, or those of the global default
	 * while it is empty. Further attributes, such as `aria-invalid`, go on the input; a description
	 * the page gives it, such as its error message, is read before the field's own.
	 */
	let {
		label,
		value = '',
		globalSchedule,
		timeZone,
		'aria-describedby': describedBy,
		...input
	}: {
		label: string;
		value?: string;
		globalSchedule: string;
		/** The instance's time zone, which the scheduler reads schedules in. */
		timeZone: string;
	} & HTMLInputAttributes = $props();

	// svelte-ignore state_referenced_locally
	let typed = $state(value);
	const now = new Date();
	const hintId = $props.id();

	const own = $derived(typed.trim() !== '');
	const runs = $derived(upcomingRuns(own ? typed : globalSchedule, timeZone, now));
	const format = $derived(
		new Intl.DateTimeFormat(getLocale(), {
			timeZone,
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		})
	);
	const listed = $derived(runs?.map((run) => format.format(run)).join(' · '));
</script>

<div class="schedule">
	<TextField
		{label}
		{value}
		mono
		aria-describedby={describedBy ? `${describedBy} ${hintId}` : hintId}
		oninput={(event: Event) => (typed = (event.currentTarget as HTMLInputElement).value)}
		{...input}
	/>
	<p class="hint" id={hintId} aria-live="polite">
		{#if !listed}
			{m.schedule_invalid()}
		{:else if own}
			{m.schedule_next_runs({ zone: timeZone, runs: listed })}
		{:else}
			{m.schedule_global({ schedule: globalSchedule, zone: timeZone, runs: listed })}
		{/if}
	</p>
</div>

<style>
	.schedule {
		display: grid;
		gap: var(--s2);
	}
	.hint {
		color: var(--ink-2);
		font-size: var(--fs-3);
	}
</style>
