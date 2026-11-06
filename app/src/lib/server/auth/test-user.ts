// For specs and e2e tests only: the product creates users through setup, invitations and identity
// providers, each checking the address first. Plain Node loads it from the e2e tests, hence the
// relative imports with their extension.
import type { DatabaseSync } from 'node:sqlite';
import { inTransaction } from '../db/transaction.ts';
import { hashPassword, insertUser, type Role } from './auth.ts';

/** Creates a user with the given roles; the email address must be free. Returns the new id. */
export async function createUser(
	db: DatabaseSync,
	form: { email: string; password: string; roles: Role[] }
): Promise<number> {
	const passwordHash = await hashPassword(form.password);
	return inTransaction(db, () => insertUser(db, form.email, passwordHash, form.roles));
}
