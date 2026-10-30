import { randomBytes } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { inTransaction } from '../db/transaction.ts';
import {
	hashPassword,
	MIN_PASSWORD_LENGTH,
	normalizeEmail,
	sha256,
	type AuthProblem
} from './auth.ts';
import { createAttemptLimit } from './attempt-limit.ts';

const LINK_MINUTES = 60;
// Enough for a typo and a second try; more from one client or for one address floods a mailbox.
const MAX_REQUESTS_PER_CLIENT = 5;
const MAX_REQUESTS_PER_ADDRESS = 3;
const REQUEST_WINDOW_MINUTES = 60;

const clientRequests = createAttemptLimit(MAX_REQUESTS_PER_CLIENT, REQUEST_WINDOW_MINUTES);
const addressRequests = createAttemptLimit(MAX_REQUESTS_PER_ADDRESS, REQUEST_WINDOW_MINUTES);

/**
 * Starts a reset for the user with `email`: returns the token for the link to send, undefined
 * when there is nothing to send (unknown address, or too many requests for it), so the answer
 * does not tell whether the address has an account. The error `reset-blocked` when `client` asked
 * too often.
 */
export function requestPasswordReset(
	db: DatabaseSync,
	client: string,
	email: string,
	now = new Date()
): { to: string; token: string } | { error: 'reset-blocked' } | undefined {
	if (!clientRequests.take(client, now)) return { error: 'reset-blocked' };
	const address = normalizeEmail(email);
	const user = db.prepare('SELECT id FROM users WHERE email = ?').get(address) as
		{ id: number } | undefined;
	if (!user || !addressRequests.take(address, now)) return undefined;
	db.prepare('DELETE FROM password_resets WHERE expires_at <= ?').run(now.toISOString());
	const token = randomBytes(32).toString('base64url');
	const expiresAt = new Date(now.getTime() + LINK_MINUTES * 60_000).toISOString();
	db.prepare('INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(
		sha256(token),
		user.id,
		expiresAt
	);
	return { to: address, token };
}

/** Whether `token` still sets a password: issued, not used and not expired. */
export function resetLinkValid(db: DatabaseSync, token: string, now = new Date()): boolean {
	return (
		db
			.prepare('SELECT 1 FROM password_resets WHERE token_hash = ? AND expires_at > ?')
			.get(sha256(token), now.toISOString()) !== undefined
	);
}

/**
 * Sets the password of the user `token` was issued for, ends all their sessions and voids their
 * other reset links. Returns why when nothing was changed.
 */
export async function resetPassword(
	db: DatabaseSync,
	token: string,
	password: string,
	now = new Date()
): Promise<{ error: AuthProblem } | undefined> {
	if (!resetLinkValid(db, token, now)) return { error: 'reset-link-invalid' };
	if (password.length < MIN_PASSWORD_LENGTH) return { error: 'password-too-short' };
	// Hashed before the transaction: other requests share the connection while it is awaited.
	const passwordHash = await hashPassword(password);
	return inTransaction(db, () => {
		// Taken inside the transaction, so two requests with the same link cannot both use it.
		const used = db
			.prepare(
				'DELETE FROM password_resets WHERE token_hash = ? AND expires_at > ? RETURNING user_id'
			)
			.get(sha256(token), now.toISOString()) as { user_id: number } | undefined;
		if (!used) return { error: 'reset-link-invalid' };
		db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, used.user_id);
		db.prepare('DELETE FROM sessions WHERE user_id = ?').run(used.user_id);
		db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(used.user_id);
		return undefined;
	});
}
