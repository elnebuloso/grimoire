import { describe, it, expect, beforeEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../db/schema';
import { createSession, sessionUser } from '../auth/auth';
import { createPasswordLink } from '../auth/password-reset';
import { inviteUser, listInvitations } from '../admin/invitations';
import {
	createLinkedUser,
	linkedIssuers,
	linkIdentity,
	removeIdentity,
	unlinkIdentity
} from './identities';

const GITLAB = 'https://gitlab.example.com';
const ENTRA = 'https://login.microsoftonline.com/7f1d3a52-9b1e-4c8a-a6f0-2d5e8b9c1a44/v2.0';
let db: DatabaseSync;

beforeEach(() => {
	db = openDatabase(':memory:');
	db.exec(`INSERT INTO users (id, email, password_hash) VALUES
		(1, 'ada@example.com', 'hash'), (2, 'grace@example.com', NULL)`);
});

describe('createLinkedUser', () => {
	it('withdraws a pending invitation to the address it creates an account for', () => {
		inviteUser(db, 'Partner@Partner.example', 1);
		inviteUser(db, 'other@partner.example', 1);

		createLinkedUser(db, 'partner@partner.example', GITLAB, 'partner');

		expect(listInvitations(db).map((invitation) => invitation.email)).toEqual([
			'other@partner.example'
		]);
	});
});

describe('linkIdentity', () => {
	it('links one identity per provider, and each identity to one user', () => {
		expect(linkIdentity(db, 1, GITLAB, '42')).toBeUndefined();
		expect(linkIdentity(db, 1, ENTRA, 'ada-at-entra')).toBeUndefined();

		expect(linkIdentity(db, 2, GITLAB, '42')).toEqual({ error: 'oidc-identity-taken' });
		expect(linkIdentity(db, 1, GITLAB, '43')).toEqual({ error: 'oidc-identity-taken' });
		expect(linkedIssuers(db, 1)).toEqual([GITLAB, ENTRA].sort());
		expect(linkedIssuers(db, 2)).toEqual([]);
	});
});

describe('changing the ways in', () => {
	function resetLinks(userId: number) {
		return db.prepare('SELECT count(*) AS n FROM password_resets WHERE user_id = ?').get(userId);
	}

	it('ends the other sessions on a link and keeps the reset links', () => {
		const current = createSession(db, 1, new Date());
		const other = createSession(db, 1, new Date());
		createPasswordLink(db, 1);

		expect(linkIdentity(db, 1, GITLAB, '42', current)).toBeUndefined();
		expect(sessionUser(db, current)).toBeDefined();
		expect(sessionUser(db, other)).toBeUndefined();
		expect(resetLinks(1)).toEqual({ n: 1 });
	});

	it('keeps the session of an admin who removes a link of their own account', () => {
		linkIdentity(db, 1, GITLAB, '42');
		const admin = createSession(db, 1, new Date());
		const other = createSession(db, 1, new Date());
		createPasswordLink(db, 1);

		removeIdentity(db, 1, GITLAB, admin);
		expect(sessionUser(db, admin)).toBeDefined();
		expect(sessionUser(db, other)).toBeUndefined();
		expect(resetLinks(1)).toEqual({ n: 1 });
	});
});

describe('unlinkIdentity', () => {
	it('removes a link while a password remains, and ends every other session', () => {
		linkIdentity(db, 1, GITLAB, '42');
		const current = createSession(db, 1, new Date());
		const other = createSession(db, 1, new Date());

		expect(unlinkIdentity(db, 1, GITLAB, [GITLAB], current)).toBeUndefined();
		expect(linkedIssuers(db, 1)).toEqual([]);
		expect(sessionUser(db, current)).toBeDefined();
		expect(sessionUser(db, other)).toBeUndefined();
	});

	it('keeps the last way in of an account without a password', () => {
		linkIdentity(db, 2, GITLAB, '7');
		linkIdentity(db, 2, ENTRA, 'grace-at-entra');

		// A link to a provider no longer configured is no way in.
		expect(unlinkIdentity(db, 2, GITLAB, [GITLAB])).toEqual({ error: 'last-sign-in' });
		expect(unlinkIdentity(db, 2, ENTRA, [GITLAB, ENTRA])).toBeUndefined();
		expect(unlinkIdentity(db, 2, GITLAB, [GITLAB, ENTRA])).toEqual({ error: 'last-sign-in' });
		expect(linkedIssuers(db, 2)).toEqual([GITLAB]);
	});

	it('ends every session when an admin removes the link', () => {
		linkIdentity(db, 1, GITLAB, '42');
		const session = createSession(db, 1, new Date());

		expect(unlinkIdentity(db, 1, GITLAB, [GITLAB])).toBeUndefined();
		expect(sessionUser(db, session)).toBeUndefined();
	});
});

describe('removeIdentity', () => {
	it('removes even the last way in, and ends every session of the user', () => {
		linkIdentity(db, 2, GITLAB, '7');
		const session = createSession(db, 2, new Date());

		removeIdentity(db, 2, GITLAB);

		expect(linkedIssuers(db, 2)).toEqual([]);
		expect(sessionUser(db, session)).toBeUndefined();
	});
});
