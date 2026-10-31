<script lang="ts">
	import { resolve } from '$app/paths';
	import FormError from '#lib/components/FormError.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

{#if form?.sent}
	<PageHead title={m.forgot_title()} />
	<p class="notice" role="status">{m.forgot_sent()}</p>
	<p><a href={resolve('/login')}>{m.header_log_in()}</a></p>
{:else}
	<PageHead title={m.forgot_title()}><p>{m.forgot_intro()}</p></PageHead>
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
			<button class="primary">{m.forgot_submit()}</button>
		</form>
	</section>
{/if}
