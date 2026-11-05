<script lang="ts">
	import ConfirmForm from '#lib/components/ConfirmForm.svelte';
	import DateTime from '#lib/components/DateTime.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import ShownOnce from '#lib/components/ShownOnce.svelte';
	import TableScroll from '#lib/components/TableScroll.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const isAdmin = (user: { roles: string[] }) => user.roles.includes('admin');
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

{#if form?.userError}
	<p class="notice alert" role="alert">{form.userError}</p>
{/if}

<section class="sheet flush" aria-labelledby="users">
	<div class="sheet-head"><h2 id="users">{m.users_title()}</h2></div>
	<TableScroll label={m.users_title()}>
		<table>
			<thead>
				<tr>
					<th scope="col">{m.field_email()}</th>
					<th scope="col">{m.users_role()}</th>
					<th scope="col">{m.users_sign_in()}</th>
					<th scope="col">{m.users_actions()}</th>
				</tr>
			</thead>
			<tbody>
				{#each data.users as user (user.id)}
					<tr>
						<th scope="row">{user.email}</th>
						<td>{isAdmin(user) ? m.users_role_admin() : m.users_role_user()}</td>
						<td>
							<ul class="sign-in">
								{#if user.hasPassword}<li>{m.users_sign_in_password()}</li>{/if}
								{#each user.links as link (link.issuer)}
									<li>
										{link.label}
										{#if !link.configured}<span class="muted"
												>{m.account_provider_unconfigured()}</span
											>{/if}
										<ConfirmForm
											action="?/unlink"
											question={m.users_unlink_question({
												provider: link.label,
												email: user.email
											})}
											label={m.users_unlink()}
											buttonLabel={m.users_unlink_named({
												provider: link.label,
												email: user.email
											})}
										>
											<input type="hidden" name="id" value={user.id} />
											<input type="hidden" name="issuer" value={link.issuer} />
										</ConfirmForm>
									</li>
								{/each}
							</ul>
						</td>
						<td>
							<div class="actions">
								{#if isAdmin(user)}
									<ConfirmForm
										action="?/demote"
										question={m.users_demote_question({ email: user.email })}
										label={m.users_demote()}
										buttonLabel={m.users_demote_named({ email: user.email })}
									>
										<input type="hidden" name="id" value={user.id} />
									</ConfirmForm>
								{:else}
									<form method="post" action="?/promote">
										<input type="hidden" name="id" value={user.id} />
										<button aria-label={m.users_promote_named({ email: user.email })}
											>{m.users_promote()}</button
										>
									</form>
								{/if}
								{#if user.id !== data.me}
									<ConfirmForm
										action="?/delete"
										question={m.users_delete_question({ email: user.email })}
										label={m.users_delete()}
										buttonLabel={m.users_delete_named({ email: user.email })}
									>
										<input type="hidden" name="id" value={user.id} />
									</ConfirmForm>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</TableScroll>
</section>

<section class="sheet flush" aria-labelledby="pending">
	<div class="sheet-head"><h2 id="pending">{m.invitations_pending()}</h2></div>
	{#if data.invitations.length === 0}
		<p class="muted">{m.invitations_none()}</p>
	{:else}
		<TableScroll label={m.invitations_pending()}>
			<table>
				<thead>
					<tr>
						<th scope="col">{m.field_email()}</th>
						<th scope="col">{m.invitations_sent_at()}</th>
						<th scope="col">{m.users_actions()}</th>
					</tr>
				</thead>
				<tbody>
					{#each data.invitations as invitation (invitation.id)}
						<tr>
							<th scope="row">{invitation.email}</th>
							<td>
								<DateTime value={invitation.sentAt} timeZone={data.timeZone} short />
								{#if invitation.expiresAt <= data.now}<span class="expired"
										>{m.invitations_expired()}</span
									>{/if}
							</td>
							<td>
								<div class="actions">
									<form method="post" action="?/resend">
										<input type="hidden" name="id" value={invitation.id} />
										<button aria-label={m.invitations_resend_named({ email: invitation.email })}
											>{m.invitations_resend()}</button
										>
									</form>
									<ConfirmForm
										action="?/withdraw"
										question={m.invitations_withdraw_question({ email: invitation.email })}
										label={m.invitations_withdraw()}
										buttonLabel={m.invitations_withdraw_named({ email: invitation.email })}
									>
										<input type="hidden" name="id" value={invitation.id} />
									</ConfirmForm>
								</div>
							</td>
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
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s2);
	}
	.sign-in {
		display: grid;
		gap: var(--s1);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.sign-in li {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s2);
		align-items: center;
	}
	.expired {
		margin-inline-start: var(--s2);
		color: var(--err);
		font-weight: 500;
	}
	.new {
		max-width: 40rem;
	}
</style>
