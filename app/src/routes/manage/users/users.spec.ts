import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { isHttpError } from '@sveltejs/kit';
import { openDatabase } from '#lib/server/db/schema.js';
import { invitedEmail, inviteUser, listInvitations } from '#lib/server/admin/invitations.js';
import { listUsers } from '#lib/server/admin/users.js';
import { resetLinkValid } from '#lib/server/auth/password-reset.js';
import { login } from '#lib/server/auth/auth.js';
import { createUser } from '#lib/server/auth/test-user.js';
import * as page from './+page.server';

let db: DatabaseSync;

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));
vi.mock('#lib/server/mail/index.js', () => ({ mailer: () => undefined }));
vi.mock('$app/env/private', () => ({ INSTANCE_TITLE: 'Acme Docs', BASE_URL: '' }));

const ADMIN = { id: 1, email: 'admin@example.com', roles: ['admin'] };
const PASSWORD = 'correct horse battery';
let session: string;

function action(name: keyof typeof page.actions, id: number, fields: Record<string, string> = {}) {
	return page.actions[name]({
		request: new Request(`https://grimoire.example/manage/users?/${name}`, {
			method: 'POST',
			body: new URLSearchParams({ id: String(id), ...fields })
		}),
		locals: { user: ADMIN },
		cookies: { get: (name: string) => (name === 'grimoire_session' ? session : undefined) },
		getClientAddress: () => '203.0.113.7',
		url: new URL(`https://grimoire.example/manage/users?/${name}`)
	} as never) as Promise<Record<string, unknown> | undefined>;
}

beforeEach(async () => {
	db = openDatabase(':memory:');
	await createUser(db, { email: ADMIN.email, password: PASSWORD, roles: ['admin'] });
	db.exec("INSERT INTO users (id, email, password_hash) VALUES (2, 'writer@example.com', 'hash')");
	const loggedIn = await login(db, 'admin-pc', { email: ADMIN.email, password: PASSWORD });
	if (!('session' in loggedIn)) throw new Error(loggedIn.error);
	session = loggedIn.session;
});

describe('users page', () => {
	it('lists users with roles and pending invitations with the time sent', () => {
		inviteUser(db, 'new@example.com', 1, new Date('2026-11-03T09:00:00.000Z'));
		const load = (search = '') =>
			page.load({
				locals: { user: ADMIN },
				url: new URL(`https://grimoire.example/manage/users${search}`)
			} as never);
		expect(load('?role=user')).toMatchObject({
			users: { rows: [{ email: 'writer@example.com' }], total: 1 }
		});
		expect(load()).toMatchObject({
			users: {
				rows: [
					{ email: 'admin@example.com', roles: ['admin'], keys: 0 },
					{ email: 'writer@example.com', roles: [], keys: 0 }
				]
			},
			invitations: [{ email: 'new@example.com', sentAt: '2026-11-03T09:00:00.000Z' }],
			me: 1,
			tab: 'users',
			mailConfigured: false
		});
		expect(load('?tab=invitations')).toMatchObject({ tab: 'invitations' });
		expect(load('?tab=other')).toMatchObject({ tab: 'users' });
	});

	it('sends an invitation again with a new link, which voids the old one', async () => {
		const first = inviteUser(db, 'new@example.com', 1) as { token: string };
		const [{ id }] = listInvitations(db);
		const result = (await action('resend', id)) as { invited: { link: string }; resent: true };
		expect(result.resent).toBe(true);

		const token = result.invited.link.split('/invite/')[1];
		expect(invitedEmail(db, token)).toBe('new@example.com');
		expect(invitedEmail(db, first.token)).toBeUndefined();
	});

	it('creates a link to set the password of an account, shown once without a mail server', async () => {
		const first = (await action('passwordLink', 2)) as { passwordLink: { link: string } };
		const second = (await action('passwordLink', 2)) as {
			passwordLink: { email: string; link: string };
		};

		expect(second.passwordLink.email).toBe('writer@example.com');
		expect(second.passwordLink.link).toMatch(/^https:\/\/grimoire\.example\/login\/reset\/[\w-]+$/);
		const token = (result: { passwordLink: { link: string } }) =>
			result.passwordLink.link.split('/login/reset/')[1];
		expect(resetLinkValid(db, token(second))).toBe(true);
		expect(resetLinkValid(db, token(first))).toBe(false);
		const thrown = await action('passwordLink', 99).catch((error) => error);
		expect(isHttpError(thrown) && thrown.status).toBe(404);
	});

	it('refuses a password link for the own account, also when sent without the page', async () => {
		const thrown = await action('passwordLink', ADMIN.id).catch((error) => error);

		expect(isHttpError(thrown) && thrown.status).toBe(403);
		expect(db.prepare('SELECT count(*) AS n FROM password_resets').get()).toEqual({ n: 0 });
	});

	it('withdraws an invitation', async () => {
		const { token } = inviteUser(db, 'new@example.com', 1) as { token: string };
		await action('withdraw', listInvitations(db)[0].id);
		expect(invitedEmail(db, token)).toBeUndefined();
		expect(isHttpError(await action('resend', 1).catch((error) => error))).toBe(true);
		expect(isHttpError(await action('withdraw', 1).catch((error) => error), 404)).toBe(true);
	});

	it('removes a link of a user, and answers 404 for one already gone', async () => {
		db.exec("INSERT INTO user_identities VALUES (2, 'https://gitlab.example.com', '42')");
		const unlink = () => action('unlink', 2, { issuer: 'https://gitlab.example.com' });

		await unlink();
		expect(isHttpError(await unlink().catch((error) => error), 404)).toBe(true);
	});

	it('makes a user an admin and takes the role away, but not from the last admin', async () => {
		await action('promote', 2, { current: PASSWORD });
		expect(listUsers(db)[1].roles).toEqual(['admin']);
		await action('demote', 2);
		expect(await action('demote', 1)).toMatchObject({
			status: 400,
			data: { error: 'The last admin keeps the role: make another user an admin first.' }
		});
		expect(listUsers(db)[0].roles).toEqual(['admin']);
	});

	it('makes nobody an admin without the current password of the admin', async () => {
		for (const current of [undefined, 'wrong password']) {
			expect(await action('promote', 2, current ? { current } : {})).toMatchObject({
				status: 400,
				data: { error: 'Wrong current password.' }
			});
		}
		expect(listUsers(db)[1].roles).toEqual([]);
	});

	it('asks for the current password before a password link for another admin only', async () => {
		db.exec("INSERT INTO user_roles VALUES (2, 'admin')");
		expect(await action('passwordLink', 2)).toMatchObject({
			status: 400,
			data: { error: 'Wrong current password.' }
		});
		expect(db.prepare('SELECT count(*) AS n FROM password_resets').get()).toEqual({ n: 0 });
		expect(await action('passwordLink', 2, { current: PASSWORD })).toHaveProperty('passwordLink');

		db.exec('DELETE FROM user_roles WHERE user_id = 2');
		expect(await action('passwordLink', 2)).toHaveProperty('passwordLink');
	});

	it('deletes another user, but not the own account', async () => {
		expect(await action('delete', 1)).toMatchObject({
			status: 400,
			data: { error: 'You cannot delete your own account.' }
		});
		await action('delete', 2);
		expect(listUsers(db).map((user) => user.email)).toEqual(['admin@example.com']);
		expect(isHttpError(await action('delete', 2).catch((error) => error))).toBe(true);
	});
});
