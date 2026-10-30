<script lang="ts">
	import { resolve } from '$app/paths';
	import FormError from '#lib/components/FormError.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<PageHead title={m.login_title()} />

<section class="sheet">
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
		<TextField
			label={m.field_password()}
			name="password"
			type="password"
			required
			autocomplete="current-password"
		/>
		<button class="primary">{m.header_log_in()}</button>
	</form>

	{#if data.resetByMail}
		<p class="forgot"><a href={resolve('/login/forgot')}>{m.login_forgot()}</a></p>
	{/if}
</section>

<style>
	.forgot {
		padding-top: var(--s4);
		border-top: 1px solid var(--line);
	}
</style>
