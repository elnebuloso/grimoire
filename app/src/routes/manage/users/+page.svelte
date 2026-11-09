<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import ActionMenu from '#lib/components/ActionMenu.svelte';
	import ConfirmAction from '#lib/components/ConfirmAction.svelte';
	import DateTime from '#lib/components/DateTime.svelte';
	import Dialog from '#lib/components/Dialog.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import ShownOnce from '#lib/components/ShownOnce.svelte';
	import DataTable from '#lib/components/DataTable.svelte';
	import TabNav from '#lib/components/TabNav.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { markRefusal, submitWithToast, type Refusal } from '#lib/forms.js';
	import { m } from '#lib/paraglide/messages.js';
	import { wholeList } from '#lib/list.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const isAdmin = (user: { roles: string[] }) => user.roles.includes('admin');
	const users = resolve('/manage/users');

	// A link shown once may come from a row far up or down the page: bring it into view.
	let shownLink = $state<HTMLElement>();
	$effect(() => shownLink?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));

	type Invited =
		{ email: string; sent: true } | { email: string; link: string; mailFailed?: boolean };

	// Each opening starts a fresh form.
	let opened = $state(0);
	let inviting = $state(false);
	let inviteRefusal = $state<Refusal>();
	let inviteEmail = $state('');
	let invited = $state<Exclude<Invited, { sent: true }>>();

	function openInvite() {
		inviteRefusal = undefined;
		inviteEmail = '';
		invited = undefined;
		opened++;
		inviting = true;
	}

	// Mailed, the invitation reports in a toast and the dialog closes; a link to pass on stays in
	// the dialog, shown only now.
	const invite = submitWithToast({
		success: (result) =>
			result.type === 'success' && result.data?.invited && 'sent' in result.data.invited
				? m.invite_sent({ email: String(result.data.invited.email) })
				: undefined,
		onfailure: (answer) => {
			inviteRefusal = answer;
			inviteEmail = (answer?.email as string | undefined) ?? inviteEmail;
		},
		onsuccess: (result) => {
			if (result.type !== 'success') return;
			const answer = result.data?.invited as Invited | undefined;
			if (!answer || 'sent' in answer) inviting = false;
			else invited = answer;
		}
	});
</script>

<PageHead title={m.users_title()} />

<div class="bar">
	<TabNav
		label={m.users_tabs()}
		tabs={[
			{ href: users, label: m.users_title(), current: data.tab === 'users' },
			{
				href: `${users}?tab=invitations`,
				label: m.users_tab_invitations({ count: data.invitations.length }),
				current: data.tab === 'invitations'
			}
		]}
	/>
	<button type="button" class="primary" aria-haspopup="dialog" onclick={openInvite}
		>{m.invite_open()}</button
	>
</div>

