<script lang="ts">
	import { resolve } from '$app/paths';
	import FormError from '#lib/components/FormError.svelte';
	import ProviderButtons from '#lib/components/ProviderButtons.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { markRefusal } from '#lib/forms.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

{#if !data.email || form?.linkInvalid}
	<PageHead title={m.invite_title({ name: data.instanceTitle })} namesInstance />
	<p class="notice alert" role="alert">{form?.error ?? m.auth_invite_link_invalid()}</p>
	<p><a href={resolve('/login')}>{m.header_log_in()}</a></p>
{:else}
	<PageHead title={m.invite_title({ name: data.instanceTitle })} namesInstance
		><p>{m.invite_intro()}</p></PageHead
	>
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
			minlength={data.minPasswordLength}
			autocomplete="new-password"
			{...markRefusal(form, 'password', 'invite-error')}
		/>
		<button class="primary">{m.invite_submit()}</button>
	</form>
	<ProviderButtons providers={data.providers} fields={{ invite: data.token }} />
{/if}
