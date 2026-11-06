<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import Dialog from './Dialog.svelte';
	import FormError from './FormError.svelte';
	import TextField from './TextField.svelte';

	/**
	 * Asks before an action: its question, what follows from it, and a button named after it. With
	 * `typed`, the button stays locked until that text is typed, for actions that destroy data or
	 * break what others use. The button submits the form `formId` names, or calls `onconfirm`.
	 */
	let {
		open = $bindable(false),
		title,
		consequence,
		confirmLabel,
		danger = false,
		typed,
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

	// Every opening starts empty, with a new field, and on the safe choice: cancel, or the field to
	// type into.
	$effect(() => {
		if (!open) return;
		typedValue = '';
		queueMicrotask(() => (typed ? box?.querySelector('input') : cancel)?.focus());
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
