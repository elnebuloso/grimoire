<script lang="ts">
	import FormError from '#lib/components/FormError.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<h1>Log in to grimoire</h1>

<form method="post">
	<FormError message={form?.error} />
	<TextField
		label="Username"
		name="username"
		required
		autocomplete="username"
		value={form?.username ?? ''}
	/>
	<TextField
		label="Password"
		name="password"
		type="password"
		required
		autocomplete="current-password"
	/>
	<button>Log in</button>
</form>
