<script lang="ts">
	import FormError from '#lib/components/FormError.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<h1>{m.login_title()}</h1>

<form method="post">
	<FormError message={form?.error} />
	<TextField
		label={m.field_email()}
		name="email"
		type="email"
		required
		autocomplete="username"
		value={form?.email ?? ''}
	/>
	<TextField
		label={m.field_password()}
		name="password"
		type="password"
		required
		autocomplete="current-password"
	/>
	<button>{m.header_log_in()}</button>
</form>
