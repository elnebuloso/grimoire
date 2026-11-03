import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { INSTANCE_NAME } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import { authMessage } from '#lib/server/admin/auth-messages.js';
import { inviteUser, listInvitations, type InvitationLink } from '#lib/server/admin/invitations.js';
import { mailer } from '#lib/server/mail/index.js';
import { publicOrigin } from '#lib/server/public-origin.js';
import { m } from '#lib/paraglide/messages.js';

export const load: PageServerLoad = () => ({ invitations: listInvitations(database()) });

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
			subject: m.mail_invite_subject({ name: INSTANCE_NAME }),
			text: m.mail_invite_text({ email: link.to, url: mail.link(path), name: INSTANCE_NAME })
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
	}
} satisfies Actions;
