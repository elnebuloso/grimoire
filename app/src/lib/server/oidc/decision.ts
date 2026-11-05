import { looksLikeEmail, normalizeEmail, type AuthProblem } from '../admin/auth.ts';
import type { OidcProvider } from './config.ts';
import type { OidcFlow } from './flow.ts';

/** Why a login through a provider gets no session. */
export type OidcRefusal = Extract<
	AuthProblem,
	'oidc-claims' | 'oidc-email-taken' | 'oidc-no-email' | 'oidc-not-allowed'
>;

/** The user's account at the provider. */
export interface Identity {
	issuer: string;
	subject: string;
}

export type LoginDecision =
	| { action: 'login'; userId: number }
	| { action: 'create'; email: string; identity: Identity }
	| { action: 'link'; identity: Identity }
	| { action: 'accept-invitation'; identity: Identity }
	| { action: 'refuse'; reason: OidcRefusal };

/** What the decision needs to know from the database. */
export interface KnownAccounts {
	/** The user the identity is linked to. */
	linkedUser(issuer: string, subject: string): number | undefined;
	accountExists(email: string): boolean;
}

/**
 * Decides what a validated login through `provider` leads to, for the flow that started it: a
 * link to the account of the session that started it, an invitation's acceptance, or a login. An
 * existing account is reached only through a linked identity, never through the email address the
 * provider reports: linking is left to the account's owner, who proves both sides.
 */
export function decideLogin(
	claims: Record<string, unknown>,
	provider: Pick<OidcProvider, 'allowedDomains' | 'requiredClaims'>,
	accounts: KnownAccounts,
	flow: Pick<OidcFlow, 'link' | 'invite'> = {}
): LoginDecision {
	if (!hasRequiredClaims(claims, provider.requiredClaims)) {
		return { action: 'refuse', reason: 'oidc-claims' };
	}
	const identity = { issuer: String(claims.iss), subject: String(claims.sub) };
	if (flow.link) return { action: 'link', identity };
	if (flow.invite) return { action: 'accept-invitation', identity };
	const linked = accounts.linkedUser(identity.issuer, identity.subject);
	if (linked !== undefined) return { action: 'login', userId: linked };
	const email = typeof claims.email === 'string' ? normalizeEmail(claims.email) : '';
	if (!looksLikeEmail(email)) return { action: 'refuse', reason: 'oidc-no-email' };
	// Checked before the account exists: otherwise an unverified address would tell anyone whether
	// it has an account here.
	if (!emailVerified(claims) || !domainAllowed(email, provider.allowedDomains)) {
		return { action: 'refuse', reason: 'oidc-not-allowed' };
	}
	if (accounts.accountExists(email)) return { action: 'refuse', reason: 'oidc-email-taken' };
	return { action: 'create', email, identity };
}

/** Whether every required claim is there with its value; only plain values can match. */
function hasRequiredClaims(
	claims: Record<string, unknown>,
	required: [name: string, value: string][]
): boolean {
	return required.every(([name, value]) => {
		const claim = claims[name];
		const plain = ['string', 'number', 'boolean'].includes(typeof claim);
		return plain && String(claim) === value;
	});
}

// Providers send the flag as a boolean or as the text "true". Entra has no `email_verified`; its
// `xms_edov` says whether the owner of the address's domain was verified.
function emailVerified(claims: Record<string, unknown>): boolean {
	return [claims.email_verified, claims.xms_edov].some((flag) => flag === true || flag === 'true');
}

function domainAllowed(email: string, allowed: string[] | '*'): boolean {
	return allowed === '*' || allowed.includes(email.slice(email.lastIndexOf('@') + 1));
}
