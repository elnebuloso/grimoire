import { randomBytes } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { inTransaction } from '../db/transaction.ts';
import { insertLinkedUser, linkedUser } from '../oidc/identities.ts';
import {
	accountExists,
	hashPassword,
	insertUser,
	looksLikeEmail,
	MIN_PASSWORD_LENGTH,
	normalizeEmail,
	type AuthProblem
} from './auth.ts';
import { sha256 } from '../sha256.ts';

// Long enough to reach someone back from a week away; anyone holding the mail can use the link,
// so it does not stay valid for good.
const LINK_DAYS = 7;

export interface Invitation {
	id: number;
	email: string;
	/** When the current link was sent. */
	sentAt: string;
	expiresAt: string;
}

/** Where the link of an invitation goes, and the token it carries; shown or sent only once. */
export interface InvitationLink {
	to: string;
	token: string;
}

function newLink(now: Date) {
	const token = randomBytes(32).toString('base64url');
	return {
		token,
		hash: sha256(token),
		sentAt: now.toISOString(),
		expiresAt: new Date(now.getTime() + LINK_DAYS * 86_400_000).toISOString()
	};
}

/**
 * Invites `email` on behalf of `invitedBy`. Refused for an address that is not one, that already
 * has an account, or that has an invitation waiting: that one is sent again instead.
 */
export function inviteUser(
	db: DatabaseSync,
	email: string,
	invitedBy: number,
	now = new Date()
): InvitationLink | { error: AuthProblem } {
	const address = normalizeEmail(email);
	if (!looksLikeEmail(address)) return { error: 'email-invalid' };
	return inTransaction(db, () => {
		if (accountExists(db, address)) {
			return { error: 'account-exists' as const };
		}
		if (db.prepare('SELECT 1 FROM invitations WHERE email = ?').get(address)) {
			return { error: 'invitation-exists' as const };
		}
		const link = newLink(now);
		db.prepare(
			`INSERT INTO invitations (email, token_hash, invited_by, sent_at, expires_at)
			VALUES (?, ?, ?, ?, ?)`
		).run(address, link.hash, invitedBy, link.sentAt, link.expiresAt);
		return { to: address, token: link.token };
	});
}

/** Replaces the link of an invitation, which voids the one sent before; undefined when it is gone. */
export function resendInvitation(
	db: DatabaseSync,
	id: number,
	now = new Date()
): InvitationLink | undefined {
	const link = newLink(now);
	const row = db
		.prepare(
			'UPDATE invitations SET token_hash = ?, sent_at = ?, expires_at = ? WHERE id = ? RETURNING email'
		)
		.get(link.hash, link.sentAt, link.expiresAt, id) as { email: string } | undefined;
	return row && { to: row.email, token: link.token };
}

export function revokeInvitation(db: DatabaseSync, id: number): boolean {
	return db.prepare('DELETE FROM invitations WHERE id = ?').run(id).changes > 0;
}

/** The invitations nobody accepted yet, expired ones included, the latest sent first. */
export function listInvitations(db: DatabaseSync): Invitation[] {
	return db
		.prepare(
			`SELECT id, email, sent_at AS sentAt, expires_at AS expiresAt FROM invitations
			ORDER BY sent_at DESC, id DESC`
		)
		.all() as unknown as Invitation[];
}

/** The address a link still invites: issued, not replaced, revoked, used or expired. */
export function invitedEmail(
	db: DatabaseSync,
	token: string,
	now = new Date()
): string | undefined {
	const row = db
		.prepare('SELECT email FROM invitations WHERE token_hash = ? AND expires_at > ?')
		.get(sha256(token), now.toISOString()) as { email: string } | undefined;
	return row?.email;
}

/**
 * Creates the account the link invites to, without roles, with `password`, and uses up the link.
 * Returns the address, or why nothing was created.
 */
export async function acceptInvitation(
	db: DatabaseSync,
	token: string,
	password: string,
	now = new Date()
): Promise<{ userId: number } | { error: AuthProblem }> {
	if (!invitedEmail(db, token, now)) return { error: 'invite-link-invalid' };
	if (password.length < MIN_PASSWORD_LENGTH) return { error: 'password-too-short' };
	// Hashed before the transaction: other requests share the connection while it is awaited.
	const passwordHash = await hashPassword(password);
	return inTransaction(db, () => {
		// Taken inside the transaction, so two submits of the same link create one account.
		const used = db
			.prepare('DELETE FROM invitations WHERE token_hash = ? AND expires_at > ? RETURNING email')
			.get(sha256(token), now.toISOString()) as { email: string } | undefined;
		if (!used) return { error: 'invite-link-invalid' as const };
		if (accountExists(db, used.email)) return { error: 'account-exists' as const };
		return { userId: insertUser(db, used.email, passwordHash, []) };
	});
}

/**
 * Creates the account the link invites to, without roles and password, linked to the identity a
 * provider confirmed, and uses up the link. Holding the link proves the invitation; the invited
 * address is kept, whatever the provider reports.
 */
export function acceptInvitationWithIdentity(
	db: DatabaseSync,
	token: string,
	identity: { issuer: string; subject: string },
	now = new Date()
): { userId: number } | { error: AuthProblem } {
	return inTransaction(db, () => {
		if (linkedUser(db, identity.issuer, identity.subject) !== undefined) {
			return { error: 'oidc-identity-taken' as const };
		}
		const used = db
			.prepare('DELETE FROM invitations WHERE token_hash = ? AND expires_at > ? RETURNING email')
			.get(sha256(token), now.toISOString()) as { email: string } | undefined;
		if (!used) return { error: 'invite-link-invalid' as const };
		if (accountExists(db, used.email)) return { error: 'account-exists' as const };
		return { userId: insertLinkedUser(db, used.email, identity.issuer, identity.subject) };
	});
}
