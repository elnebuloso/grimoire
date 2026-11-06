<script lang="ts">
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import { showToast } from '#lib/toasts.svelte.js';

	/**
	 * A choice between a few options as a segmented track, the picked one raised. Each option is a
	 * button that posts the form; the page stays and `onpick` applies the choice in place.
	 */
	let {
		label,
		action,
		name,
		options,
		current,
		onpick
	}: {
		label: string;
		action: string;
		name: string;
		/** `lang` names the language an option is written in, if not the page's. */
		options: { value: string; label: string; lang?: string }[];
		current: string;
		/** Runs once the endpoint stored the choice. */
		onpick: (value: string) => void | Promise<void>;
	} = $props();

	async function pick(event: SubmitEvent) {
		event.preventDefault();
		const form = event.currentTarget as HTMLFormElement;
		const body = new FormData(form, event.submitter);
		// The endpoint stores the choice and redirects back for a plain form; that page is not needed
		// here, and on an error page it would answer with an error.
		const response = await fetch(action, { method: 'POST', body, redirect: 'manual' }).catch(
			() => undefined
		);
		if (response && (response.type === 'opaqueredirect' || response.ok)) {
			await onpick(String(body.get(name)));
		} else {
			showToast(m.switch_failed());
		}
	}

	const labelId = $derived(`${name}-switch-label`);
</script>

<form method="post" {action} aria-labelledby={labelId} onsubmit={pick}>
	<span id={labelId}>{label}</span>
	<input type="hidden" name="redirectTo" value={page.url.pathname + page.url.search} />
	{#each options as option (option.value)}
		<button {name} value={option.value} lang={option.lang} aria-pressed={option.value === current}
			>{option.label}</button
		>
	{/each}
</form>

<style>
	/* A recessed groove, the picked option raised out of it. */
	form {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 2px;
		padding: 3px;
		background: var(--well);
		border-radius: var(--r-control);
		box-shadow: var(--sink);
	}
	span {
		padding-inline: var(--s1) var(--s2);
		color: var(--ink-2);
		font-size: 12px;
		font-weight: 500;
	}
	button {
		min-height: 32px;
		padding: 0 var(--s3);
		color: var(--ink-2);
		background: transparent;
		border: 0;
		border-radius: var(--r-small);
		box-shadow: none;
		font-size: 13px;
		font-weight: 400;
	}
	button:hover {
		color: var(--ink);
	}
	button[aria-pressed='true'] {
		color: var(--ink);
		background: var(--raised);
		box-shadow: var(--lift-raised);
		font-weight: 500;
	}
	/* On a phone the two tracks share one row only without their labels; the options name
	themselves, and the label stays the form's accessible name. */
	@media (max-width: 40rem) {
		span {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}
	}
	@media (pointer: coarse) {
		button {
			min-height: 44px;
		}
	}
</style>
