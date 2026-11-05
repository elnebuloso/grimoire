<script lang="ts">
	import ConfirmAction from '#lib/components/ConfirmAction.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { submitWithToast } from '#lib/forms.js';
	import { showToast } from '#lib/toasts.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Each refusal but the lockout concerns one field; it points to the message and takes focus.
	// MIN_PASSWORD_LENGTH of the server, which code in the browser cannot import.
	const MIN_LENGTH = 12;
	const marked = (message: string) =>
		form?.error === message ? { 'aria-invalid': true, 'aria-describedby': 'password-error' } : {};

	// Back from linking at the provider: the outcome comes in the address, shown once.
	$effect(() => {
		if (!data.linked) return;
		showToast(m.account_provider_linked({ provider: data.linked }));
		goto(resolve('/account'), { replace: true, reset: false });
	});

	let sheet = $state<HTMLElement>();
	$effect(() => {
		if (form?.error) sheet?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
	});
</script>

<PageHead title={m.account_title()} />

{#if !data.hasPassword}
	{#if data.resetByMail}
		<form
			class="notice no-password"
			method="post"
			action="?/passwordLink"
			use:enhance={submitWithToast({
				success: () => m.password_link_sent({ email: data.email })
			})}
		>
			<p>{m.password_none_reset()}</p>
			<FormError message={form?.linkError} id="link-error" />
			<button>{m.password_none_send_link()}</button>
		</form>
	{:else}
		<p class="notice">{m.password_none_ask_admin()}</p>
	{/if}
{:else}
	<section class="sheet" bind:this={sheet} aria-labelledby="password-title">
		<h2 id="password-title">{m.password_title()}</h2>
		<p class="muted">{m.password_lead()}</p>
		<form
			method="post"
			action="?/password"
			use:enhance={submitWithToast({ reset: true, success: () => m.password_changed() })}
		>
			<FormError message={form?.error} id="password-error" />
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
				{...marked(m.auth_wrong_current_password())}
			/>
			<TextField
				label={m.password_new()}
				name="password"
				type="password"
				required
				minlength={MIN_LENGTH}
				autocomplete="new-password"
				{...marked(m.auth_new_password_too_short({ min: MIN_LENGTH }))}
			/>
			<button class="primary">{m.password_submit()}</button>
		</form>
	</section>
{/if}

{#if data.links.length > 0 || data.linkable.length > 0}
	<section class="sheet" aria-labelledby="providers-title">
		<h2 id="providers-title">{m.account_providers_title()}</h2>
		<p class="muted">{m.account_providers_lead()}</p>
		<FormError message={data.problem} id="providers-error" />
		{#if data.links.length > 0}
			<ul class="links">
				{#each data.links as link (link.issuer)}
					<li>
						<span>
							{link.label}
							{#if !link.configured}<span class="muted">{m.account_provider_unconfigured()}</span
								>{/if}
						</span>
						<ConfirmAction
							action="?/unlink"
							title={m.account_unlink_title({ provider: link.label })}
							consequence={m.account_unlink_consequence({ provider: link.label })}
							danger
							label={m.account_provider_unlink({ provider: link.label })}
							success={m.account_provider_unlinked()}
						>
							<input type="hidden" name="issuer" value={link.issuer} />
						</ConfirmAction>
					</li>
				{/each}
			</ul>
		{/if}
		{#if data.linkable.length > 0}
			{#if data.hasPassword}
				<!-- A plain form: linking continues at the provider, outside this application. -->
				<form method="post" action={resolve('/account/link')}>
					<TextField
						label={m.account_provider_password()}
						name="current"
						type="password"
						required
						autocomplete="current-password"
					/>
					<div class="buttons">
						{#each data.linkable as provider (provider.key)}
							<button name="provider" value={provider.key}
								>{m.account_provider_link({ provider: provider.label })}</button
							>
						{/each}
					</div>
				</form>
			{:else}
				<p class="muted">{m.account_provider_link_needs_password()}</p>
			{/if}
		{/if}
	</section>
{/if}

<style>
	.no-password {
		display: grid;
		justify-items: start;
		gap: var(--s3);
	}
	.no-password p {
		margin: 0;
	}
	.links {
		display: grid;
		gap: var(--s2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.links li {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s2);
		align-items: center;
		justify-content: space-between;
	}

	.buttons {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s2);
	}
</style>
