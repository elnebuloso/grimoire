/** Carries the login at a provider from its start to the provider's answer. */
export const FLOW_COOKIE = '__Host-grimoire_oidc';
// Lax, unlike the session: the provider sends the user back from another site, and a strict
// cookie would not come along on that request.
export const flowCookieOptions = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax',
	secure: true,
	maxAge: 600
} as const;

/** Carries an identity confirmed for linking from the provider's answer to the account. */
export const LINK_COOKIE = '__Host-grimoire_oidc_link';
