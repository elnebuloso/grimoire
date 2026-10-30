<script lang="ts">
	import FormError from '#lib/components/FormError.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<h1>{m.forgot_title()}</h1>

{#if form?.sent}
	<p role="status">{m.forgot_sent()}</p>
{:else}
	<p>{m.forgot_intro()}</p>
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
		<button>{m.forgot_submit()}</button>
	</form>
{/if}
