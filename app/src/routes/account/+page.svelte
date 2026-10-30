<script lang="ts">
	import FormError from '#lib/components/FormError.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<h1>{m.password_title()}</h1>

{#if form?.changed}
	<p role="status">{m.password_changed()}</p>
{/if}

<form method="post">
	<FormError message={form?.error} />
	<!-- Tells a password manager which saved login the new password belongs to. -->
	<TextField
		label={m.field_username()}
		name="username"
		readonly
		autocomplete="username"
		value={data.username}
	/>
	<TextField
		label={m.password_current()}
		name="current"
		type="password"
		required
		autocomplete="current-password"
	/>
	<TextField
		label={m.password_new()}
		name="password"
		type="password"
		required
		minlength={12}
		autocomplete="new-password"
	/>
	<button>{m.password_submit()}</button>
</form>