{#if data.tab === 'users'}
	<section class="sheet flush" aria-labelledby="users">
		<div class="sheet-head"><h2 id="users">{m.users_title()}</h2></div>
		{#if form?.passwordLink && !('sent' in form.passwordLink)}
			<div class="shown-link" bind:this={shownLink}>
				<p class="notice warn">
					{form.passwordLink.mailFailed
						? m.password_link_mail_failed({ email: form.passwordLink.email })
						: m.password_link_only({ email: form.passwordLink.email })}
				</p>
				<ShownOnce value={form.passwordLink.link} copyLabel={m.password_link_copy()} />
			</div>
		{/if}
		<DataTable
			label={m.users_title()}
			list={data.users}
			key={(user) => user.id}
			search={m.users_search()}
			filters={[
				{
					name: 'role',
					label: m.users_role(),
					options: [
						{ value: 'admin', label: m.users_role_admin() },
						{ value: 'user', label: m.users_role_user() }
					]
				}
			]}
			columns={[
				{ label: m.field_email(), sort: 'email' },
				{ label: m.users_role() },
				{ label: m.users_sign_in() },
				{ label: m.users_keys(), numeric: true },
				{ label: m.users_actions() }
			]}
		>
			{#snippet row(user)}
				{@const onlyLogin = !user.hasPassword && user.links.length === 1}
				<th scope="row">{user.email}</th>
				<td>{isAdmin(user) ? m.users_role_admin() : m.users_role_user()}</td>
				<td>
					<ul class="sign-in">
						{#if user.hasPassword}<li>{m.users_sign_in_password()}</li>{/if}
						{#each user.links as link (link.issuer)}
							<li>
								{link.label}
								{#if !link.configured}<span class="muted">{m.account_provider_unconfigured()}</span
									>{/if}
								<ConfirmAction
									action="?/unlink"
									title={m.users_unlink_title({ provider: link.label, email: user.email })}
									consequence={onlyLogin
										? m.users_unlink_consequence_last()
										: m.users_unlink_consequence()}
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
				<td class="num">
					<a
						href="{resolve('/manage/api-keys')}?owner={encodeURIComponent(user.email)}"
						aria-label={m.users_keys_count({ count: user.keys, email: user.email })}>{user.keys}</a
					>
				</td>
				<td class="action">
					<ActionMenu label={m.users_actions_named({ email: user.email })}>
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
								password
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
								password={isAdmin(user)}
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
					</ActionMenu>
				</td>
			{/snippet}
			{#snippet empty()}<p class="muted">{m.list_no_match()}</p>{/snippet}
		</DataTable>
	</section>
{:else}
	<section class="sheet flush" aria-labelledby="pending">
		<div class="sheet-head"><h2 id="pending">{m.invitations_pending()}</h2></div>
		{#if form?.resent && !('sent' in form.invited)}
			<div class="shown-link" bind:this={shownLink}>
				<p class="notice warn">
					{form.invited.mailFailed
						? m.invite_mail_failed({ email: form.invited.email })
						: m.invite_link_only({ email: form.invited.email })}
				</p>
				<ShownOnce value={form.invited.link} copyLabel={m.invite_copy()} />
			</div>
		{/if}
		<DataTable
			label={m.invitations_pending()}
			list={wholeList(data.invitations)}
			key={(invitation) => invitation.id}
			columns={[
				{ label: m.field_email() },
				{ label: m.invitations_sent_at() },
				{ label: m.users_actions() }
			]}
		>
			{#snippet row(invitation)}
				<th scope="row">{invitation.email}</th>
				<td>
					<DateTime value={invitation.sentAt} timeZone={data.timeZone} short />
					{#if invitation.expiresAt <= data.now}<span class="expired"
							>{m.invitations_expired()}</span
						>{/if}
				</td>
				<td>
					<div class="actions">
						{#if data.mailConfigured}
							<ConfirmAction
								action="?/resend"
								title={m.invitations_resend_title({ email: invitation.email })}
								consequence={m.invitations_resend_consequence()}
								label={m.invitations_resend()}
								buttonLabel={m.invitations_resend_named({ email: invitation.email })}
								success={(result) =>
									result.type === 'success' && result.data?.invited && 'sent' in result.data.invited
										? m.invite_sent({ email: invitation.email })
										: m.invitations_link_created({ email: invitation.email })}
							>
								<input type="hidden" name="id" value={invitation.id} />
							</ConfirmAction>
						{:else}
							<ConfirmAction
								action="?/resend"
								title={m.invitations_new_link_title({ email: invitation.email })}
								consequence={m.invitations_new_link_consequence()}
								label={m.invitations_new_link()}
								buttonLabel={m.invitations_new_link_named({ email: invitation.email })}
								success={m.invitations_link_created({ email: invitation.email })}
							>
								<input type="hidden" name="id" value={invitation.id} />
							</ConfirmAction>
						{/if}
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
			{/snippet}
			{#snippet empty()}<p class="muted">{m.invitations_none()}</p>{/snippet}
		</DataTable>
	</section>
{/if}

<Dialog bind:open={inviting} title={m.invite_heading()}>
	{#if invited}
		<p class="notice warn" role="status">
			{invited.mailFailed
				? m.invite_mail_failed({ email: invited.email })
				: m.invite_link_only({ email: invited.email })}
		</p>
		<ShownOnce value={invited.link} copyLabel={m.invite_copy()} />
	{:else}
		{#key opened}
			<form id="invite-user" method="post" action="?/invite" use:enhance={invite}>
				<FormError message={inviteRefusal?.error} id="invite-error" />
				<TextField
					label={m.field_email()}
					name="email"
					type="email"
					required
					autocomplete="off"
					value={inviteEmail}
					{...markRefusal(inviteRefusal, 'email', 'invite-error')}
				/>
			</form>
		{/key}
	{/if}
	{#snippet actions()}
		{#if invited}
			<button type="button" class="primary" onclick={() => (inviting = false)}
				>{m.dialog_done()}</button
			>
		{:else}
			<button type="button" onclick={() => (inviting = false)}>{m.dialog_cancel()}</button>
			<button class="primary" form="invite-user">{m.invite_button()}</button>
		{/if}
	{/snippet}
</Dialog>

<style>
	.bar {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: var(--s3);
		margin-bottom: var(--s4);
	}
	.shown-link {
		display: grid;
		gap: var(--s3);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
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
	.action {
		width: 1%;
	}
</style>
