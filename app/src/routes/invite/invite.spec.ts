import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { isRedirect } from '@sveltejs/kit';
import { openDatabase } from '#lib/server/db/schema.js';
import type { Mailer } from '#lib/server/mail/index.js';
import { listInvitations } from '#lib/server/admin/invitations.js';
import * as users from '../manage/users/+page.server';
import * as invite from './[token]/+page.server';

let db: DatabaseSync;
let mail: Mailer | undefined;
const send = vi.fn(async () => true);

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));
// The SMTP server is outside the test; whether a mailer exists and accepts is what matters here.
vi.mock('#lib/server/mail/index.js', () => ({ mailer: () => mail }));
vi.mock('$app/env/private', () => ({
	INSTANCE_TITLE: 'Acme Docs',
	BASE_URL: '',
	OIDC_PROVIDERS: ''
}));

const ADMIN = { id: 1, email: 'admin@example.com', roles: ['admin'] };
const PASSWORD = 'correct horse battery';

function inviteForm(email: string) {
	return users.actions.invite({
		request: new Request('https://grimoire.example/manage/users?/invite', {
			method: 'POST',
			body: new URLSearchParams({ email })
		}),
		locals: { user: ADMIN },
		url: new URL('https://grimoire.example/manage/users?/invite')
	} as never) as Promise<Record<string, unknown>>;
}

function accept(token: string, password: string) {
	const cookies = { set: vi.fn() };
	const run = invite.actions.default({
		request: new Request(`https://grimoire.example/invite/${token}`, {
			method: 'POST',
			body: new URLSearchParams({ password })
		}),
		params: { token },
		cookies,
		getClientAddress: () => 'client'
	} as never);
	return { run, cookies };
}

async function thrown(run: Promise<unknown>): Promise<unknown> {
	try {
		return await run;
	} catch (error) {
		return error;
	}
}

function mailedToken(): string {
	const [[{ text }]] = send.mock.calls as unknown as [[{ text: string }]];
	return text.match(/\/invite\/([\w-]+)/)![1];
}

beforeEach(() => {
	db = openDatabase(':memory:');
	db.exec(`INSERT INTO users (id, email, password_hash) VALUES (1, 'admin@example.com', 'hash');
		INSERT INTO user_roles VALUES (1, 'admin');`);
	send.mockClear();
	send.mockResolvedValue(true);
	mail = { send, link: (path) => `https://grimoire.example.com${path}` };
});

describe('inviting', () => {
	it('mails the link and shows no link to the admin', async () => {
		expect(await inviteForm('writer@example.com')).toEqual({
			invited: { email: 'writer@example.com', sent: true }
		});
		expect(send).toHaveBeenCalledWith(
			expect.objectContaining({
				to: 'writer@example.com',
				subject: 'Your invitation to Acme Docs',
				text: expect.stringContaining('https://grimoire.example.com/invite/')
			})
		);
		expect(users.load({ locals: { user: ADMIN } } as never)).toMatchObject({
			invitations: [{ email: 'writer@example.com' }]
		});
	});

	it('shows the link once without a mail server, or when the mail fails', async () => {
		mail = undefined;
		expect(await inviteForm('writer@example.com')).toEqual({
			invited: {
				email: 'writer@example.com',
				link: expect.stringMatching(/^https:\/\/grimoire\.example\/invite\/[\w-]{43}$/)
			}
		});

		mail = { send, link: (path) => `https://grimoire.example.com${path}` };
		send.mockResolvedValue(false);
		expect(await inviteForm('ops@example.com')).toMatchObject({
			invited: { email: 'ops@example.com', mailFailed: true }
		});
	});

	it('refuses an address that already has an account', async () => {
		expect(await inviteForm('admin@example.com')).toMatchObject({
			status: 400,
			data: { error: 'This email address already has an account.' }
		});
		expect(send).not.toHaveBeenCalled();
	});
});

describe('accepting', () => {
	it('shows the invited address, creates the account, logs it in and welcomes it at its API keys', async () => {
		await inviteForm('writer@example.com');
		const token = mailedToken();
		expect(invite.load({ params: { token }, setHeaders: vi.fn() } as never)).toEqual({
			email: 'writer@example.com',
			providers: [],
			token
		});

		const { run, cookies } = accept(token, PASSWORD);
		const result = await thrown(run);
		expect(isRedirect(result) && result.location).toBe('/account/api-keys?welcome');
		expect(cookies.set).toHaveBeenCalledWith(
			'grimoire_session',
			expect.any(String),
			expect.anything()
		);
		expect(listInvitations(db)).toEqual([]);
	});

	it('keeps the link for a password that is too short, and refuses a used one', async () => {
		await inviteForm('writer@example.com');
		const token = mailedToken();

		expect(await accept(token, 'short').run).toMatchObject({
			status: 400,
			data: { linkInvalid: false }
		});
		await thrown(accept(token, PASSWORD).run);
		expect(await accept(token, PASSWORD).run).toMatchObject({
			status: 400,
			data: { linkInvalid: true }
		});
		expect(invite.load({ params: { token }, setHeaders: vi.fn() } as never)).toEqual({
			email: undefined,
			providers: [],
			token
		});
	});
});
