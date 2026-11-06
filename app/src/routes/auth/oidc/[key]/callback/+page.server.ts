import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { ENCRYPTION_KEY } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import { homeOf, WELCOME_PAGE } from '#lib/server/admin/access.js';
import { clientKey, createAttemptLimit } from '#lib/server/admin/attempt-limit.js';
import { accountExists, type AuthProblem } from '#lib/server/admin/auth.js';
import {
	createSession,
	SESSION_COOKIE,
	sessionCookieOptions,
	sessionUser
} from '#lib/server/admin/auth.js';
import { log } from '#lib/server/log.js';
import { providerByKey } from '#lib/server/oidc/index.js';
import { acceptInvitationWithIdentity } from '#lib/server/admin/invitations.js';
import { FLOW_COOKIE, flowCookieOptions, LINK_COOKIE } from '#lib/server/oidc/cookie.js';
import { decideLogin } from '#lib/server/oidc/decision.js';
import {
	classifyLoginFailure,
	finishFlow,
	openFlow,
	ProviderUnavailable,
	sealLink,
	unavailableMessage
} from '#lib/server/oidc/flow.js';
import { createLinkedUser, linkedUser } from '#lib/server/oidc/identities.js';

// A plain page: it only forwards, and must not run its load a second time in the browser.
export const csr = false;

// Each answer costs a request to the provider; a client sending answers in a loop is stopped. Only
// failures count: many people log in from one office address within minutes.
const answers = createAttemptLimit(30, 15);

/**
 * Takes the provider's answer and logs the user in. The session cookie is strict and therefore not
 * sent on a request that comes from the provider's site; the page forwards from here, a request of
 * this site, so the first page after it already sees the login. A refusal is forwarded the same
 * way: a redirect would arrive without the session of a user who was linking an account.
 */
export const load: PageServerLoad = async ({ params, url, cookies, getClientAddress, locals }) => {
	const provider = providerByKey(params.key);
	if (!provider) error(404);
	const now = new Date();
	const opened = openFlow(cookies.get(FLOW_COOKIE), provider.key, ENCRYPTION_KEY.oidcFlows, now);
	cookies.delete(FLOW_COOKIE, flowCookieOptions);
	// Back or reload after a login: the page stays in the history, its flow is gone.
	if ('problem' in opened && locals.user) redirect(303, homeOf(locals.user));
	const linking = 'flow' in opened ? opened.flow.link : opened.expired?.link;
	const refuse = (problem: AuthProblem) => ({
		next: `${linking ? '/account' : '/login'}?problem=${problem}`
	});
	const client = clientKey(getClientAddress());
	if (!answers.take(client, now)) {
		log.info(`OIDC login through ${provider.key} refused: too many failed logins from the client`);
		return refuse('oidc-blocked');
	}
	if ('problem' in opened) {
		log.info(`OIDC login through ${provider.key} failed: the flow cookie is ${opened.problem}`);
		return refuse('oidc-failed');
	}
	const { flow } = opened;

	let claims: Record<string, unknown>;
	try {
		claims = await finishFlow(provider, url.searchParams, flow, now);
	} catch (failure) {
		if (failure instanceof ProviderUnavailable) {
			log.warn(unavailableMessage(provider.key, failure));
			return refuse('oidc-unavailable');
		}
		const { text, cause } = classifyLoginFailure(failure);
		const message = `OIDC login through ${provider.key} failed: ${text}`;
		if (cause === 'configuration') log.warn(message);
		else log.info(message);
		return refuse('oidc-failed');
	}

	const db = database();
	const decision = decideLogin(
		claims,
		provider,
		{
			linkedUser: (issuer, subject) => linkedUser(db, issuer, subject),
			accountExists: (email) => accountExists(db, email)
		},
		flow
	);
	if (decision.action === 'refuse') {
		log.info(`OIDC login through ${provider.key} refused: ${decision.reason}`);
		return refuse(decision.reason);
	}

	if (decision.action === 'link') {
		// The session cookie does not come along from the provider's site: the identity waits in a
		// cookie of its own for the next request of this site, which carries the session.
		const expiresAt = new Date(now.getTime() + 60_000).toISOString();
		const link = { provider: provider.key, ...decision.identity, session: flow.link!, expiresAt };
		cookies.set(LINK_COOKIE, sealLink(link, ENCRYPTION_KEY.oidcFlows), {
			...flowCookieOptions,
			maxAge: 60
		});
		answers.forget(client);
		return { next: '/account/link' };
	}

	let userId: number;
	let isNewAccount = true;
	if (decision.action === 'login') {
		userId = decision.userId;
		isNewAccount = false;
	} else if (decision.action === 'accept-invitation') {
		const accepted = acceptInvitationWithIdentity(db, flow.invite!, decision.identity, now);
		if ('error' in accepted) {
			log.info(`OIDC invitation through ${provider.key} refused: ${accepted.error}`);
			return refuse(accepted.error);
		}
		log.info(`OIDC provider ${provider.key} accepted an invitation`);
		userId = accepted.userId;
	} else {
		const { issuer, subject } = decision.identity;
		const created = createLinkedUser(db, decision.email, issuer, subject);
		// Taken by a parallel request between the decision and the insert.
		if (created === undefined) return refuse('oidc-email-taken');
		log.info(`OIDC provider ${provider.key} created an account`);
		userId = created;
	}
	const session = createSession(db, userId, now);
	cookies.set(SESSION_COOKIE, session, sessionCookieOptions);
	answers.forget(client);
	const home = isNewAccount ? WELCOME_PAGE : homeOf(sessionUser(db, session, now)!);
	return { next: flow.next || home };
};
