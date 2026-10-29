import { m } from '#lib/paraglide/messages.js';
import { MIN_PASSWORD_LENGTH, type AuthProblem } from './auth';

const MESSAGES: Record<AuthProblem, () => string> = {
	'admin-exists': () => m.auth_admin_exists(),
	'wrong-setup-token': () => m.auth_wrong_setup_token(),
	'username-missing': () => m.auth_username_missing(),
	'password-too-short': () => m.auth_password_too_short({ min: MIN_PASSWORD_LENGTH }),
	blocked: () => m.auth_blocked(),
	'wrong-credentials': () => m.auth_wrong_credentials(),
	'wrong-current-password': () => m.auth_wrong_current_password(),
	'new-password-too-short': () => m.auth_new_password_too_short({ min: MIN_PASSWORD_LENGTH })
};

/** The message for the form, in the language of the request. */
export function authMessage(problem: AuthProblem): string {
	return MESSAGES[problem]();
}
