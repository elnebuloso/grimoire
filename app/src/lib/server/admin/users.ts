import type { DatabaseSync } from 'node:sqlite';
import { inTransaction } from '../db/transaction.ts';
import type { Role } from './auth.ts';

export interface UserSummary {
	id: number;
	email: string;
	roles: Role[];
	hasPassword: boolean;
	/** The issuers of the identity providers the user is linked to. */
	issuers: string[];
}

/**
 * Why a change to a user was refused: it would leave no admin, which reopens the setup to whoever
 * reads the server log, or an admin would delete their own account.
 */
export type UserRefusal = { error: 'last-admin' } | { error: 'self' } | { error: 'unknown-user' };

export function listUsers(db: DatabaseSync): UserSummary[] {
	const rows = db
		.prepare(
			`SELECT id, email, password_hash IS NOT NULL AS has_password,
				(SELECT json_group_array(role) FROM user_roles WHERE user_id = users.id) AS roles,
				(SELECT json_group_array(issuer) FROM user_identities WHERE user_id = users.id) AS issuers
			FROM users ORDER BY email`
		)
		.all() as { id: number; email: string; has_password: number; roles: string; issuers: string }[];
	return rows.map((row) => ({
		id: row.id,
		email: row.email,
		roles: JSON.parse(row.roles) as Role[],
		hasPassword: row.has_password === 1,
		issuers: JSON.parse(row.issuers) as string[]
	}));
}

function isAdmin(db: DatabaseSync, userId: number): boolean {
	return (
		db.prepare("SELECT 1 FROM user_roles WHERE user_id = ? AND role = 'admin'").get(userId) !==
		undefined
	);
}

function isLastAdmin(db: DatabaseSync, userId: number): boolean {
	const { admins } = db
		.prepare("SELECT count(*) AS admins FROM user_roles WHERE role = 'admin'")
		.get() as { admins: number };
	return admins === 1 && isAdmin(db, userId);
}

/** Gives a user the role `admin` or takes it away; never from the last admin. */
export function setAdmin(
	db: DatabaseSync,
	userId: number,
	admin: boolean
): UserRefusal | undefined {
	return inTransaction(db, () => {
		if (!db.prepare('SELECT 1 FROM users WHERE id = ?').get(userId)) {
			return { error: 'unknown-user' as const };
		}
		if (admin) {
			db.prepare("INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?, 'admin')").run(
				userId
			);
			return undefined;
		}
		if (isLastAdmin(db, userId)) return { error: 'last-admin' as const };
		db.prepare("DELETE FROM user_roles WHERE user_id = ? AND role = 'admin'").run(userId);
		return undefined;
	});
}

/**
 * Deletes a user on behalf of the admin `deletedBy`: their API keys, sessions and reset links go
 * with them. Never the admin's own account or the last admin.
 */
export function deleteUser(
	db: DatabaseSync,
	userId: number,
	deletedBy: number
): UserRefusal | undefined {
	if (userId === deletedBy) return { error: 'self' };
	return inTransaction(db, () => {
		if (!db.prepare('SELECT 1 FROM users WHERE id = ?').get(userId)) {
			return { error: 'unknown-user' as const };
		}
		if (isLastAdmin(db, userId)) return { error: 'last-admin' as const };
		db.prepare('DELETE FROM users WHERE id = ?').run(userId);
		return undefined;
	});
}
