<script lang="ts">
	import { resolve } from '$app/paths';
	import FormError from '#lib/components/FormError.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<p><a href={resolve('/admin')}>All projects</a></p>
<h1>Change the password</h1>

{#if form?.changed}
	<p role="status">Password changed. Every other session was logged out.</p>
{/if}

<form method="post">
	<FormError message={form?.error} />
	<!-- Tells a password manager which saved login the new password belongs to. -->
	<TextField
		label="Username"
		name="username"
		readonly
		autocomplete="username"
		value={data.username}
	/>
	<TextField
		label="Current password"
		name="current"
		type="password"
		required
		autocomplete="current-password"
	/>
	<TextField
		label="New password (at least 12 characters)"
		name="password"
		type="password"
		required
		minlength={12}
		autocomplete="new-password"
	/>
	<button>Change password</button>
</form>
