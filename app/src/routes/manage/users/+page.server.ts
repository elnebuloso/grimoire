import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { INSTANCE_TITLE } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import { authMessage } from '#lib/server/admin/auth-messages.js';
import {
	inviteUser,
	listInvitations,
	resendInvitation,
	revokeInvitation,
	type InvitationLink
} from '#lib/server/admin/invitations.js';
import { deleteUser, listUsers, setAdmin, type UserRefusal } from '#lib/server/admin/users.js';
import { mailer } from '#lib/server/mail/index.js';
import { describeLinks } from '#lib/server/oidc/index.js';
import { removeIdentity } from '#lib/server/oidc/identities.js';
import { publicOrigin } from '#lib/server/public-origin.js';
import { m } from '#lib/paraglide/messages.js';

export const load: PageServerLoad = ({ locals }) => {
	const db = database();
	return {
		users: listUsers(db).map(({ issuers, ...user }) => ({
			...user,
			links: describeLinks(issuers)
		})),
		invitations: listInvitations(db),
		// The own account offers no delete: an admin cannot delete themselves.
		me: locals.user!.id,
		now: new Date().toISOString()
	};
};

const REFUSALS: Record<Exclude<UserRefusal['error'], 'unknown-user'>, () => string> = {
	'last-admin': m.users_error_last_admin,
	self: m.users_error_self
};

/** The answer to a refused change of a user; a user deleted in another window is a 404. */
function refused(refusal: UserRefusal) {
	if (refusal.error === 'unknown-user') error(404);
	return fail(400, { userError: REFUSALS[refusal.error]() });
}

async function idOf(request: Request): Promise<number> {
	return Number((await request.formData()).get('id'));
}

/**
 * Mails the link of an invitation. Without a mail server, or when it refuses the mail, the admin
 * gets the link to pass on themselves: this answer is the only place it is ever shown.
 */
async function deliver(link: InvitationLink, url: URL) {
	const mail = mailer();
	const path = `/invite/${link.token}`;
	if (mail) {
		const sent = await mail.send({
			to: link.to,
			subject: m.mail_invite_subject({ name: INSTANCE_TITLE }),
			text: m.mail_invite_text({ email: link.to, url: mail.link(path), name: INSTANCE_TITLE })
		});
		if (sent) return { email: link.to, sent: true as const };
		return { email: link.to, link: mail.link(path), mailFailed: true };
	}
	return { email: link.to, link: `${publicOrigin(url)}${path}` };
}

export const actions = {
	invite: async ({ request, locals, url }) => {
		const email = String((await request.formData()).get('email') ?? '');
		const invited = inviteUser(database(), email, locals.user!.id);
		if ('error' in invited) return fail(400, { error: authMessage(invited.error), email });
		return { invited: await deliver(invited, url) };
	},
	resend: async ({ request, url }) => {
		const resent = resendInvitation(database(), await idOf(request));
		// Accepted or withdrawn in another window: the list no longer shows it.
		if (!resent) error(404);
		return { invited: await deliver(resent, url) };
	},
	withdraw: async ({ request }) => {
		revokeInvitation(database(), await idOf(request));
	},
	promote: async ({ request }) => {
		const problem = setAdmin(database(), await idOf(request), true);
		if (problem) return refused(problem);
	},
	demote: async ({ request }) => {
		const problem = setAdmin(database(), await idOf(request), false);
		if (problem) return refused(problem);
	},
	unlink: async ({ request }) => {
		const data = await request.formData();
		removeIdentity(database(), Number(data.get('id')), String(data.get('issuer') ?? ''));
	},
	delete: async ({ request, locals }) => {
		const problem = deleteUser(database(), await idOf(request), locals.user!.id);
		if (problem) return refused(problem);
	}
} satisfies Actions;
