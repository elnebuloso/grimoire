<script lang="ts">
	import FormError from '#lib/components/FormError.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// MIN_LENGTH is the server's MIN_PASSWORD_LENGTH, which code in the browser cannot import.
	const MIN_LENGTH = 12;
</script>

<PageHead title={m.invite_title({ name: data.instanceTitle })} namesInstance
	><p>{m.invite_intro()}</p></PageHead
>

{#if !data.email || form?.linkInvalid}
	<p class="notice alert" role="alert">{form?.error ?? m.auth_invite_link_invalid()}</p>
{:else}
	<section class="sheet">
		<form method="post">
			<FormError message={form?.error} id="invite-error" />
			<!-- Fixed: the invitation is for this address. It also tells a password manager the login. -->
			<TextField
				label={m.field_email()}
				name="email"
				type="email"
				readonly
				autocomplete="username"
				value={data.email}
			/>
			<TextField
				label={m.field_new_password()}
				name="password"
				type="password"
				required
				minlength={MIN_LENGTH}
				autocomplete="new-password"
				{...form?.error ? { 'aria-invalid': true, 'aria-describedby': 'invite-error' } : {}}
			/>
			<button class="primary">{m.invite_submit()}</button>
		</form>
	</section>
{/if}
