<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import Dialog from './Dialog.svelte';
	import FormError from './FormError.svelte';
	import TextField from './TextField.svelte';

	/**
	 * Asks before an action: its question, what follows from it, and a button named after it. With
	 * `typed`, the button stays locked until that text is typed, for actions that destroy data or
	 * break what others use. With `password`, it asks for the current password, for actions an open
	 * session left behind must not take. The button submits the form `formId` names, or calls
	 * `onconfirm`.
	 */
	let {
		open = $bindable(false),
		title,
		consequence,
		confirmLabel,
		danger = false,
		typed,
		password = false,
		formId,
		onconfirm,
		busy = false,
		error
	}: {
		open?: boolean;
		title: string;
		consequence: string;
		confirmLabel: string;
		danger?: boolean;
		/** Text to type before the button unlocks, posted as `confirmation`. */
		typed?: { value: string; label: string };
		/** Asks for the current password, posted as `current`. */
		password?: boolean;
		formId?: string;
		onconfirm?: () => void;
		/** The action is running. */
		busy?: boolean;
		/** Why the action was refused. */
		error?: string;
	} = $props();

	let typedValue = $state('');
	let cancel = $state<HTMLButtonElement>();
	let box = $state<HTMLDivElement>();
	const locked = $derived(typed !== undefined && typedValue !== typed.value);

	// Every opening starts empty, with new fields, and on the safe choice: cancel, or the first field
	// to type into.
	$effect(() => {
		if (!open) return;
		typedValue = '';
		queueMicrotask(() => (typed || password ? box?.querySelector('input') : cancel)?.focus());
	});
</script>

<Dialog bind:open {title}>
	<div class="body" bind:this={box}>
		<p>{consequence}</p>
		<FormError message={error} />
		{#if typed}
			{#key open}
				<TextField
					label={typed.label}
					name="confirmation"
					form={formId}
					autocomplete="off"
					mono
					value=""
					oninput={(event) => (typedValue = event.currentTarget.value)}
				/>
			{/key}
		{/if}
		<!-- Only while open: a required field of the form, it would fail the check the button that
		opens the dialog runs on the form's fields. -->
		{#if password && open}
			<TextField
				label={m.password_current()}
				name="current"
				type="password"
				form={formId}
				required
				autocomplete="current-password"
				value=""
			/>
		{/if}
	</div>
	{#snippet actions()}
		<button type="button" bind:this={cancel} onclick={() => (open = false)}
			>{m.dialog_cancel()}</button
		>
		<button
			type={formId ? 'submit' : 'button'}
			form={formId}
			class={danger ? 'danger' : 'primary'}
			disabled={locked || busy}
			aria-busy={busy || undefined}
			onclick={formId ? undefined : onconfirm}>{confirmLabel}</button
		>
	{/snippet}
</Dialog>

<style>
	.body {
		display: grid;
		gap: var(--s3);
	}
	p {
		margin: 0;
		text-wrap: pretty;
	}
</style>
