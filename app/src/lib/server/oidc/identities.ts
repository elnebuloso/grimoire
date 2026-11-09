import type { DatabaseSync } from 'node:sqlite';
import { inTransaction } from '../db/transaction.ts';
import {
	accountExists,
	endSessions,
	hasPassword,
	insertUser,
	normalizeEmail
} from '../auth/auth.ts';

/** The user `subject` at `issuer` is linked to; undefined for none. */
export function linkedUser(db: DatabaseSync, issuer: string, subject: string): number | undefined {
	const row = db
		.prepare('SELECT user_id FROM user_identities WHERE issuer = ? AND subject = ?')
		.get(issuer, subject) as { user_id: number } | undefined;
	return row?.user_id;
}

/**
 * Creates an account without role and password, linked to the identity; undefined when another
 * request took the address or the identity in the meantime. A pending invitation to the address
 * goes: its link could only end in "account exists" now.
 */
export function createLinkedUser(
	db: DatabaseSync,
	email: string,
	issuer: string,
	subject: string
): number | undefined {
	return inTransaction(db, () => {
		if (accountExists(db, email) || linkedUser(db, issuer, subject) !== undefined) return undefined;
		db.prepare('DELETE FROM invitations WHERE email = ?').run(normalizeEmail(email));
		return insertLinkedUser(db, email, issuer, subject);
	});
}

/**
 * Inserts an account without role and password, linked to the identity. For a caller's own
 * transaction, which has checked that neither the address nor the identity is taken.
 */
export function insertLinkedUser(
	db: DatabaseSync,
	email: string,
	issuer: string,
	subject: string
): number {
	const userId = insertUser(db, email, null, []);
	db.prepare('INSERT INTO user_identities (user_id, issuer, subject) VALUES (?, ?, ?)').run(
		userId,
		issuer,
		subject
	);
	return userId;
}

/** The issuers the user has an identity at. */
export function linkedIssuers(db: DatabaseSync, userId: number): string[] {
	return (
		db
			.prepare('SELECT issuer FROM user_identities WHERE user_id = ? ORDER BY issuer')
			.all(userId) as { issuer: string }[]
	).map((row) => row.issuer);
}

// A change of the ways in ends the user's other sessions, as one of them may be the reason for it.
// Reset links stay: the password did not change, and a link the user just asked for keeps working.

/**
 * Links the identity to the user and ends the user's other sessions, except `keepSession`;
 * refused when it, or another one at that issuer, is taken.
 */
export function linkIdentity(
	db: DatabaseSync,
	userId: number,
	issuer: string,
	subject: string,
	keepSession?: string
): { error: 'oidc-identity-taken' } | undefined {
	return inTransaction(db, () => {
		const result = db
			.prepare(
				'INSERT INTO user_identities (user_id, issuer, subject) VALUES (?, ?, ?) ON CONFLICT DO NOTHING'
			)
			.run(userId, issuer, subject);
		if (result.changes !== 1) return { error: 'oidc-identity-taken' as const };
		endSessions(db, userId, keepSession);
		return undefined;
	});
}

/**
 * Removes the user's link to `issuer` and ends the user's other sessions, except `keepSession`.
 * Refused while it is the last way in: no password and no link to another of `configuredIssuers`.
 */
export function unlinkIdentity(
	db: DatabaseSync,
	userId: number,
	issuer: string,
	configuredIssuers: string[],
	keepSession?: string
): { error: 'last-sign-in' } | undefined {
	return inTransaction(db, () => {
		const others = linkedIssuers(db, userId).filter(
			(other) => other !== issuer && configuredIssuers.includes(other)
		);
		if (!hasPassword(db, userId) && others.length === 0) return { error: 'last-sign-in' as const };
		db.prepare('DELETE FROM user_identities WHERE user_id = ? AND issuer = ?').run(userId, issuer);
		endSessions(db, userId, keepSession);
		return undefined;
	});
}

/**
 * Removes a link of the user on an admin's behalf, the last way in too: the admin removes it on
 * purpose, such as after the provider changed. The user's sessions end, except `keepSession`: the
 * admin's own, when they remove a link of their own account.
 */
export function removeIdentity(
	db: DatabaseSync,
	userId: number,
	issuer: string,
	keepSession?: string
): boolean {
	return inTransaction(db, () => {
		const { changes } = db
			.prepare('DELETE FROM user_identities WHERE user_id = ? AND issuer = ?')
			.run(userId, issuer);
		if (changes === 0) return false;
		endSessions(db, userId, keepSession);
		return true;
	});
}
