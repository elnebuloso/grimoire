<script lang="ts">
	import { enhance } from '$app/forms';
	import ConfirmAction from '#lib/components/ConfirmAction.svelte';
	import DateTime from '#lib/components/DateTime.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import ShownOnce from '#lib/components/ShownOnce.svelte';
	import TableScroll from '#lib/components/TableScroll.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { submitWithToast } from '#lib/forms.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const isAdmin = (user: { roles: string[] }) => user.roles.includes('admin');

	// A link shown once may come from a row far up or down the page: bring it into view.
	let invitedLink = $state<HTMLElement>();
	$effect(() => invitedLink?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
	let passwordLink = $state<HTMLElement>();
	$effect(() => passwordLink?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));

	// Mailed invitations report in a toast; a link to pass on stays in the page, shown only now.
	const invited = submitWithToast({
		reset: true,
		success: (result) =>
			result.type === 'success' && result.data?.invited && 'sent' in result.data.invited
				? m.invite_sent({ email: String(result.data.invited.email) })
				: undefined
	});
</script>

<PageHead title={m.users_title()} />

<section class="sheet flush" aria-labelledby="users">
	<div class="sheet-head"><h2 id="users">{m.users_title()}</h2></div>
	{#if form?.userError}
		<p class="notice alert" role="alert">{form.userError}</p>
	{/if}
	{#if form?.passwordLink && !('sent' in form.passwordLink)}
		<div class="shown-link" bind:this={passwordLink}>
			<p class="notice warn">
				{form.passwordLink.mailFailed
					? m.password_link_mail_failed({ email: form.passwordLink.email })
					: m.password_link_only({ email: form.passwordLink.email })}
			</p>
			<ShownOnce value={form.passwordLink.link} copyLabel={m.password_link_copy()} />
		</div>
	{/if}
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
										<ConfirmAction
											action="?/unlink"
											title={m.users_unlink_title({ provider: link.label, email: user.email })}
											consequence={m.users_unlink_consequence()}
											danger
											label={m.users_unlink()}
											buttonLabel={m.users_unlink_named({
												provider: link.label,
												email: user.email
											})}
											success={m.users_identity_unlinked({
												provider: link.label,
												email: user.email
											})}
										>
											<input type="hidden" name="id" value={user.id} />
											<input type="hidden" name="issuer" value={link.issuer} />
										</ConfirmAction>
									</li>
								{/each}
							</ul>
						</td>
						<td>
							<div class="actions">
								{#if isAdmin(user)}
									<ConfirmAction
										action="?/demote"
										title={m.users_demote_title({ email: user.email })}
										consequence={m.users_demote_consequence()}
										danger
										label={m.users_demote()}
										buttonLabel={m.users_demote_named({ email: user.email })}
										success={m.users_demoted({ email: user.email })}
									>
										<input type="hidden" name="id" value={user.id} />
									</ConfirmAction>
								{:else}
									<ConfirmAction
										action="?/promote"
										title={m.users_promote_title({ email: user.email })}
										consequence={m.users_promote_consequence()}
										label={m.users_promote()}
										buttonLabel={m.users_promote_named({ email: user.email })}
										success={m.users_promoted({ email: user.email })}
									>
										<input type="hidden" name="id" value={user.id} />
									</ConfirmAction>
								{/if}
								{#if user.id !== data.me}
									<ConfirmAction
										action="?/passwordLink"
										title={m.users_password_link_title({ email: user.email })}
										consequence={m.users_password_link_consequence({ email: user.email })}
										confirmLabel={m.users_password_link_confirm()}
										label={m.users_password_link()}
										buttonLabel={m.users_password_link_named({ email: user.email })}
										success={(result) =>
											result.type === 'success' &&
											result.data?.passwordLink &&
											'sent' in result.data.passwordLink
												? m.password_link_sent({ email: user.email })
												: m.password_link_created({ email: user.email })}
									>
										<input type="hidden" name="id" value={user.id} />
									</ConfirmAction>
									<ConfirmAction
										action="?/delete"
										title={m.users_delete_title({ email: user.email })}
										consequence={m.users_delete_consequence()}
										danger
										label={m.users_delete()}
										buttonLabel={m.users_delete_named({ email: user.email })}
										success={m.users_deleted({ email: user.email })}
									>
										<input type="hidden" name="id" value={user.id} />
									</ConfirmAction>
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
									<ConfirmAction
										action="?/resend"
										title={m.invitations_resend_title({ email: invitation.email })}
										consequence={m.invitations_resend_consequence()}
										label={m.invitations_resend()}
										buttonLabel={m.invitations_resend_named({ email: invitation.email })}
										success={(result) =>
											result.type === 'success' &&
											result.data?.invited &&
											'sent' in result.data.invited
												? m.invite_sent({ email: invitation.email })
												: m.invitations_link_created({ email: invitation.email })}
									>
										<input type="hidden" name="id" value={invitation.id} />
									</ConfirmAction>
									<ConfirmAction
										action="?/withdraw"
										title={m.invitations_withdraw_title({ email: invitation.email })}
										consequence={m.invitations_withdraw_consequence()}
										danger
										label={m.invitations_withdraw()}
										buttonLabel={m.invitations_withdraw_named({ email: invitation.email })}
										success={m.invitations_withdrawn({ email: invitation.email })}
									>
										<input type="hidden" name="id" value={invitation.id} />
									</ConfirmAction>
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
	{#if form?.invited && !('sent' in form.invited)}
		<div class="invited" bind:this={invitedLink}>
			<p class="notice warn">
				{form.invited.mailFailed
					? m.invite_mail_failed({ email: form.invited.email })
					: m.invite_link_only({ email: form.invited.email })}
			</p>
			<ShownOnce value={form.invited.link} copyLabel={m.invite_copy()} />
		</div>
	{/if}
	<form method="post" action="?/invite" use:enhance={invited}>
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
	.invited,
	.shown-link {
		display: grid;
		gap: var(--s3);
	}
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
