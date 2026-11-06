import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { INSTANCE_TITLE } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import { authMessage } from '#lib/server/auth/auth-messages.js';
import { SESSION_COOKIE } from '#lib/server/auth/auth.js';
import {
	inviteUser,
	listInvitations,
	resendInvitation,
	revokeInvitation,
	type InvitationLink
} from '#lib/server/admin/invitations.js';
import { deleteUser, listUsers, setAdmin, type UserRefusal } from '#lib/server/admin/users.js';
import { mailer } from '#lib/server/mail/index.js';
import { createPasswordLink } from '#lib/server/auth/password-reset.js';
import { log } from '#lib/server/log.js';
import { describeLinks } from '#lib/server/oidc/index.js';
import { removeIdentity } from '#lib/server/oidc/identities.js';
import { publicOrigin } from '#lib/server/public-origin.js';
import { m } from '#lib/paraglide/messages.js';
import { listPage, readListParams, type ListSpec } from '#lib/list.js';

const USER_LIST: ListSpec<{ email: string; roles: string[] }> = {
	search: (user) => user.email,
	filters: { role: (user) => (user.roles.includes('admin') ? 'admin' : 'user') },
	sorts: { email: (user) => user.email }
};

export const load: PageServerLoad = ({ locals, url }) => {
	const db = database();
	const users = listUsers(db).map(({ issuers, ...user }) => ({
		...user,
		links: describeLinks(issuers)
	}));
	return {
		users: listPage(users, readListParams(url, USER_LIST), USER_LIST),
		invitations: listInvitations(db),
		// The own account offers no delete: an admin cannot delete themselves.
		tab: url.searchParams.get('tab') === 'invitations' ? 'invitations' : 'users',
		me: locals.user!.id,
		now: new Date().toISOString(),
		// Only whether there is one: the page names its actions after it.
		mailConfigured: mailer() !== undefined
	};
};

const REFUSALS: Record<Exclude<UserRefusal['error'], 'unknown-user'>, () => string> = {
	'last-admin': m.users_error_last_admin,
	self: m.users_error_self
};

/** The answer to a refused change of a user; a user deleted in another window is a 404. */
function refused(refusal: UserRefusal) {
	if (refusal.error === 'unknown-user') error(404);
	return fail(400, { error: REFUSALS[refusal.error]() });
}

async function idOf(request: Request): Promise<number> {
	return Number((await request.formData()).get('id'));
}

/**
 * Mails a link to `to`. Without a mail server, or when it refuses the mail, the admin gets the
 * link to pass on themselves: this answer is the only place it is ever shown.
 */
async function deliver(
	to: string,
	path: string,
	url: URL,
	mailText: (link: string) => { subject: string; text: string }
) {
	const mail = mailer();
	if (mail) {
		const sent = await mail.send({ to, ...mailText(mail.link(path)) });
		if (sent) return { email: to, sent: true as const };
		return { email: to, link: mail.link(path), mailFailed: true };
	}
	return { email: to, link: `${publicOrigin(url)}${path}` };
}

/** Mails the link of an invitation, or hands it to the admin. */
function deliverInvitation(link: InvitationLink, url: URL) {
	return deliver(link.to, `/invite/${link.token}`, url, (address) => ({
		subject: m.mail_invite_subject({ name: INSTANCE_TITLE }),
		text: m.mail_invite_text({ email: link.to, url: address, name: INSTANCE_TITLE })
	}));
}

export const actions = {
	invite: async ({ request, locals, url }) => {
		const email = String((await request.formData()).get('email') ?? '');
		const invited = inviteUser(database(), email, locals.user!.id);
		if ('error' in invited) {
			return fail(400, { error: authMessage(invited.error), field: 'email', email });
		}
		return { invited: await deliverInvitation(invited, url) };
	},
	resend: async ({ request, url }) => {
		const resent = resendInvitation(database(), await idOf(request));
		// Accepted or withdrawn in another window: the list no longer shows it.
		if (!resent) error(404);
		// Told apart from a new invitation: its link shows on the list, not in the invite dialog.
		return { invited: await deliverInvitation(resent, url), resent: true };
	},
	withdraw: async ({ request }) => {
		// Accepted or withdrawn in another window.
		if (!revokeInvitation(database(), await idOf(request))) error(404);
	},
	promote: async ({ request }) => {
		const problem = setAdmin(database(), await idOf(request), true);
		if (problem) return refused(problem);
	},
	demote: async ({ request }) => {
		const problem = setAdmin(database(), await idOf(request), false);
		if (problem) return refused(problem);
	},
	unlink: async ({ request, cookies }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const issuer = String(data.get('issuer') ?? '');
		if (!removeIdentity(database(), id, issuer, cookies.get(SESSION_COOKIE))) error(404);
	},
	passwordLink: async ({ request, locals, url }) => {
		const id = await idOf(request);
		const link = createPasswordLink(database(), id);
		if (!link) error(404);
		log.info(`password link for user ${id} created by user ${locals.user!.id}`);
		const passwordLink = await deliver(link.to, `/login/reset/${link.token}`, url, (address) => ({
			subject: m.mail_password_link_subject({ name: INSTANCE_TITLE }),
			text: m.mail_password_link_text({ email: link.to, url: address, name: INSTANCE_TITLE })
		}));
		return { passwordLink };
	},
	delete: async ({ request, locals }) => {
		const problem = deleteUser(database(), await idOf(request), locals.user!.id);
		if (problem) return refused(problem);
	}
} satisfies Actions;
