import { describe, it, expect, beforeEach } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../db/schema';
import {
	acceptInvitation,
	invitedEmail,
	inviteUser,
	listInvitations,
	resendInvitation,
	revokeInvitation,
	type InvitationLink
} from './invitations';

let db: DatabaseSync;

const NOW = new Date('2026-11-03T09:00:00.000Z');
const PASSWORD = 'correct horse battery';
const ADMIN = 1;

function invite(email = 'Writer@Example.com', now = NOW): InvitationLink {
	const result = inviteUser(db, email, ADMIN, now);
	if ('error' in result) throw new Error(result.error);
	return result;
}

function users() {
	return db
		.prepare(
			`SELECT email, (SELECT count(*) FROM user_roles WHERE user_id = users.id) AS roles
			FROM users ORDER BY id`
		)
		.all()
		.map((row) => ({ ...row }));
}

beforeEach(() => {
	db = openDatabase(':memory:');
	db.exec(`INSERT INTO users (id, email, password_hash) VALUES (1, 'admin@example.com', 'hash');
		INSERT INTO user_roles VALUES (1, 'admin');`);
});

describe('inviteUser', () => {
	it('invites the address in lower case and lists it with the time it was sent', () => {
		const { to, token } = invite();
		expect(to).toBe('writer@example.com');
		expect(token).toMatch(/^[\w-]{43}$/);
		expect(listInvitations(db)).toEqual([
			{
				id: 1,
				email: 'writer@example.com',
				sentAt: '2026-11-03T09:00:00.000Z',
				expiresAt: '2026-11-10T09:00:00.000Z'
			}
		]);
	});

	it('stores only a hash of the token', () => {
		const { token } = invite();
		expect(JSON.stringify(db.prepare('SELECT * FROM invitations').all())).not.toContain(token);
	});

	it('refuses an address that is none, has an account or has an invitation waiting', () => {
		invite('writer@example.com');
		expect(inviteUser(db, 'writer', ADMIN, NOW)).toEqual({ error: 'email-invalid' });
		expect(inviteUser(db, 'Admin@example.com', ADMIN, NOW)).toEqual({ error: 'account-exists' });
		expect(inviteUser(db, 'writer@example.com ', ADMIN, NOW)).toEqual({
			error: 'invitation-exists'
		});
		expect(listInvitations(db)).toHaveLength(1);
	});
});

describe('acceptInvitation', () => {
	it('creates the invited account without roles and uses up the link', async () => {
		const { token } = invite();
		expect(invitedEmail(db, token, NOW)).toBe('writer@example.com');

		expect(await acceptInvitation(db, token, PASSWORD, NOW)).toEqual({
			email: 'writer@example.com'
		});
		expect(users()).toEqual([
			{ email: 'admin@example.com', roles: 1 },
			{ email: 'writer@example.com', roles: 0 }
		]);
		expect(listInvitations(db)).toEqual([]);
		expect(await acceptInvitation(db, token, PASSWORD, NOW)).toEqual({
			error: 'invite-link-invalid'
		});
	});

	it('refuses a password that is too short and keeps the link', async () => {
		const { token } = invite();
		expect(await acceptInvitation(db, token, 'short', NOW)).toEqual({
			error: 'password-too-short'
		});
		expect(invitedEmail(db, token, NOW)).toBe('writer@example.com');
	});

	it('refuses a link after 7 days, a replaced link and a withdrawn one', async () => {
		const expired = invite('old@example.com');
		const later = new Date(NOW.getTime() + 7 * 86_400_000);
		expect(await acceptInvitation(db, expired.token, PASSWORD, later)).toEqual({
			error: 'invite-link-invalid'
		});

		const first = invite();
		const second = resendInvitation(db, listInvitations(db)[0].id, NOW)!;
		expect(await acceptInvitation(db, first.token, PASSWORD, NOW)).toEqual({
			error: 'invite-link-invalid'
		});

		revokeInvitation(db, listInvitations(db)[0].id);
		expect(await acceptInvitation(db, second.token, PASSWORD, NOW)).toEqual({
			error: 'invite-link-invalid'
		});
		expect(users()).toHaveLength(1);
	});

	it('creates one account when the same link is submitted twice at once', async () => {
		const { token } = invite();
		const results = await Promise.all([
			acceptInvitation(db, token, PASSWORD, NOW),
			acceptInvitation(db, token, PASSWORD, NOW)
		]);
		expect(results).toContainEqual({ email: 'writer@example.com' });
		expect(results).toContainEqual({ error: 'invite-link-invalid' });
		expect(users()).toHaveLength(2);
	});
});

describe('resendInvitation', () => {
	it('replaces the link and the time it was sent', () => {
		invite();
		const [{ id }] = listInvitations(db);
		const later = new Date(NOW.getTime() + 86_400_000);
		const resent = resendInvitation(db, id, later)!;

		expect(resent.to).toBe('writer@example.com');
		expect(invitedEmail(db, resent.token, later)).toBe('writer@example.com');
		expect(listInvitations(db)[0]).toMatchObject({
			sentAt: '2026-11-04T09:00:00.000Z',
			expiresAt: '2026-11-11T09:00:00.000Z'
		});
		expect(resendInvitation(db, 99, later)).toBeUndefined();
	});
});
