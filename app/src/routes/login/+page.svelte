<script lang="ts">
	import { resolve } from '$app/paths';
	import FormError from '#lib/components/FormError.svelte';
	import ProviderButtons from '#lib/components/ProviderButtons.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// The refusal concerns both fields: it never says which of the two was wrong.
	const invalid = $derived(
		form?.error ? { 'aria-invalid': true, 'aria-describedby': 'login-error' } : {}
	);
</script>

<PageHead title={m.login_title({ name: data.instanceTitle })} namesInstance>
	<p>
		{m.login_no_signup()}
		{#if data.providers.length > 0}{m.login_no_signup_providers()}{/if}
	</p>
</PageHead>

{#if data.imported && !form?.error}
	<p class="notice" role="status">{m.login_imported()}</p>
	{#if data.refused.length > 0}
		<p class="notice" role="status">
			{m.login_imported_refused({ sources: data.refused.join(', ') })}
		</p>
	{/if}
{/if}

<form method="post">
	<FormError message={form?.error ?? data.problem} id="login-error" />
	<TextField
		label={m.field_email()}
		name="email"
		type="email"
		required
		autocomplete="username"
		value={form?.email ?? ''}
		{...invalid}
	/>
	<TextField
		label={m.field_password()}
		name="password"
		type="password"
		required
		autocomplete="current-password"
		{...invalid}
	/>
	<button class="primary">{m.header_log_in()}</button>
</form>

<ProviderButtons providers={data.providers} fields={{ next: data.next }} />

{#if data.resetByMail}
	<p class="forgot"><a href={resolve('/login/forgot')}>{m.login_forgot()}</a></p>
{/if}

<style>
	.forgot {
		padding-top: var(--s4);
		border-top: 1px solid var(--line);
	}
</style>
