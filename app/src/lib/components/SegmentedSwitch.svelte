<script lang="ts">
	import { page } from '$app/state';

	/**
	 * A choice between a few options as a segmented track, the picked one raised. Each option is a
	 * button that posts the form, so it works without JavaScript; the endpoint sends the browser
	 * back to the page it came from.
	 */
	let {
		label,
		action,
		name,
		options,
		current
	}: {
		label: string;
		action: string;
		name: string;
		/** `lang` names the language an option is written in, if not the page's. */
		options: { value: string; label: string; lang?: string }[];
		current: string;
	} = $props();

	const labelId = $derived(`${name}-switch-label`);
</script>

<form method="post" {action} aria-labelledby={labelId}>
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
		border-radius: 10px;
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
		border-radius: 7px;
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
	@media (pointer: coarse) {
		button {
			min-height: 44px;
		}
	}
</style>
