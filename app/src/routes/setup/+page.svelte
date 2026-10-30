<script lang="ts">
	import FormError from '#lib/components/FormError.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<PageHead title={m.setup_title()}><p>{m.setup_intro()}</p></PageHead>

<section class="sheet">
	<form method="post">
		<FormError message={form?.error} />
		<TextField label={m.setup_token()} name="token" required autocomplete="off" mono />
		<TextField
			label={m.field_email()}
			name="email"
			type="email"
			required
			autocomplete="username"
			value={form?.email ?? ''}
		/>
		<TextField
			label={m.field_new_password()}
			name="password"
			type="password"
			required
			minlength={12}
			autocomplete="new-password"
		/>
		<button class="primary">{m.setup_submit()}</button>
	</form>
</section>
