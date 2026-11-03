<script lang="ts">
	import DateTime from '#lib/components/DateTime.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import ShownOnce from '#lib/components/ShownOnce.svelte';
	import TableScroll from '#lib/components/TableScroll.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<PageHead title={m.users_title()} />

{#if form?.invited}
	<section class="sheet">
		{#if 'sent' in form.invited}
			<p class="notice" role="status">{m.invite_sent({ email: form.invited.email })}</p>
		{:else}
			<p class="notice warn" role="status">
				{form.invited.mailFailed
					? m.invite_mail_failed({ email: form.invited.email })
					: m.invite_link_only({ email: form.invited.email })}
			</p>
			<ShownOnce value={form.invited.link} copyLabel={m.invite_copy()} />
		{/if}
	</section>
{/if}

<section class="sheet" aria-labelledby="pending">
	<h2 id="pending">{m.invitations_pending()}</h2>
	{#if data.invitations.length === 0}
		<p class="muted">{m.invitations_none()}</p>
	{:else}
		<TableScroll label={m.invitations_pending()}>
			<table>
				<thead>
					<tr>
						<th scope="col">{m.field_email()}</th>
						<th scope="col">{m.invitations_sent_at()}</th>
					</tr>
				</thead>
				<tbody>
					{#each data.invitations as invitation (invitation.id)}
						<tr>
							<th scope="row">{invitation.email}</th>
							<td><DateTime value={invitation.sentAt} timeZone={data.timeZone} short /></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</TableScroll>
	{/if}
</section>

<section class="sheet new" aria-labelledby="invite">
	<h2 id="invite">{m.invite_heading()}</h2>
	<form method="post" action="?/invite">
		<FormError message={form?.error} id="invite-error" />
		<TextField
			label={m.field_email()}
			name="email"
			type="email"
			required
			autocomplete="off"
			value={form?.email ?? ''}
			{...form?.error ? { 'aria-invalid': true, 'aria-describedby': 'invite-error' } : {}}
		/>
		<button class="primary">{m.invite_button()}</button>
	</form>
</section>

<style>
	.new {
		max-width: 40rem;
	}
</style>
