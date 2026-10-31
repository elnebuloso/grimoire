<script lang="ts">
	import FormError from '#lib/components/FormError.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<PageHead title={m.password_title()}>{m.password_lead()}</PageHead>

{#if form?.changed}
	<p class="notice" role="status">{m.password_changed()}</p>
{/if}

<section class="sheet">
	<form method="post">
		<FormError message={form?.error} />
		<!-- Tells a password manager which saved login the new password belongs to. -->
		<TextField
			label={m.field_email()}
			name="email"
			type="email"
			readonly
			autocomplete="username"
			value={data.email}
		/>
		<TextField
			label={m.password_current()}
			name="current"
			type="password"
			required
			autocomplete="current-password"
		/>
		<TextField
			label={m.password_new()}
			name="password"
			type="password"
			required
			minlength={12}
			autocomplete="new-password"
		/>
		<button class="primary">{m.password_submit()}</button>
	</form>
</section>
