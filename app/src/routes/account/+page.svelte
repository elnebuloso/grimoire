<script lang="ts">
	import FormError from '#lib/components/FormError.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Each refusal but the lockout concerns one field; it points to the message and takes focus.
	// MIN_PASSWORD_LENGTH of the server, which code in the browser cannot import.
	const MIN_LENGTH = 12;
	const marked = (message: string) =>
		form?.error === message ? { 'aria-invalid': true, 'aria-describedby': 'password-error' } : {};

	let sheet = $state<HTMLElement>();
	$effect(() => {
		if (form?.error) sheet?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
	});
</script>

<PageHead title={m.password_title()}>{m.password_lead()}</PageHead>

{#if form?.changed}
	<p class="notice" role="status">{m.password_changed()}</p>
{/if}

<section class="sheet" bind:this={sheet}>
	<form method="post">
		<FormError message={form?.error} id="password-error" />
		<!-- Tells a password manager which saved login the new password belongs to. -->
		<TextField
			label={m.field_email()}
			name="email"
			type="email"
			readonly
			autocomplete="username"
			value={data.email}
		/>
		<TextField
			label={m.password_current()}
			name="current"
			type="password"
			required
			autocomplete="current-password"
			{...marked(m.auth_wrong_current_password())}
		/>
		<TextField
			label={m.password_new()}
			name="password"
			type="password"
			required
			minlength={MIN_LENGTH}
			autocomplete="new-password"
			{...marked(m.auth_new_password_too_short({ min: MIN_LENGTH }))}
		/>
		<button class="primary">{m.password_submit()}</button>
	</form>
</section>
