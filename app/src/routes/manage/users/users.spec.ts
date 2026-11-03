import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { isHttpError } from '@sveltejs/kit';
import { openDatabase } from '#lib/server/db/schema.js';
import { invitedEmail, inviteUser, listInvitations } from '#lib/server/admin/invitations.js';
import { listUsers } from '#lib/server/admin/users.js';
import * as page from './+page.server';

let db: DatabaseSync;

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));
vi.mock('#lib/server/mail/index.js', () => ({ mailer: () => undefined }));
vi.mock('$app/env/private', () => ({ INSTANCE_NAME: 'Acme Docs', BASE_URL: '' }));

const ADMIN = { id: 1, email: 'admin@example.com', roles: ['admin'] };

function action(name: keyof typeof page.actions, id: number) {
	return page.actions[name]({
		request: new Request(`https://grimoire.example/manage/users?/${name}`, {
			method: 'POST',
			body: new URLSearchParams({ id: String(id) })
		}),
		locals: { user: ADMIN },
		url: new URL(`https://grimoire.example/manage/users?/${name}`)
	} as never) as Promise<Record<string, unknown> | undefined>;
}

beforeEach(() => {
	db = openDatabase(':memory:');
	db.exec(`INSERT INTO users (id, email, password_hash) VALUES
		(1, 'admin@example.com', 'hash'), (2, 'writer@example.com', 'hash');
		INSERT INTO user_roles VALUES (1, 'admin');`);
});

describe('users page', () => {
	it('lists users with roles and pending invitations with the time sent', () => {
		inviteUser(db, 'new@example.com', 1, new Date('2026-11-03T09:00:00.000Z'));
		expect(page.load({ locals: { user: ADMIN } } as never)).toMatchObject({
			users: [
				{ email: 'admin@example.com', roles: ['admin'] },
				{ email: 'writer@example.com', roles: [] }
			],
			invitations: [{ email: 'new@example.com', sentAt: '2026-11-03T09:00:00.000Z' }],
			me: 1
		});
	});

	it('sends an invitation again with a new link, which voids the old one', async () => {
		const first = inviteUser(db, 'new@example.com', 1) as { token: string };
		const [{ id }] = listInvitations(db);
		const result = (await action('resend', id)) as { invited: { link: string } };

		const token = result.invited.link.split('/invite/')[1];
		expect(invitedEmail(db, token)).toBe('new@example.com');
		expect(invitedEmail(db, first.token)).toBeUndefined();
	});

	it('withdraws an invitation', async () => {
		const { token } = inviteUser(db, 'new@example.com', 1) as { token: string };
		await action('withdraw', listInvitations(db)[0].id);
		expect(invitedEmail(db, token)).toBeUndefined();
		expect(isHttpError(await action('resend', 1).catch((error) => error))).toBe(true);
	});

	it('makes a user an admin and takes the role away, but not from the last admin', async () => {
		await action('promote', 2);
		expect(listUsers(db)[1].roles).toEqual(['admin']);
		await action('demote', 2);
		expect(await action('demote', 1)).toMatchObject({
			status: 400,
			data: { userError: 'The last admin keeps the role: make another user an admin first.' }
		});
		expect(listUsers(db)[0].roles).toEqual(['admin']);
	});

	it('deletes another user, but not the own account', async () => {
		expect(await action('delete', 1)).toMatchObject({
			status: 400,
			data: { userError: 'You cannot delete your own account.' }
		});
		await action('delete', 2);
		expect(listUsers(db).map((user) => user.email)).toEqual(['admin@example.com']);
		expect(isHttpError(await action('delete', 2).catch((error) => error))).toBe(true);
	});
});
