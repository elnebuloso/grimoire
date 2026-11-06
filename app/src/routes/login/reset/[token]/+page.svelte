<script lang="ts">
	import { resolve } from '$app/paths';
	import FormError from '#lib/components/FormError.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<PageHead title={m.reset_title()} />

{#if form?.done}
	<p class="notice" role="status">{m.reset_done()}</p>
	<p><a href={resolve('/login')}>{m.header_log_in()}</a></p>
{:else if !data.valid || form?.linkInvalid}
	<p class="notice alert" role="alert">
		{data.resetByMail ? m.auth_reset_link_invalid() : m.auth_reset_link_invalid_ask_admin()}
	</p>
	<p class="ways">
		{#if data.resetByMail}<a href={resolve('/login/forgot')}>{m.reset_request_new()}</a>{/if}
		<a href={resolve('/login')}>{m.header_log_in()}</a>
	</p>
{:else}
	<form method="post">
		<FormError message={form?.error} id="reset-error" />
		<TextField
			label={m.field_new_password()}
			name="password"
			type="password"
			required
			minlength={data.minPasswordLength}
			autocomplete="new-password"
			{...form?.field === 'password'
				? { 'aria-invalid': true, 'aria-describedby': 'reset-error' }
				: {}}
		/>
		<button class="primary">{m.reset_submit()}</button>
	</form>
{/if}

<style>
	.ways {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s4);
	}
</style>
