<script lang="ts">
	import FormError from '#lib/components/FormError.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<h1>Set up grimoire</h1>
<p>Choose the admin account. The setup token is in the server log.</p>

<form method="post">
	<FormError message={form?.error} />
	<TextField label="Setup token" name="token" required autocomplete="off" />
	<TextField
		label="Username"
		name="username"
		required
		autocomplete="username"
		value={form?.username ?? ''}
	/>
	<TextField
		label="Password (at least 12 characters)"
		name="password"
		type="password"
		required
		minlength={12}
		autocomplete="new-password"
	/>
	<button>Create admin account</button>
</form>
