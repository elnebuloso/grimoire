<script lang="ts">
	import FormError from '#lib/components/FormError.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Each refusal concerns one field: it is marked and points to the message.
	// MIN_LENGTH is the server's MIN_PASSWORD_LENGTH, which code in the browser cannot import.
	const MIN_LENGTH = 12;
	const marked = (message: string) =>
		form?.error === message ? { 'aria-invalid': true, 'aria-describedby': 'setup-error' } : {};
</script>

<PageHead title={m.setup_title({ name: data.instanceName })} namesInstance
	><p>{m.setup_intro()}</p></PageHead
>

<section class="sheet">
	<form method="post">
		<FormError message={form?.error} id="setup-error" />
		<TextField
			label={m.setup_token()}
			name="token"
			required
			autocomplete="off"
			mono
			{...marked(m.auth_wrong_setup_token())}
		/>
		<TextField
			label={m.field_email()}
			name="email"
			type="email"
			required
			autocomplete="username"
			value={form?.email ?? ''}
			{...marked(m.auth_email_invalid())}
		/>
		<TextField
			label={m.field_new_password()}
			name="password"
			type="password"
			required
			minlength={MIN_LENGTH}
			autocomplete="new-password"
			{...marked(m.auth_password_too_short({ min: MIN_LENGTH }))}
		/>
		<button class="primary">{m.setup_submit()}</button>
	</form>
</section>
