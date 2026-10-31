<script lang="ts">
	import { resolve } from '$app/paths';
	import FormError from '#lib/components/FormError.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// MIN_PASSWORD_LENGTH of the server, which code in the browser cannot import.
	const MIN_LENGTH = 12;
	// The one refusal about the field: a password too short.
	const tooShort = $derived(
		form?.error === m.auth_password_too_short({ min: MIN_LENGTH })
			? { 'aria-invalid': true, 'aria-describedby': 'reset-error' }
			: {}
	);
</script>

<PageHead title={m.reset_title()} />

{#if form?.done}
	<p class="notice" role="status">{m.reset_done()}</p>
	<p><a href={resolve('/login')}>{m.header_log_in()}</a></p>
{:else if !data.valid || form?.linkInvalid}
	<p class="notice alert" role="alert">{m.auth_reset_link_invalid()}</p>
	<p><a href={resolve('/login/forgot')}>{m.reset_request_new()}</a></p>
{:else}
	<section class="sheet">
		<form method="post">
			<FormError message={form?.error} id="reset-error" />
			<TextField
				label={m.field_new_password()}
				name="password"
				type="password"
				required
				minlength={MIN_LENGTH}
				autocomplete="new-password"
				{...tooShort}
			/>
			<button class="primary">{m.reset_submit()}</button>
		</form>
	</section>
{/if}
