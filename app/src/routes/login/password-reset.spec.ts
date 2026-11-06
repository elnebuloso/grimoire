import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { isHttpError } from '@sveltejs/kit';
import { openDatabase } from '#lib/server/db/schema.js';
import type { Mailer } from '#lib/server/mail/index.js';

let db: DatabaseSync;
let mail: Mailer | undefined;
const send = vi.fn(async () => true);

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));
// The SMTP server is outside the test; whether a mailer exists is what the pages depend on.
vi.mock('#lib/server/mail/index.js', () => ({ mailer: () => mail }));
vi.mock('$app/env/private', () => ({
	INSTANCE_TITLE: 'Acme Docs',
	BASE_URL: '',
	OIDC_PROVIDERS: ''
}));

const EMAIL = 'admin@example.com';
const PASSWORD = 'correct horse battery';

// Request counts live in module state; every test starts with fresh modules.
async function load() {
	vi.resetModules();
	return {
		auth: await import('#lib/server/auth/auth.js'),
		passwordReset: await import('#lib/server/auth/password-reset.js'),
		login: await import('./+page.server'),
		forgot: await import('./forgot/+page.server'),
		reset: await import('./reset/[token]/+page.server'),
		account: await import('../account/+page.server')
	};
}
let pages: Awaited<ReturnType<typeof load>>;

// The first import transforms the modules, which on a busy machine took seconds, past the timeout
// of a hook or test; imports after `vi.resetModules` reuse the transforms and take milliseconds.
beforeAll(load, 60_000);

function event(path: string, fields?: Record<string, string>, params: Record<string, string> = {}) {
	return {
		request: new Request(`https://grimoire.example${path}`, {
			method: fields ? 'POST' : 'GET',
			body: fields && new URLSearchParams(fields)
		}),
		params,
		url: new URL(`https://grimoire.example${path}`),
		getClientAddress: () => 'client',
		setHeaders: vi.fn()
	} as never;
}

async function result(run: () => unknown): Promise<unknown> {
	try {
		return await run();
	} catch (thrown) {
		return thrown;
	}
}

function linkToken(): string {
	const [[{ text }]] = send.mock.calls as unknown as [[{ text: string }]];
	return text.match(/\/login\/reset\/([\w-]+)/)![1];
}

beforeEach(async () => {
	db = openDatabase(':memory:');
	send.mockClear();
	mail = { send, link: (path) => `https://grimoire.example.com${path}` };
	pages = await load();
	await pages.auth.createUser(db, { email: EMAIL, password: PASSWORD, roles: ['admin'] });
});

describe('without SMTP', () => {
	beforeEach(() => {
		mail = undefined;
	});

	it('offers no request of a reset: no link on the login page, 404 for its page', async () => {
		expect(await pages.login.load(event('/login'))).toMatchObject({ resetByMail: false });
		for (const run of [
			() => pages.forgot.load(event('/login/forgot')),
			() => pages.forgot.actions.default(event('/login/forgot', { email: EMAIL }))
		]) {
			const thrown = await result(run);
			expect(isHttpError(thrown) && thrown.status).toBe(404);
		}
	});

	it('sets a password through a link an admin created', async () => {
		const user = db.prepare('SELECT id FROM users').get() as { id: number };
		const { token } = pages.passwordReset.createPasswordLink(db, user.id)!;

		// Without mail, an invalid link can only point to an admin for a new one.
		expect(await pages.reset.load(event(`/login/reset/${token}`, undefined, { token }))).toEqual({
			valid: true,
			resetByMail: false,
			minPasswordLength: 12
		});
		expect(
			await pages.reset.actions.default(
				event(`/login/reset/${token}`, { password: 'a new password 2026' }, { token })
			)
		).toEqual({ done: true });
	});
});

describe('with SMTP', () => {
	it('mails a logged-in account its own link, the same as a forgotten password', async () => {
		const user = { id: 1, email: EMAIL, roles: ['admin'] };
		const sendLink = () =>
			pages.account.actions.passwordLink({
				...(event('/account?/passwordLink', {}) as object),
				locals: { user }
			} as never);

		expect(await sendLink()).toEqual({ linkSent: EMAIL });
		expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: EMAIL }));
		expect(
			await pages.reset.load(event('/login/reset/x', undefined, { token: linkToken() }))
		).toEqual({
			valid: true,
			resetByMail: true,
			minPasswordLength: 12
		});
		// Three links an hour reach one address, as for a forgotten password.
		await sendLink();
		await sendLink();
		expect(await sendLink()).toMatchObject({ status: 429 });
	});

	it('tells a logged-in account when its link could not be mailed', async () => {
		send.mockResolvedValueOnce(false);
		const user = { id: 1, email: EMAIL, roles: ['admin'] };

		const answer = await pages.account.actions.passwordLink({
			...(event('/account?/passwordLink', {}) as object),
			locals: { user }
		} as never);

		expect(answer).toMatchObject({
			status: 502,
			data: { error: expect.stringContaining('could not be sent') }
		});
	});

	it('links to the reset from the login page', async () => {
		expect(await pages.login.load(event('/login'))).toMatchObject({
			resetByMail: true,
			providers: []
		});
	});

	it('answers known and unknown addresses alike and mails a link only for a known one', async () => {
		const unknown = await pages.forgot.actions.default(
			event('/login/forgot', { email: 'nobody@example.com' })
		);
		expect(send).not.toHaveBeenCalled();

		const known = await pages.forgot.actions.default(event('/login/forgot', { email: EMAIL }));

		expect(known).toEqual(unknown);
		expect(send).toHaveBeenCalledWith({
			to: EMAIL,
			subject: 'Set a new password for Acme Docs',
			text: expect.stringContaining('https://grimoire.example.com/login/reset/')
		});
	});

	it('sets the new password through the mailed link and keeps it from leaking as referrer', async () => {
		await pages.forgot.actions.default(event('/login/forgot', { email: EMAIL }));
		const token = linkToken();
		const page = event(`/login/reset/${token}`, undefined, { token });

		expect(await pages.reset.load(page)).toEqual({
			valid: true,
			resetByMail: true,
			minPasswordLength: 12
		});
		expect((page as { setHeaders: ReturnType<typeof vi.fn> }).setHeaders).toHaveBeenCalledWith({
			'referrer-policy': 'same-origin'
		});
		expect(
			await pages.reset.actions.default(
				event(`/login/reset/${token}`, { password: 'staple battery horse' }, { token })
			)
		).toEqual({ done: true });
		expect(await pages.reset.load(event(`/login/reset/${token}`, undefined, { token }))).toEqual({
			valid: false,
			resetByMail: true,
			minPasswordLength: 12
		});
	});

	it('marks a used or unknown link so the page offers a new one', async () => {
		expect(
			await pages.reset.actions.default(
				event('/login/reset/guess', { password: 'staple battery horse' }, { token: 'guess' })
			)
		).toMatchObject({ status: 400, data: { linkInvalid: true } });
	});

	it('answers a client that asks too often with 429', async () => {
		for (let request = 0; request < 5; request++) {
			await pages.forgot.actions.default(event('/login/forgot', { email: EMAIL }));
		}

		expect(
			await pages.forgot.actions.default(event('/login/forgot', { email: EMAIL }))
		).toMatchObject({
			status: 429,
			data: { error: 'Too many requests for a new password. Try again later.' }
		});
	});
});
