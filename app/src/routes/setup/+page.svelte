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
	const importMarked = (field: string) =>
		form?.field === field ? { 'aria-invalid': true, 'aria-describedby': 'import-error' } : {};
</script>

<PageHead title={m.setup_title({ name: data.instanceTitle })} namesInstance
	><p>{m.setup_intro()}</p></PageHead
>

<div class="ways">
	<section class="sheet" aria-labelledby="new-title">
		<h2 id="new-title">{m.setup_new_title()}</h2>
		<p class="muted">{m.setup_new_lead()}</p>
		<form method="post" action="?/create">
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

	<section class="sheet" aria-labelledby="import-title">
		<h2 id="import-title">{m.setup_import_title()}</h2>
		<p class="muted">{m.setup_import_lead()}</p>
		<form method="post" action="?/import" enctype="multipart/form-data">
			<FormError message={form?.importError} id="import-error" />
			<TextField
				label={m.setup_token()}
				name="token"
				required
				autocomplete="off"
				mono
				{...importMarked('token')}
			/>
			<TextField
				label={m.setup_import_file()}
				name="file"
				type="file"
				required
				accept=".grimoire-export"
				{...importMarked('file')}
			/>
			<TextField
				label={m.setup_import_passphrase()}
				name="passphrase"
				type="password"
				required
				autocomplete="off"
				{...importMarked('passphrase')}
			/>
			<button class="primary">{m.setup_import_submit()}</button>
		</form>
	</section>
</div>

<style>
	.ways {
		display: grid;
		grid-template-columns: 1fr 1fr;
		align-items: start;
		gap: var(--s5);
	}
</style>
