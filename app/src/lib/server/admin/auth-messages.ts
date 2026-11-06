import { m } from '#lib/paraglide/messages.js';
import { MIN_PASSWORD_LENGTH, type AuthProblem } from './auth';

const MESSAGES: Record<AuthProblem, () => string> = {
	'admin-exists': () => m.auth_admin_exists(),
	'wrong-setup-token': () => m.auth_wrong_setup_token(),
	'email-invalid': () => m.auth_email_invalid(),
	'password-too-short': () => m.auth_password_too_short({ min: MIN_PASSWORD_LENGTH }),
	blocked: () => m.auth_blocked(),
	'wrong-credentials': () => m.auth_wrong_credentials(),
	'wrong-current-password': () => m.auth_wrong_current_password(),
	'new-password-too-short': () => m.auth_new_password_too_short({ min: MIN_PASSWORD_LENGTH }),
	'reset-blocked': () => m.auth_reset_blocked(),
	'reset-link-invalid': () => m.auth_reset_link_invalid(),
	'invite-link-invalid': () => m.auth_invite_link_invalid(),
	'account-exists': () => m.auth_account_exists(),
	'invitation-exists': () => m.auth_invitation_exists(),
	'oidc-claims': () => m.auth_oidc_claims(),
	'oidc-email-taken': () => m.auth_oidc_email_taken(),
	'oidc-no-email': () => m.auth_oidc_no_email(),
	'oidc-not-allowed': () => m.auth_oidc_not_allowed(),
	'oidc-unavailable': () => m.auth_oidc_unavailable(),
	'oidc-misconfigured': () => m.auth_oidc_misconfigured(),
	'oidc-failed': () => m.auth_oidc_failed(),
	'oidc-identity-taken': () => m.auth_oidc_identity_taken(),
	'oidc-blocked': () => m.auth_oidc_blocked(),
	'last-sign-in': () => m.auth_last_sign_in()
};

/** Whether `code`, such as one from a query parameter, names a refusal. */
export function isAuthProblem(code: string | null): code is AuthProblem {
	return code !== null && Object.hasOwn(MESSAGES, code);
}

/** The message for the form, in the language of the request. */
export function authMessage(problem: AuthProblem): string {
	return MESSAGES[problem]();
}
